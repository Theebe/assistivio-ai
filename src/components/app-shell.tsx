import { Link, useRouterState } from "@tanstack/react-router";
import {
  BadgeHelp,
  Bot,
  CalendarCheck,
  LayoutDashboard,
  ListChecks,
  Mail,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Sparkle,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { ResponsibleAiDialog } from "@/components/responsible-ai";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/email", label: "Smart Email", icon: Mail },
  { to: "/meetings", label: "Meeting Notes", icon: CalendarCheck },
  { to: "/tasks", label: "Task Planner", icon: ListChecks },
  { to: "/research", label: "Research Assistant", icon: Search },
  { to: "/chat", label: "AI Chat", icon: Bot },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-card"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-1">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-card">
        <Sparkle className="size-5" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-sm font-semibold">Workplace AI</span>
        <span className="block text-xs text-muted-foreground">Productivity Assistant</span>
      </span>
    </div>
  );
}

function SidebarFooter({ onOpenRai }: { onOpenRai: () => void }) {
  const { preferences } = useStore();
  const initials = preferences.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="mt-auto space-y-2 border-t border-border pt-4">
      <button
        type="button"
        onClick={onOpenRai}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <ShieldCheck className="size-4" aria-hidden />
        Responsible AI
      </button>
      <a
        href="mailto:support@example.com"
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <BadgeHelp className="size-4" aria-hidden />
        Help &amp; support
      </a>
      <Link
        to="/settings"
        className="flex items-center gap-3 rounded-xl bg-surface-muted px-3 py-2.5 transition-colors hover:bg-secondary"
      >
        <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {initials}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-medium">{preferences.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{preferences.email}</span>
        </span>
      </Link>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [raiOpen, setRaiOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col gap-6 border-r border-border bg-surface px-4 py-6 lg:flex">
        <Brand />
        <NavList />
        <SidebarFooter onOpenRai={() => setRaiOpen(true)} />
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-surface/85 px-4 py-3 backdrop-blur lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open navigation">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-[280px] flex-col gap-6 bg-surface p-4">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Brand />
              <NavList onNavigate={() => setMobileOpen(false)} />
              <SidebarFooter
                onOpenRai={() => {
                  setMobileOpen(false);
                  setRaiOpen(true);
                }}
              />
            </SheetContent>
          </Sheet>
          <Brand />
        </header>

        <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 sm:px-6 lg:py-10">
          {children}
          <footer className="rounded-2xl border border-border bg-surface-muted p-4 text-xs text-muted-foreground">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-3xl">
                AI-generated content may contain errors or omissions. Review and verify important
                information before making decisions or sharing content. Do not enter confidential,
                sensitive, or personal information unless your organization&apos;s policies allow
                it.
              </p>
              <Button variant="outline" size="sm" onClick={() => setRaiOpen(true)}>
                Learn more
              </Button>
            </div>
          </footer>
        </main>
      </div>

      <ResponsibleAiDialog open={raiOpen} onOpenChange={setRaiOpen} />
    </div>
  );
}
