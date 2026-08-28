import { Eye, FileSearch, Lock, ShieldCheck, Users } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const POINTS = [
  {
    icon: Eye,
    title: "AI limitations",
    body: "Models can be confidently wrong, miss context, or invent details. Treat every output as a first draft.",
  },
  {
    icon: Users,
    title: "Human review",
    body: "A person should always review and approve AI output before it is sent, published, or acted on.",
  },
  {
    icon: Lock,
    title: "Privacy awareness",
    body: "Never paste confidential, regulated, or personal data unless your organization's policy explicitly allows it.",
  },
  {
    icon: FileSearch,
    title: "Verify information",
    body: "Check names, figures, dates, quotes and sources against trusted systems of record.",
  },
  {
    icon: ShieldCheck,
    title: "Appropriate workplace use",
    body: "Use AI to accelerate drafting and planning — not for decisions about people, compliance, or legal matters.",
  },
];

export function ResponsibleAiDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Responsible AI at work</DialogTitle>
          <DialogDescription>
            How to get value from this assistant while keeping your work accurate and safe.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-4">
          {POINTS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export function AiNotice({ children }: { children?: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-xs text-muted-foreground">
      <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>
        {children ?? "AI-generated. Review and edit before sharing or acting on this content."}
      </span>
    </p>
  );
}
