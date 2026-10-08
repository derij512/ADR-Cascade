import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { ChevronRight, Home, LogOut, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";

/**
 * Sticky top bar shared by the authenticated pages: brand on the left,
 * optional breadcrumb/context next to it, account menu on the right.
 */
export function AppHeader({ context }: { context?: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  const initial = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            title="All projects"
          >
            <img
              src="/assets/Gradient_Arch_Folder_Emblem.png"
              alt="ADR Cascade"
              width={28}
              height={28}
              className="rounded-[7px] shadow-sm object-contain"
            />
            <span className="text-sm font-semibold tracking-tight">
              ADR Cascade
            </span>
          </button>
          {context ? (
            <>
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
              <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                {context}
              </div>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 gap-2 rounded-full pr-2 pl-1.5 text-sm"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                {initial}
              </span>
              <span className="hidden max-w-[10rem] truncate text-muted-foreground sm:inline">
                {user?.email || user?.name || "Account"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
              {user?.email || user?.name || "Signed in"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/")}>
              <Home className="size-4" />
              Landing page
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
