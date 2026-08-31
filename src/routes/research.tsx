import { createFileRoute } from "@tanstack/react-router";
import { Copy, Download, Save, Search, Sparkles, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app-shell";
import { AiNotice } from "@/components/responsible-ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { uid, useStore, type ResearchSession } from "@/lib/store";
import { copyText, downloadText, extractJson, useAi } from "@/lib/use-ai";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant | Workplace AI" },
      {
        name: "description",
        content:
          "Research any work topic and get an editable brief with findings, insights, pros and cons.",
      },
      { property: "og:title", content: "AI Research Assistant | Workplace AI" },
      {
        property: "og:description",
        content: "Structured, editable research briefs for workplace topics.",
      },
    ],
  }),
  component: ResearchPage,
});

type Result = Omit<ResearchSession, "id" | "createdAt">;

const EMPTY_LIST_LABELS: Array<[keyof Result, string]> = [
  ["findings", "Key findings"],
  ["insights", "Important insights"],
  ["pros", "Pros"],
  ["cons", "Cons"],
  ["nextSteps", "Recommended next steps"],
  ["sources", "Sources / references"],
];

function ResearchPage() {
  const { research, addResearch, logActivity, preferences } = useStore();
  const { ask, loading } = useAi();
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState(preferences.researchDepth);
  const [length, setLength] = useState("Balanced");
  const [focus, setFocus] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const start = async () => {
    if (!topic.trim()) {
      toast.error("Enter a topic to research");
      return;
    }
    const text = await ask({
      system:
        'You are a workplace research assistant. Return ONLY JSON: {"summary": string, "findings": string[], "insights": string[], "pros": string[], "cons": string[], "nextSteps": string[], "sources": string[]}. Sources must be described as suggested starting points to verify, not as retrieved citations.',
      messages: [
        {
          role: "user",
          content: `Topic: ${topic}\nDepth: ${depth}\nSummary length: ${length}\nFocus area: ${focus || "general business relevance"}`,
        },
      ],
    });
    if (!text) return;
    const parsed = extractJson<Result>(text);
    if (!parsed) {
      toast.error("Could not read the AI response");
      return;
    }
    setResult({ topic, ...parsed });
    logActivity({ type: "Research", title: topic, status: "Completed", href: "/research" });
    toast.success("Research ready", { description: "Verify important claims before using them." });
  };

  const asText = (r: Result) =>
    [
      `Research: ${r.topic}`,
      "",
      "SUMMARY",
      r.summary,
      ...EMPTY_LIST_LABELS.flatMap(([key, label]) => [
        "",
        label.toUpperCase(),
        ...((r[key] as string[]) ?? []).map((v) => `- ${v}`),
      ]),
    ].join("\n");

  const setList = (key: keyof Result, value: string) =>
    setResult((r) => (r ? { ...r, [key]: value.split("\n").filter(Boolean) } : r));

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Research Assistant"
        description="Explore a topic and get a structured, editable brief you can share with your team."
      />

      <Card className="rounded-2xl border-border shadow-card">
        <CardContent className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="topic">What would you like to research?</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Hybrid work policies in mid-size tech companies"
                className="flex-1"
              />
              <Button onClick={start} disabled={loading}>
                <Search /> {loading ? "Researching…" : "Start research"}
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="depth">Research depth</Label>
              <Select value={depth} onValueChange={setDepth}>
                <SelectTrigger id="depth">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Quick", "Standard", "Deep dive"].map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="length">Summary length</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger id="length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Brief", "Balanced", "Detailed"].map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="focus">Focus area</Label>
              <Input
                id="focus"
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="Cost, risk, adoption…"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      ) : !result ? (
        <Card className="rounded-2xl border-border shadow-card">
          <CardContent className="p-10 text-center">
            <Sparkles className="mx-auto size-6 text-muted-foreground" aria-hidden />
            <p className="mt-2 text-sm font-medium">No research yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter a topic above to generate a structured brief.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-border shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">{result.topic}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={start} disabled={loading}>
                <RefreshCw /> Regenerate
              </Button>
              <Button variant="outline" size="sm" onClick={() => copyText(asText(result))}>
                <Copy /> Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadText(`research-${result.topic.slice(0, 30)}.txt`, asText(result))}
              >
                <Download /> Export
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  addResearch({ ...result, id: uid(), createdAt: new Date().toISOString() });
                  toast.success("Research saved");
                }}
              >
                <Save /> Save
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="res-summary">Research summary</Label>
              <Textarea
                id="res-summary"
                rows={5}
                value={result.summary}
                onChange={(e) => setResult({ ...result, summary: e.target.value })}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {EMPTY_LIST_LABELS.map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={`res-${key}`}>{label}</Label>
                  <Textarea
                    id={`res-${key}`}
                    rows={5}
                    value={((result[key] as string[]) ?? []).join("\n")}
                    onChange={(e) => setList(key, e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">One item per line.</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-3">
              <p className="text-xs text-warning-foreground">
                These results are AI-generated, not retrieved from verified databases. Sources are
                suggested starting points — confirm every important claim, statistic and citation
                against an authoritative source before using it in decisions.
              </p>
            </div>
            <AiNotice />
          </CardContent>
        </Card>
      )}

      {research.length > 0 ? (
        <Card className="rounded-2xl border-border shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Saved research sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {research.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.topic}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setResult(r)}>
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
