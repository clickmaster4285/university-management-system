import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ContactPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thank you! We will get back to you soon.");
  };

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-16">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight">Contact us</h1>
        <p className="mt-4 text-muted-foreground">
          Have questions about admissions, programs, or campus visits? Reach out to our team.
        </p>
      </div>

      <div className="mt-12 grid lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="flex gap-4 glass rounded-xl p-5">
            <MapPin className="h-6 w-6 text-primary shrink-0" />
            <div>
              <p className="font-medium">Main campus</p>
              <p className="text-sm text-muted-foreground mt-1">
                ScholarOS University, Main Campus<br />
                Islamabad, Pakistan
              </p>
            </div>
          </div>
          <div className="flex gap-4 glass rounded-xl p-5">
            <Phone className="h-6 w-6 text-primary shrink-0" />
            <div>
              <p className="font-medium">Phone</p>
              <p className="text-sm text-muted-foreground mt-1">+92 51 123 4567</p>
            </div>
          </div>
          <div className="flex gap-4 glass rounded-xl p-5">
            <Mail className="h-6 w-6 text-primary shrink-0" />
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground mt-1">admissions@scholaros.edu</p>
              <p className="text-sm text-muted-foreground">info@scholaros.edu</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Send a message</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input required placeholder="Your name" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" required placeholder="you@email.com" />
            </div>
          </div>
          <div>
            <Label>Subject</Label>
            <Input required placeholder="Admissions inquiry" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea required rows={5} placeholder="How can we help?" />
          </div>
          <Button type="submit" className="w-full gradient-brand text-white border-0">
            Send message
          </Button>
        </form>
      </div>
    </div>
  );
}
