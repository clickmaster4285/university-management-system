import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GraduationCap, ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — ScholarOS" },
      { name: "description", content: "Reset your ScholarOS account password." },
      { property: "og:title", content: "Reset password — ScholarOS" },
      { property: "og:description", content: "Password recovery for the ScholarOS console." },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setSent(true); setLoading(false); toast.success("Reset link sent"); }, 900);
  };

  return (
    <div className="min-h-screen grid place-items-center gradient-mesh px-4">
      <Card className="w-full max-w-md glass">
        <CardContent className="p-8">
          <Link to="/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-3 w-3" /> Back to sign in
          </Link>
          <div className="h-12 w-12 rounded-xl gradient-brand flex items-center justify-center mb-4">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          {sent ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-14 w-14 text-success mx-auto" />
              <h1 className="text-2xl font-bold mt-4">Check your inbox</h1>
              <p className="mt-2 text-sm text-muted-foreground">We sent a password reset link to <span className="font-medium text-foreground">{email}</span></p>
              <Button asChild className="mt-6 gradient-brand text-white border-0"><Link to="/login">Back to sign in</Link></Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Forgot password?</h1>
              <p className="mt-2 text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" placeholder="you@university.edu" />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-11 gradient-brand text-white border-0">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : "Send reset link"}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
