import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useTheme } from "next-themes";
import {
  ArrowLeft,
  Loader2,
  LogOut,
  Moon,
  Monitor,
  Sun,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <div className="flex items-center gap-2">
      {options.map((option) => {
        const active = theme === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            variant={active ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme(option.value)}
            className={active ? "shadow-sm" : ""}
          >
            <option.icon className="size-4 mr-1.5" />
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const updateProfile = useMutation(api.users.updateProfile);
  const [name, setName] = useState((user?.name ?? "").trim());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveName = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await updateProfile({ name: name || undefined });
      toast.success("Profile updated");
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update profile",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const methodLabel =
    user?.isAnonymous ? "Guest (anonymous)" : "Email & password";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All projects
        </button>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Account
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Settings
          </h1>
        </div>

        <div className="mt-6 space-y-4">
          {/* Account section */}
          <div className="rounded-xl border border-border/70 bg-card p-5 shadow-xs">
            <h2 className="text-sm font-semibold tracking-tight">Account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update your display name. Email cannot be changed here.
            </p>

            <form onSubmit={handleSaveName} className="mt-4 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  maxLength={120}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border/70 pt-4">
                <div className="text-xs text-muted-foreground">
                  {saved ? (
                    <span className="text-emerald-600 font-medium">Saved</span>
                  ) : (
                    <span />
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={
                      saving || name === (user?.name ?? "") || !name.trim()
                    }
                  >
                    {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
                    Save name
                  </Button>
                </div>
              </div>
            </form>

            <Separator className="my-4" />

            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Email
                </dt>
                <dd className="mt-1 font-mono text-sm break-all">
                  {user?.email || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Sign-in method
                </dt>
                <dd className="mt-1 text-sm">{methodLabel}</dd>
              </div>
              {user?.isAnonymous && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    Session
                  </dt>
                  <dd className="mt-1 text-sm text-amber-600">
                    Guest session — no account is created.
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Appearance section */}
          <div className="rounded-xl border border-border/70 bg-card p-5 shadow-xs">
            <h2 className="text-sm font-semibold tracking-tight">
              Appearance
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose how the interface looks across the app.
            </p>
            <div className="mt-4">
              <ThemeSwitcher />
            </div>
          </div>

          {/* Danger zone */}
          <div className="rounded-xl border border-border/70 bg-card p-5 shadow-xs">
            <h2 className="text-sm font-semibold tracking-tight text-destructive">
              Danger zone
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign out of your current session.
            </p>
            <div className="mt-4">
              <Button type="button" variant="outline" onClick={handleSignOut}>
                <LogOut className="size-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
