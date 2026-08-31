import { createFileRoute } from "@tanstack/react-router";
import { Copy, Download, Plus, RefreshCw, Save, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app-shell";
import { AiNotice } from "@/components/responsible-ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { uid, useStore, type MeetingSummary } from "@/lib/store";
import { copyText, downloadText, extractJson, useAi } from "@/lib/use-ai";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer | Workplace AI" },
      {
        name: "description",
        content:
          "Turn raw meeting notes into a summary, decisions, action items and key points you can edit.",
      },
      { property: "og:title", content: "Meeting Notes Summarizer | Workplace AI" },
      {
        property: "og:description",
        content: "Summaries, decisions and action items from your meeting notes.",
      },
    ],
  }),
  component: MeetingsPage,
});

type Result = Omit<MeetingSummary, "id" | "createdAt">;

function MeetingsPage() {
  const { meetings, addMeeting, logActivity } = useStore();
  const { ask, loading } = useAi();
  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const summarize = async () => {
    if (notes.trim().length < 30) {
      toast.error("Paste your meeting notes or transcript first");
      return;
    }
    const text = await ask({
      system:
        'You summarize workplace meetings. Return ONLY JSON: {"summary": string, "decisions": string[], "actionItems": [{"task": string, "owner": string, "deadline": string}], "important": string[]}. Never invent people or dates that are not in the notes; use "Unassigned"/"TBD" instead.',
      messages: [
        {
          role: "user",
          content: `Meeting title: ${title || "Untitled meeting"}\nParticipants: ${participants || "unknown"}\nDate: ${date}\n\nNotes/transcript:\n${notes}`,
        },
      ],
    });
    if (!text) return;
    const parsed = extractJson<Result>(text);
    if (!parsed) {
      toast.error("Could not read the AI response", { description: "Try summarizing again." });
      return;
    }
    setResult({
      title: title || "Untitled meeting",
      participants,
      date,
      summary: parsed.summary ?? "",
      decisions: parsed.decisions ?? [],
      actionItems: parsed.actionItems ?? [],
      important: parsed.important ?? [],
    });
    toast.success("Meeting summarized");
  };

  const asText = (r: Result) =>
    [
      `${r.title} — ${r.date}`,
      `Participants: ${r.participants}`,
      "",
      "SUMMARY",
      r.summary,
      "",
      "KEY DECISIONS",
      ...r.decisions.map((d) => `- ${d}`),
      "",
      "ACTION ITEMS",
      ...r.actionItems.map((a) => `- ${a.task} — ${a.owner} (${a.deadline})`),
      "",
      "IMPORTANT POINTS",
      ...r.important.map((p) => `- ${p}`),
    ].join("\n");

  const updateList = (key: "decisions" | "important", i: number, value: string) =>
    setResult((r) => (r ? { ...r, [key]: r[key].map((v, idx) => (idx === i ? value : v)) } : r));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meeting Notes Summarizer"
        description="Paste notes or a transcript and get an editable summary with decisions and action items."
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="rounded-2xl border-border shadow-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Meeting details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="m-title">Meeting title</Label>
              <Input
                id="m-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Weekly product sync"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-people">Participants</Label>
              <Input
                id="m-people"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="Amara, Joel, Priya"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-date">Date</Label>
              <Input
                id="m-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-notes">Notes / transcript</Label>
              <Textarea
                id="m-notes"
                rows={12}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste the raw notes or transcript here…"
              />
            </div>
            <Button onClick={summarize} disabled={loading} className="w-full">
              <Sparkles /> {loading ? "Summarizing…" : "Summarize meeting"}
            </Button>
            <AiNotice>Avoid pasting confidential or personal information.</AiNotice>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-card lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Summary</CardTitle>
            {result ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={summarize} disabled={loading}>
                  <RefreshCw /> Regenerate
                </Button>
                <Button variant="outline" size="sm" onClick={() => copyText(asText(result))}>
                  <Copy /> Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadText(`${result.title.replace(/\s+/g, "-")}.txt`, asText(result))}
                >
                  <Download /> Export
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    addMeeting({ ...result, id: uid(), createdAt: new Date().toISOString() });
                    logActivity({
                      type: "Meeting",
                      title: `${result.title} summarized`,
                      status: "Completed",
                      href: "/meetings",
                    });
                    toast.success("Summary saved");
                  }}
                >
                  <Save /> Save
                </Button>
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : !result ? (
              <div className="rounded-xl border border-dashed border-border p-10 text-center">
                <p className="text-sm font-medium">Nothing summarized yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add your notes on the left and select Summarize meeting.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="r-summary">Summary</Label>
                  <Textarea
                    id="r-summary"
                    rows={5}
                    value={result.summary}
                    onChange={(e) => setResult({ ...result, summary: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Key decisions</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResult({ ...result, decisions: [...result.decisions, ""] })}
                    >
                      <Plus /> Add
                    </Button>
                  </div>
                  {result.decisions.map((d, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        aria-label={`Decision ${i + 1}`}
                        value={d}
                        onChange={(e) => updateList("decisions", i, e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove decision"
                        onClick={() =>
                          setResult({
                            ...result,
                            decisions: result.decisions.filter((_, idx) => idx !== i),
                          })
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Action items</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setResult({
                          ...result,
                          actionItems: [
                            ...result.actionItems,
                            { task: "", owner: "Unassigned", deadline: "TBD" },
                          ],
                        })
                      }
                    >
                      <Plus /> Add
                    </Button>
                  </div>
                  {result.actionItems.map((a, i) => (
                    <div
                      key={i}
                      className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[2fr_1fr_1fr_auto]"
                    >
                      <Input
                        aria-label="Task"
                        placeholder="Task"
                        value={a.task}
                        onChange={(e) =>
                          setResult({
                            ...result,
                            actionItems: result.actionItems.map((it, idx) =>
                              idx === i ? { ...it, task: e.target.value } : it,
                            ),
                          })
                        }
                      />
                      <Input
                        aria-label="Owner"
                        placeholder="Owner"
                        value={a.owner}
                        onChange={(e) =>
                          setResult({
                            ...result,
                            actionItems: result.actionItems.map((it, idx) =>
                              idx === i ? { ...it, owner: e.target.value } : it,
                            ),
                          })
                        }
                      />
                      <Input
                        aria-label="Deadline"
                        placeholder="Deadline"
                        value={a.deadline}
                        onChange={(e) =>
                          setResult({
                            ...result,
                            actionItems: result.actionItems.map((it, idx) =>
                              idx === i ? { ...it, deadline: e.target.value } : it,
                            ),
                          })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove action item"
                        onClick={() =>
                          setResult({
                            ...result,
                            actionItems: result.actionItems.filter((_, idx) => idx !== i),
                          })
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Important points</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResult({ ...result, important: [...result.important, ""] })}
                    >
                      <Plus /> Add
                    </Button>
                  </div>
                  {result.important.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        aria-label={`Important point ${i + 1}`}
                        value={p}
                        onChange={(e) => updateList("important", i, e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove point"
                        onClick={() =>
                          setResult({
                            ...result,
                            important: result.important.filter((_, idx) => idx !== i),
                          })
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                </div>

                <AiNotice />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {meetings.length > 0 ? (
        <Card className="rounded-2xl border-border shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Saved summaries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {meetings.map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.date} · {m.actionItems.length} action items
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setResult(m)}>
                  Open
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
