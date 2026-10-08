import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowRight, Loader2, Mail, UserX, Eye, EyeOff, KeyRound, Shield } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { FormEvent, ReactNode } from "react";

type Method = "password" | "email" | "guest";
type PasswordFlow = "signIn" | "signUp" | "reset" | "reset-code";
type EmailStep = "signIn" | "sent";
interface AuthProps { redirectAfterAuth?: string }

function resolveRedirect(returnTo: string | null, fallback = "/dashboard"): string {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) return returnTo
  return fallback
}

export default function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = resolveRedirect(searchParams.get("returnTo"), redirectAfterAuth)

  const [method, setMethod] = useState<Method>("password")
  const [passwordFlow, setPasswordFlow] = useState<PasswordFlow>("signIn")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [otp, setOtp] = useState("")
  const [resetCode, setResetCode] = useState("")
  const [load, setLoad] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  // Email-OTP flows
  const [emailStep, setEmailStep] = useState<EmailStep>("signIn")
  const [otpSentEmail, setOtpSentEmail] = useState("")

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate(redirect)
  }, [authLoading, isAuthenticated, navigate, redirect])

  // Reset volatile UI when switching methods
  useEffect(() => {
    if (method !== "email") setEmailStep("signIn")
    if (method !== "password") setPasswordFlow("signIn")
    setErr(null)
    setServerError(null)
    setOtp("")
  }, [method])

  const showError = (msg: string) => {
    console.error("auth error", msg)
    setErr(msg)
    setServerError(msg)
  }

  // ---------- PASSWORD ----------
  const runPasswordForm = async (formData: FormData) => {
    setLoad(true); setServerError(null)
    try {
      await signIn("password", formData)
      if (passwordFlow === "reset" || passwordFlow === "reset-code") {
        toast.success("If the email is registered, check your inbox for a reset link.")
        setPasswordFlow("signIn"); setResetCode(""); setOtp("")
      } else {
        toast.success("Signed in")
        navigate(redirect)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not sign in"
      showError(msg)
    } finally {
      setLoad(false)
    }
  }

  const handlePasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (passwordFlow === "signUp" && password !== confirmPassword) {
      setErr("Passwords don't match"); return
    }
    if (!email || !password) { setErr("Enter an email and password"); return }
    runPasswordForm(new FormData(e.currentTarget))
  }

  const handleResetCodeSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!resetCode) { setErr("Enter the reset code from the email"); return }
    const fd = new FormData()
    fd.set("email", email)
    fd.set("code", resetCode)
    if (password) fd.set("newPassword", password)
    runPasswordForm(fd)
  }

  // ---------- EMAIL-OTP ----------
  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoad(true); setServerError(null)
    try {
      const fd = new FormData(e.currentTarget)
      await signIn("email-otp", fd)
      setEmailStep("sent")
      setOtpSentEmail(email)
      toast.success("Check your email for the sign-in code")
    } catch (e) {
      showError(e instanceof Error ? e.message : "Could not send the code")
    } finally {
      setLoad(false)
    }
  }

  const handleOtpSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoad(true); setServerError(null)
    try {
      const fd = new FormData(e.currentTarget)
      await signIn("email-otp", fd)
      setOtp("")
      toast.success("Signed in")
      navigate(redirect)
    } catch (e) {
      showError("That code didn't match. Check it and try again.")
      setOtp("")
    } finally {
      setLoad(false)
    }
  }

  const sendNewCode = async () => {
    if (!otpSentEmail) return
    setLoad(true); setServerError(null)
    try {
      const fd = new FormData()
      fd.set("email", otpSentEmail)
      await signIn("email-otp", fd)
      toast.success("New code sent")
    } catch (e) {
      showError(e instanceof Error ? e.message : "Could not send the code")
    } finally {
      setLoad(false)
    }
  }

  // ---------- GUEST ----------
  const handleGuest = async () => {
    setLoad(true); setServerError(null)
    try {
      await signIn("anonymous")
      toast.success("Guest session started")
      navigate(redirect)
    } catch (e) {
      showError(e instanceof Error ? e.message : "Guest sign-in failed")
    } finally {
      setLoad(false)
    }
  }

  const MethodIcon: Record<Method, ReactNode> = {
    password: <KeyRound className="size-4" />,
    email: <Shield className="size-4" />,
    guest: <UserX className="size-4" />,
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="absolute right-4 top-4 z-10"><ThemeToggle /></div>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">

          {/* method picker tabs */}
          <div className="flex items-center justify-center gap-1 rounded-lg border border-border/70 bg-card p-1 shadow-sm">
            {(["password","email","guest"] as Method[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setMethod(m); setErr(null) }}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  method === m
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  {MethodIcon[m]}
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </span>
              </button>
            ))}
          </div>

          {serverError && (
            <div className="mt-3 rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-2 text-sm text-rose-700">
              {serverError}
            </div>
          )}

          <Card className="border shadow-md">
            <CardHeader className="text-center">
              <CardTitle className="text-base">
                {method === "password" ? "Sign in with password" :
                 method === "email" ? "Email code" : "Guest access"}
              </CardTitle>
              <CardDescription className="text-sm">
                {method === "password"
                  ? (passwordFlow === "signUp"
                    ? "Create an account with an email and password."
                    : passwordFlow === "reset"
                    ? "Enter your email and we'll send a reset link."
                    : passwordFlow === "reset-code"
                    ? "Enter the reset code and a new password."
                    : "Sign in with your email and password.")
                  : method === "email"
                    ? (emailStep === "signIn"
                      ? "We'll send a one-time code to your email."
                      : "Enter the code we just sent you.")
                    : "Continue without creating an account."}
              </CardDescription>
            </CardHeader>

            {/* PASSWORD FORM */}
            {method === "password" && (
              <form onSubmit={handlePasswordSubmit}>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-email">Email</Label>
                    <Input
                      id="confirm-email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setErr(null) }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="password-input">
                      {passwordFlow === "reset-code" ? "New password" : "Password"}
                    </Label>
                    <div className="relative">
                      <input
                        id="password-input"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setErr(null) }}
                        placeholder={passwordFlow === "signUp"
                          ? "Create a password"
                          : "Enter your password"}
                        className="peer w-full h-9 rounded-md border border-border/70 bg-background px-3 text-sm outline-none focus:border-ring focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={load}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                        onClick={() => setShowPassword(v => !v)}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {passwordFlow === "signUp" && (
                    <div className="grid gap-2">
                      <Label htmlFor="confirm-password">Confirm password</Label>
                      <div className="relative">
                        <input
                          id="confirm-password"
                          name="confirmPassword"
                          type={showConfirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={e => { setConfirmPassword(e.target.value); setErr(null) }}
                          placeholder="Confirm your password"
                          className="peer w-full h-9 rounded-md border border-border/70 bg-background px-3 text-sm outline-none focus:border-ring focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={load}
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                          onClick={() => setShowConfirm(v => !v)}
                        >
                          {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {err && <p className="text-sm text-rose-600">{err}</p>}
                </CardContent>

                <CardFooter className="flex-col gap-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={load || !email || !password || (passwordFlow === "signUp" && password !== confirmPassword)}
                  >
                    {load ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing…</>
                    ) : (
                      <>
                        {passwordFlow === "signUp" ? "Create account" :
                         passwordFlow === "reset-code" ? "Reset password" :
                         passwordFlow === "reset" ? "Send reset email" : "Sign in"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <div className="flex flex-col gap-1">
                    {passwordFlow === "signUp" ? (
                      <Button type="button" variant="ghost" className="w-full" onClick={() => setPasswordFlow("signIn")} disabled={load}>
                        Already have an account? Sign in
                      </Button>
                    ) : (
                      <Button type="button" variant="ghost" className="w-full" onClick={() => setPasswordFlow("signUp")} disabled={load}>
                        Don't have an account? Create one
                      </Button>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-muted-foreground"
                        onClick={() => setPasswordFlow("reset")}
                        disabled={load}
                      >
                        Forgot password?
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="flex-1 justify-start"
                        onClick={handleGuest}
                        disabled={load}
                      >
                        <UserX className="mr-1.5 h-4 w-4" />
                        Continue as guest
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </form>
            )}

            {/* EMAIL-OTP FORM */}
            {method === "email" && (
              <>
                {emailStep === "signIn" ? (
                  <form onSubmit={handleEmailSubmit}>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="email-otp">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            id="email-otp"
                            name="email"
                            type="email"
                            value={email}
                            onChange={e => { setEmail(e.target.value); setErr(null) }}
                            placeholder="you@example.com"
                            className="peer w-full h-9 rounded-md border border-border/70 bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={load}
                            required
                            autoComplete="email"
                          />
                        </div>
                      </div>
                      {err && <p className="text-sm text-rose-600">{err}</p>}
                    </CardContent>
                    <CardFooter className="flex-col gap-2">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={load || !email}
                      >
                        {load ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send code"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <div className="flex gap-2">
                        <Button type="button" variant="ghost" className="flex-1 justify-start" onClick={handleGuest} disabled={load}>
                          <UserX className="mr-1.5 h-4 w-4" />
                          Guest
                        </Button>
                        <Button type="button" variant="ghost" className="flex-1 justify-start" onClick={() => setMethod("password")} disabled={load}>
                          <KeyRound className="mr-1.5 h-4 w-4" />
                          Password
                        </Button>
                      </div>
                    </CardFooter>
                  </form>
                ) : (
                  <form onSubmit={handleOtpSubmit}>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground text-center">
                        Sent a code to {otpSentEmail || email}
                      </p>
                      <div className="flex justify-center">
                        <InputOTP
                          value={otp}
                          onChange={setOtp}
                          maxLength={6}
                          disabled={load}
                          onKeyDown={e => {
                            if (e.key === "Enter" && otp.length === 6 && !load) {
                              (e.currentTarget as HTMLInputElement).closest("form")?.requestSubmit()
                            }
                          }}
                        >
                          <InputOTPGroup>
                            {Array.from({ length: 6 }).map((_, i) => (
                              <InputOTPSlot key={i} index={i} />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      {err && <p className="text-sm text-rose-600 text-center">{err}</p>}
                      <p className="text-sm text-center text-muted-foreground">
                        Didn't get a code?{" "}
                        <button
                          type="button"
                          className="underline text-foreground hover:no-underline disabled:text-muted-foreground disabled:cursor-not-allowed"
                          disabled={load}
                          onClick={sendNewCode}
                        >
                          Resend
                        </button>
                      </p>
                    </CardContent>
                    <CardFooter className="flex-col gap-2">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={load || otp.length !== 6}
                      >
                        {load ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify code"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={() => { setEmailStep("signIn"); setOtp(""); setErr(null) }}
                        disabled={load}
                      >
                        Change email
                      </Button>
                      <div className="flex gap-2">
                        <Button type="button" variant="ghost" className="flex-1 justify-start" onClick={() => setMethod("password")} disabled={load}>
                          <KeyRound className="mr-1.5 h-4 w-4" />
                          Password
                        </Button>
                        <Button type="button" variant="ghost" className="flex-1 justify-start" onClick={handleGuest} disabled={load}>
                          <UserX className="mr-1.5 h-4 w-4" />
                          Guest
                        </Button>
                      </div>
                    </CardFooter>
                  </form>
                )}
              </>
            )}

            {/* GUEST */}
            {method === "guest" && (
              <form onSubmit={e => e.preventDefault()}>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Sign in as a guest to try the app with no account. Your work
                    won't be saved to an email.
                  </p>
                  <div className="flex flex-col gap-3">
                    <Button
                      type="button"
                      className="w-full gap-2"
                      onClick={handleGuest}
                      disabled={load}
                    >
                      <UserX className="h-4 w-4" />
                      {load ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue as guest"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setMethod("password")}
                      disabled={load}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      Sign in with password
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setMethod("email")}
                      disabled={load}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Sign in with email code
                    </Button>
                  </div>
                  {err && <p className="text-sm text-rose-600">{err}</p>}
                </CardContent>
              </form>
            )}
          </Card>

          {/* Logo */}
          <div className="mt-6 text-center">
            <img
              src="/assets/Gradient_Arch_Folder_Emblem.png"
              alt="ADR Cascade"
              width={44}
              height={44}
              className="mx-auto rounded-lg object-contain shadow-sm cursor-pointer transition-opacity hover:opacity-90"
              onClick={() => navigate("/")}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              <button type="button" className="underline hover:no-underline w-full text-left" onClick={() => navigate("/")}>
                Back to home
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AuthPage(props: AuthProps) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>}>
      <Auth {...props} />
    </Suspense>
  )
}
