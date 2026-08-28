import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Priority = "High" | "Medium" | "Low";
export type TaskStatus = "Todo" | "In progress" | "Done";

export type Task = {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  deadline: string;
  duration: string;
  status: TaskStatus;
};

export type SavedEmail = {
  id: string;
  subject: string;
  body: string;
  tone: string;
  createdAt: string;
};

export type MeetingSummary = {
  id: string;
  title: string;
  participants: string;
  date: string;
  summary: string;
  decisions: string[];
  actionItems: { task: string; owner: string; deadline: string }[];
  important: string[];
  createdAt: string;
};

export type ResearchSession = {
  id: string;
  topic: string;
  summary: string;
  findings: string[];
  insights: string[];
  pros: string[];
  cons: string[];
  nextSteps: string[];
  sources: string[];
  createdAt: string;
};

export type ChatMessage = { id: string; role: "user" | "assistant"; content: string };
export type Conversation = { id: string; title: string; messages: ChatMessage[]; createdAt: string };

export type Preferences = {
  name: string;
  email: string;
  notifications: boolean;
  defaultTone: string;
  responseLength: string;
  researchDepth: string;
  writingStyle: string;
};

export type Activity = {
  id: string;
  type: "Email" | "Meeting" | "Tasks" | "Research" | "Chat";
  title: string;
  createdAt: string;
  status: "Completed" | "Draft";
  href: string;
};

type State = {
  tasks: Task[];
  emails: SavedEmail[];
  meetings: MeetingSummary[];
  research: ResearchSession[];
  conversations: Conversation[];
  preferences: Preferences;
  activity: Activity[];
};

export const uid = () => Math.random().toString(36).slice(2, 10);

const iso = (offsetHours: number) => new Date(Date.now() - offsetHours * 3600_000).toISOString();

const initialState: State = {
  tasks: [
    {
      id: uid(),
      name: "Finalize Q3 roadmap deck",
      description: "Merge product and design input, tighten the narrative.",
      priority: "High",
      deadline: new Date(Date.now() + 86400_000).toISOString().slice(0, 10),
      duration: "90m",
      status: "In progress",
    },
    {
      id: uid(),
      name: "Review vendor contract",
      description: "Check renewal terms and SLA penalties.",
      priority: "Medium",
      deadline: new Date(Date.now() + 3 * 86400_000).toISOString().slice(0, 10),
      duration: "45m",
      status: "Todo",
    },
    {
      id: uid(),
      name: "1:1 prep notes for Amara",
      description: "Career growth plan and current blockers.",
      priority: "Medium",
      deadline: new Date().toISOString().slice(0, 10),
      duration: "20m",
      status: "Todo",
    },
    {
      id: uid(),
      name: "Send onboarding recap email",
      description: "Summarize week one for the new analyst.",
      priority: "Low",
      deadline: new Date().toISOString().slice(0, 10),
      duration: "15m",
      status: "Done",
    },
  ],
  emails: [
    {
      id: uid(),
      subject: "Follow-up: Pricing proposal for Northwind",
      body: "Hi Dana,\n\nThank you for the time today. As discussed, I've attached the revised pricing proposal reflecting the volume tier we reviewed.\n\nHappy to walk through the details this week.\n\nBest regards,\nThebe",
      tone: "Professional",
      createdAt: iso(26),
    },
  ],
  meetings: [
    {
      id: uid(),
      title: "Weekly product sync",
      participants: "Amara, Joel, Priya, Thebe",
      date: new Date().toISOString().slice(0, 10),
      summary:
        "The team reviewed release readiness for v2.4, agreed to defer the analytics revamp, and confirmed the migration window for next Thursday.",
      decisions: [
        "Ship v2.4 on Thursday behind a feature flag",
        "Defer the analytics revamp to next quarter",
      ],
      actionItems: [
        { task: "Prepare migration runbook", owner: "Joel", deadline: "Wed" },
        { task: "Draft customer release note", owner: "Priya", deadline: "Thu" },
      ],
      important: ["Support load is trending up 12% week over week"],
      createdAt: iso(5),
    },
  ],
  research: [],
  conversations: [
    {
      id: uid(),
      title: "Prioritizing this week",
      messages: [],
      createdAt: iso(2),
    },
  ],
  preferences: {
    name: "Thebe Masemola",
    email: "thebe@company.com",
    notifications: true,
    defaultTone: "Professional",
    responseLength: "Balanced",
    researchDepth: "Standard",
    writingStyle: "Clear and direct",
  },
  activity: [
    {
      id: uid(),
      type: "Meeting",
      title: "Weekly product sync summarized",
      createdAt: iso(5),
      status: "Completed",
      href: "/meetings",
    },
    {
      id: uid(),
      type: "Email",
      title: "Follow-up: Pricing proposal for Northwind",
      createdAt: iso(26),
      status: "Completed",
      href: "/email",
    },
    {
      id: uid(),
      type: "Tasks",
      title: "Daily plan generated",
      createdAt: iso(28),
      status: "Draft",
      href: "/tasks",
    },
  ],
};

type Ctx = State & {
  setTasks: (fn: (t: Task[]) => Task[]) => void;
  addEmail: (e: SavedEmail) => void;
  addMeeting: (m: MeetingSummary) => void;
  addResearch: (r: ResearchSession) => void;
  setConversations: (fn: (c: Conversation[]) => Conversation[]) => void;
  setPreferences: (p: Partial<Preferences>) => void;
  logActivity: (a: Omit<Activity, "id" | "createdAt">) => void;
};

const StoreContext = createContext<Ctx | null>(null);

const KEY = "aiwpa-state-v1";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initialState);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState((s) => ({ ...s, ...(JSON.parse(raw) as State) }));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const logActivity = useCallback((a: Omit<Activity, "id" | "createdAt">) => {
    setState((s) => ({
      ...s,
      activity: [{ ...a, id: uid(), createdAt: new Date().toISOString() }, ...s.activity].slice(
        0,
        20,
      ),
    }));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      setTasks: (fn) => setState((s) => ({ ...s, tasks: fn(s.tasks) })),
      addEmail: (e) => setState((s) => ({ ...s, emails: [e, ...s.emails] })),
      addMeeting: (m) => setState((s) => ({ ...s, meetings: [m, ...s.meetings] })),
      addResearch: (r) => setState((s) => ({ ...s, research: [r, ...s.research] })),
      setConversations: (fn) => setState((s) => ({ ...s, conversations: fn(s.conversations) })),
      setPreferences: (p) => setState((s) => ({ ...s, preferences: { ...s.preferences, ...p } })),
      logActivity,
    }),
    [state, logActivity],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
