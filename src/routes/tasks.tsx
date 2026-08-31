import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app-shell";
import { AiNotice } from "@/components/responsible-ai";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { uid, useStore, type Priority, type Task } from "@/lib/store";
import { extractJson, useAi } from "@/lib/use-ai";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "AI Task Planner | Workplace AI" },
      {
        name: "description",
        content: "Capture tasks and let AI arrange them into a realistic morning-to-evening plan.",
      },
      { property: "og:title", content: "AI Task Planner | Workplace AI" },
      {
        property: "og:description",
        content: "Turn your task list into a scheduled, editable day plan.",
      },
    ],
  }),
  component: TasksPage,
});

type Slot = { time: string; task: string };
type Schedule = { morning: Slot[]; afternoon: Slot[]; evening: Slot[] };

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];

function TasksPage() {
  const { tasks, setTasks, logActivity } = useStore();
  const { ask, loading } = useAi();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    priority: "Medium" as Priority,
    deadline: new Date().toISOString().slice(0, 10),
    duration: "30m",
  });

  const done = tasks.filter((t) => t.status === "Done").length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const addTask = () => {
    if (!draft.name.trim()) {
      toast.error("Give the task a name");
      return;
    }
    setTasks((t) => [{ id: uid(), status: "Todo", ...draft }, ...t]);
    setDraft({ ...draft, name: "", description: "" });
    toast.success("Task added");
  };

  const update = (id: string, patch: Partial<Task>) =>
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const plan = async () => {
    const open = tasks.filter((t) => t.status !== "Done");
    if (open.length === 0) {
      toast.error("Add at least one open task first");
      return;
    }
    const text = await ask({
      system:
        'You are a scheduling assistant. Return ONLY JSON: {"morning": [{"time": "08:00", "task": string}], "afternoon": [...], "evening": [...]}. Respect priorities, deadlines and estimated durations, leave breathing room, and never invent tasks.',
      messages: [
        {
          role: "user",
          content: open
            .map(
              (t) =>
                `- ${t.name} | priority ${t.priority} | due ${t.deadline} | est ${t.duration} | ${t.description}`,
            )
            .join("\n"),
        },
      ],
    });
    if (!text) return;
    const parsed = extractJson<Schedule>(text);
    if (!parsed) {
      toast.error("Could not read the AI schedule", { description: "Try regenerating." });
      return;
    }
    setSchedule({
      morning: parsed.morning ?? [],
      afternoon: parsed.afternoon ?? [],
      evening: parsed.evening ?? [],
    });
    logActivity({ type: "Tasks", title: "Daily plan generated", status: "Completed", href: "/tasks" });
    toast.success("Your day is planned");
  };

  const priorityTone = (p: Priority) =>
    p === "High" ? "destructive" : p === "Medium" ? "default" : "secondary";

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Task Planner"
        description="Capture what needs doing, then let AI sequence it into a realistic day."
        actions={
          <Button onClick={plan} disabled={loading}>
            <Sparkles /> {loading ? "Planning…" : "AI plan my day"}
          </Button>
        }
      />

      <Card className="rounded-2xl border-border shadow-card">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">Completion</span>
              <span className="text-sm text-muted-foreground">
                {done}/{tasks.length} tasks · {pct}%
              </span>
            </div>
            <Progress value={pct} className="mt-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="rounded-2xl border-border shadow-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Add a task</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="t-name">Task name</Label>
              <Input
                id="t-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Draft the board update"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-desc">Description</Label>
              <Textarea
                id="t-desc"
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="t-priority">Priority</Label>
                <Select
                  value={draft.priority}
                  onValueChange={(v) => setDraft({ ...draft, priority: v as Priority })}
                >
                  <SelectTrigger id="t-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-duration">Estimated duration</Label>
                <Input
                  id="t-duration"
                  value={draft.duration}
                  onChange={(e) => setDraft({ ...draft, duration: e.target.value })}
                  placeholder="45m"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-deadline">Deadline</Label>
              <Input
                id="t-deadline"
                type="date"
                value={draft.deadline}
                onChange={(e) => setDraft({ ...draft, deadline: e.target.value })}
              />
            </div>
            <Button onClick={addTask} className="w-full" variant="secondary">
              <Plus /> Add task
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-card lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-10 text-center">
                <p className="text-sm font-medium">No tasks yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add your first task to start planning your day.
                </p>
              </div>
            ) : (
              tasks.map((t) => (
                <div key={t.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      className="mt-1"
                      checked={t.status === "Done"}
                      aria-label={`Mark ${t.name} complete`}
                      onCheckedChange={(c) => update(t.id, { status: c ? "Done" : "Todo" })}
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Input
                        aria-label="Task name"
                        value={t.name}
                        onChange={(e) => update(t.id, { name: e.target.value })}
                        className={t.status === "Done" ? "line-through opacity-60" : ""}
                      />
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Select
                          value={t.priority}
                          onValueChange={(v) => update(t.id, { priority: v as Priority })}
                        >
                          <SelectTrigger className="h-8 w-[110px]" aria-label="Priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITIES.map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Badge variant={priorityTone(t.priority)}>{t.priority}</Badge>
                        <Badge variant="outline">{t.duration}</Badge>
                        <Badge variant="secondary">Due {t.deadline}</Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-auto"
                              aria-label={`Delete ${t.name}`}
                            >
                              <Trash2 />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                              <AlertDialogDescription>
                                “{t.name}” will be removed permanently. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  setTasks((all) => all.filter((x) => x.id !== t.id));
                                  toast.success("Task deleted");
                                }}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border shadow-card">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Today&apos;s schedule</CardTitle>
          {schedule ? (
            <Button variant="outline" size="sm" onClick={plan} disabled={loading}>
              <RefreshCw /> Regenerate
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : !schedule ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <CalendarClock className="mx-auto size-6 text-muted-foreground" aria-hidden />
              <p className="mt-2 text-sm font-medium">No plan generated yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Select “AI plan my day” to arrange your open tasks into time blocks.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["morning", "afternoon", "evening"] as const).map((part) => (
                  <div key={part} className="rounded-xl border border-border bg-surface-muted p-3">
                    <p className="text-sm font-semibold capitalize">{part}</p>
                    <div className="mt-2 space-y-2">
                      {schedule[part].length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nothing scheduled.</p>
                      ) : (
                        schedule[part].map((slot, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 rounded-lg bg-surface p-2 shadow-card"
                          >
                            <span className="w-14 shrink-0 text-xs font-semibold text-primary">
                              {slot.time}
                            </span>
                            <Input
                              aria-label={`${part} ${slot.time} task`}
                              value={slot.task}
                              onChange={(e) =>
                                setSchedule({
                                  ...schedule,
                                  [part]: schedule[part].map((s, idx) =>
                                    idx === i ? { ...s, task: e.target.value } : s,
                                  ),
                                })
                              }
                              className="h-8 border-0 bg-transparent px-1 shadow-none focus-visible:ring-1"
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <AiNotice>
                AI-generated schedule. Adjust timings to fit meetings and your actual capacity.
              </AiNotice>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
