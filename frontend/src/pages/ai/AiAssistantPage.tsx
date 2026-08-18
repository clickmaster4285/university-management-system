import { AppShell } from "@/layouts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, Send, User, Bot, Zap } from "lucide-react";
import { useState, useRef, useEffect } from "react";


const suggestions = [
  "How many students attended today?",
  "Which department has the highest admissions?",
  "Show pending fees.",
  "Top performing students.",
  "Teachers with lowest attendance.",
  "Students at risk.",
  "Generate the semester report.",
];

const canned: Record<string, string> = {
  attendance: "Today's attendance is **87.4%** — 8,952 present out of 10,248 enrolled. Computer Science leads at 92%, while Fine Arts sits at 74%.",
  admissions: "**Computer Science** has the highest admissions this month with 78 new enrollments, followed by Business Administration (52) and Electrical Engineering (44).",
  fees: "PKR **6.82M** is currently pending across **1,284 students**. Of these, 214 are more than 30 days overdue.",
  top: "Top 3 this semester:\n1. Aisha Khan · BSCS · CGPA 3.98\n2. Hassan Ali · BSAI · CGPA 3.96\n3. Sana Ahmed · BBA · CGPA 3.94",
  lowest: "Faculty with attendance below 85%: Dr. Kashif Butt (78%), Prof. Nida Sheikh (81%), Dr. Talha Raza (84%).",
  risk: "**14 students** flagged as high-risk. Top signals: attendance below 65%, GPA drop > 0.5, and 3+ missed assessments.",
  report: "Semester report generated ✅ — 24 pages, 62 charts. Includes admissions, retention, financial summary, and department KPIs. [Download PDF]",
};

function answer(q: string): string {
  const s = q.toLowerCase();
  if (s.includes("attend")) return canned.attendance;
  if (s.includes("admission")) return canned.admissions;
  if (s.includes("fee") || s.includes("pending")) return canned.fees;
  if (s.includes("top") || s.includes("perform")) return canned.top;
  if (s.includes("teacher") && s.includes("low")) return canned.lowest;
  if (s.includes("risk")) return canned.risk;
  if (s.includes("report")) return canned.report;
  return "I can help with attendance, admissions, fees, top performers, at-risk students, and semester reports. Try one of the suggestions on the left.";
}

export function AiAssistantPage() {
  const [msgs, setMsgs] = useState<{ role: "user" | "bot"; text: string }[]>([
    { role: "bot", text: "Hi Dr. Ali — I'm your ScholarOS assistant. Ask me anything about your university." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  const send = (text?: string) => {
    const t = (text ?? input).trim();
    if (!t) return;
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMsgs((m) => [...m, { role: "bot", text: answer(t) }]);
      setTyping(false);
    }, 700);
  };

  return (
    <AppShell title="AI Assistant" subtitle="Powered by ScholarOS Intelligence">
      <div className="grid lg:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-16rem)] min-h-[500px]">
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Zap className="h-4 w-4 text-primary" /> Suggestions
            </div>
            <div className="space-y-1.5">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="w-full text-left text-xs rounded-lg border p-2.5 hover:bg-accent/40 hover:border-primary/40 transition">
                  {s}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass flex flex-col overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className={m.role === "user" ? "bg-secondary" : "gradient-brand text-white"}>
                    {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                  m.role === "user" ? "gradient-brand text-white" : "bg-muted"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8"><AvatarFallback className="gradient-brand text-white"><Bot className="h-4 w-4" /></AvatarFallback></Avatar>
                <div className="bg-muted rounded-2xl px-4 py-3 flex gap-1">
                  <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" />
                  <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "120ms" }} />
                  <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "240ms" }} />
                </div>
              </div>
            )}
            <div ref={end} />
          </CardContent>
          <div className="border-t p-3 flex gap-2 bg-background/50">
            <Sparkles className="h-4 w-4 text-primary self-center ml-2" />
            <Input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about students, courses, fees, attendance…" className="border-0 focus-visible:ring-0" />
            <Button onClick={() => send()} className="gradient-brand text-white border-0"><Send className="h-4 w-4" /></Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

export default AiAssistantPage;
