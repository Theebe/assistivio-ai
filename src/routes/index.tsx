import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Bot,
  CalendarCheck,
  CheckCircle2,
  ListChecks,
  Mail,
  Search,
} from "lucide-react";

import { PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Your AI productivity overview: quick actions, task progress and recent AI activity.",
      },
      { property: "og:title", content: "Dashboard | AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "Quick actions, productivity stats and recent AI activity in one workspace.",
      },
    ],
  }),
  component: Dashboard,
});

const QUICK = [
  { to: "/email", label: "Generate Email", icon: Mail },
  { to: "/meetings", label: "Summarize Meeting", icon: CalendarCheck },
  { to: "/tasks", label: "Plan My Tasks", icon: ListChecks },
  { to: "/research", label: "Research a Topic", icon: Search },
  { to: "/chat", label: "Ask AI", icon: Bot },
] as const;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { tasks, emails, meetings, research, activity, preferences } = useStore();
  const done = tasks.filter((t) => t.status === "Done").length;
  const remaining = tasks.length - done;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const stats = [
    { label: "Tasks completed", value: done, icon: CheckCircle2 },
    { label: "Tasks remaining", value: remaining, icon: ListChecks },
    { label: "Emails generated", value: emails.length, icon: Mail },
    { label: "Meetings summarized", value: meetings.length, icon: CalendarCheck },
    { label: "Research sessions", value: research.length, icon: Search },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${greeting()}, ${preferences.name.split(" ")[0]} 👋`}
        description="Your AI productivity workspace is ready. Pick up where you left off or start something new."
        actions={
          <Button asChild>
            <Link to="/chat">Ask AI</Link>
          </Button>
        }
      />

      <section aria-labelledby="quick-actions" className="space-y-3">
        <h2 id="quick-actions" className="text-sm font-semibold text-muted-foreground uppercase">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {QUICK.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-2xl border border-border bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="mt-3 flex items-center justify-between text-sm font-medium">
                {label}
                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="overview" className="space-y-3">
        <h2 id="overview" className="text-sm font-semibold text-muted-foreground uppercase">
          Productivity overview
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="rounded-2xl border-border shadow-card">
              <CardContent className="space-y-2 p-4">
                <Icon className="size-4 text-primary" aria-hidden />
                <p className="text-2xl font-semibold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-border shadow-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activity.length === 0 ? (
              <p className="rounded-xl bg-surface-muted p-6 text-center text-sm text-muted-foreground">
                No AI activity yet. Generate an email or summarize a meeting to get started.
              </p>
            ) : (
              activity.slice(0, 6).map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{a.type}</Badge>
                      <Badge variant={a.status === "Completed" ? "default" : "outline"}>
                        {a.status}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to={a.href}>Open</Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Productivity progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Today</span>
                <span className="text-2xl font-semibold">{pct}%</span>
              </div>
              <Progress value={pct} className="mt-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                {done} of {tasks.length} tasks completed
              </p>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">This week</span>
                <span className="text-sm font-medium">
                  {emails.length + meetings.length + research.length} AI outputs
                </span>
              </div>
              <Progress
                value={Math.min(100, (emails.length + meetings.length + research.length) * 12)}
                className="mt-2"
              />
            </div>
            <Button asChild variant="secondary" className="w-full">
              <Link to="/tasks">Plan my day</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
