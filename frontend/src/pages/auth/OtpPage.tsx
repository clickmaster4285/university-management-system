import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { GraduationCap, ArrowLeft, Loader2 } from "lucide-react";

export function OtpPage() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const verify = () => {
    if (otp.length !== 6) return toast.error("Enter the 6-digit code");
    setLoading(true);
    setTimeout(() => {
      login({ name: "Dr. Ali Raza", email: "admin@scholaros.edu", role: "Super Admin" });
      toast.success("Verified");
      navigate({ to: "/app" });
    }, 800);
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
          <h1 className="text-2xl font-bold">Verify your identity</h1>
          <p className="mt-2 text-sm text-muted-foreground">We sent a 6-digit code to <span className="font-medium text-foreground">admin@scholaros.edu</span></p>

          <div className="mt-8 flex justify-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button onClick={verify} disabled={loading} className="w-full h-11 mt-8 gradient-brand text-white border-0">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</> : "Verify & continue"}
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Didn't receive it? <button className="text-primary hover:underline" onClick={() => toast.success("Code resent")}>Resend code</button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default OtpPage;
