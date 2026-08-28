import { createFileRoute } from "@tanstack/react-router";
import { Copy, Eraser, RefreshCw, Save, Sparkles } from "lucide-react";
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
import { copyText, extractJson, useAi } from "@/lib/use-ai";
import { uid, useStore } from "@/lib/store";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator | Workplace AI" },
      {
        name: "description",
        content: "Generate polished workplace emails with a chosen tone, then edit before sending.",
      },
      { property: "og:title", content: "Smart Email Generator | Workplace AI" },
      {
        property: "og:description",
        content: "Draft professional emails with AI and edit them before sending.",
      },
    ],
  }),
  component: EmailPage,
});

const TONES = ["Professional", "Friendly", "Formal", "Persuasive", "Concise"];
const LENGTHS = ["Short", "Medium", "Detailed"];

function EmailPage() {
  const { preferences, addEmail, logActivity, emails } = useStore();
  const { ask, loading } = useAi();
  const [form, setForm] = useState({
    recipient: "",
    purpose: "",
    points: "",
    tone: preferences.defaultTone,
    length: "Medium",
  });
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const generate = async () => {
    if (!form.purpose.trim()) {
      toast.error("Add an email purpose first");
      return;
    }
    const text = await ask({
      system:
        "You are a workplace email writing assistant. Return ONLY JSON: {\"subject\": string, \"body\": string}. The body is plain text with line breaks, includes a greeting and sign-off, and never invents facts that were not provided.",
      messages: [
        {
          role: "user",
          content: `Recipient/context: ${form.recipient || "a colleague"}
Purpose: ${form.purpose}
Key points: ${form.points || "none provided"}
Tone: ${form.tone}
Length: ${form.length}
Sender name: ${preferences.name}
Writing style preference: ${preferences.writingStyle}`,
        },
      ],
    });
    if (!text) return;
    const parsed = extractJson<{ subject: string; body: string }>(text);
    if (parsed) {
      setSubject(parsed.subject);
      setBody(parsed.body);
    } else {
      setSubject(form.purpose.slice(0, 60));
      setBody(text);
    }
    toast.success("Email drafted", { description: "Review and edit before sending." });
  };

  const clear = () => {
    setSubject("");
    setBody("");
    setForm({ recipient: "", purpose: "", points: "", tone: preferences.defaultTone, length: "Medium" });
    toast("Cleared");
  };

  const save = () => {
    addEmail({ id: uid(), subject, body, tone: form.tone, createdAt: new Date().toISOString() });
    logActivity({ type: "Email", title: subject || "Untitled email", status: "Completed", href: "/email" });
    toast.success("Email saved to your library");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Email Generator"
        description="Describe the situation and let AI draft the email. Everything stays editable before you send it."
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="rounded-2xl border-border shadow-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Email brief</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient / context</Label>
              <Input
                id="recipient"
                placeholder="Dana at Northwind, procurement lead"
                value={form.recipient}
                onChange={(e) => set("recipient")(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Email purpose</Label>
              <Input
                id="purpose"
                placeholder="Follow up on the pricing proposal"
                value={form.purpose}
                onChange={(e) => set("purpose")(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="points">Key points</Label>
              <Textarea
                id="points"
                rows={5}
                placeholder="One point per line"
                value={form.points}
                onChange={(e) => set("points")(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select value={form.tone} onValueChange={set("tone")}>
                  <SelectTrigger id="tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="length">Length</Label>
                <Select value={form.length} onValueChange={set("length")}>
                  <SelectTrigger id="length">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LENGTHS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={generate} disabled={loading} className="flex-1">
                <Sparkles /> {loading ? "Generating…" : "Generate email"}
              </Button>
              <Button variant="outline" onClick={clear} disabled={loading}>
                <Eraser /> Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-card lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Draft</CardTitle>
            {body ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={generate} disabled={loading}>
                  <RefreshCw /> Regenerate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyText(`Subject: ${subject}\n\n${body}`)}
                >
                  <Copy /> Copy
                </Button>
                <Button size="sm" onClick={save}>
                  <Save /> Save
                </Button>
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : body || subject ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Email body</Label>
                  <Textarea
                    id="body"
                    rows={16}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="font-sans leading-relaxed"
                  />
                </div>
                <AiNotice>
                  AI-generated email. Review facts, names and commitments before sending.
                </AiNotice>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-10 text-center">
                <p className="text-sm font-medium">No draft yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fill in the brief and select Generate email to see an editable draft here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {emails.length > 0 ? (
        <Card className="rounded-2xl border-border shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Saved emails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {emails.map((e) => (
              <div
                key={e.id}
                className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{e.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.tone} · {new Date(e.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSubject(e.subject);
                    setBody(e.body);
                  }}
                >
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
