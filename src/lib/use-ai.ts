import { useServerFn } from "@tanstack/react-start";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { generateAiText, type AiMessage } from "@/lib/ai.functions";

export function useAi() {
  const run = useServerFn(generateAiText);
  const [loading, setLoading] = useState(false);

  const ask = useCallback(
    async (args: { system?: string; messages: AiMessage[] }) => {
      setLoading(true);
      try {
        const res = await run({ data: args });
        return res.text;
      } catch (e) {
        const message = e instanceof Error ? e.message : "The AI request failed.";
        toast.error("AI request failed", { description: message });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [run],
  );

  return { ask, loading };
}

export function extractJson<T>(text: string): T | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

export async function copyText(text: string, label = "Copied to clipboard") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  } catch {
    toast.error("Could not copy to clipboard");
  }
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Exported", { description: filename });
}
