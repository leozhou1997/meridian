import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

interface WaitlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: string;
}

export function WaitlistDialog({
  open,
  onOpenChange,
  source = "landing_page",
}: WaitlistDialogProps) {
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const requestAccess = trpc.landing.requestAccess.useMutation({
    onSuccess: (data) => {
      if (data.message === "already_submitted") {
        setAlreadySubmitted(true);
      }
      setSubmitted(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    requestAccess.mutate({
      email,
      fullName: fullName || undefined,
      companyName: companyName || undefined,
      source,
    });
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setTimeout(() => {
        setEmail("");
        setFullName("");
        setCompanyName("");
        setSubmitted(false);
        setAlreadySubmitted(false);
      }, 300);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-white/10 text-white">
        {submitted ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {alreadySubmitted
                ? t(language, "waitlist_success_already")
                : t(language, "waitlist_success_title")}
            </h3>
            <p className="text-slate-400 text-sm max-w-xs">
              {alreadySubmitted
                ? t(language, "waitlist_success_already_desc")
                : t(language, "waitlist_success_desc")}
            </p>
            <Button
              onClick={() => handleClose(false)}
              className="mt-6 bg-white/10 hover:bg-white/20 text-white border-0"
            >
              {t(language, "waitlist_got_it")}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                {t(language, "waitlist_title")}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {t(language, "waitlist_desc")}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 text-sm">
                  {t(language, "waitlist_email_label")} <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t(language, "waitlist_email_placeholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-300 text-sm">
                  {t(language, "waitlist_name_label")}
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={t(language, "waitlist_name_placeholder")}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-slate-300 text-sm">
                  {t(language, "waitlist_company_label")}
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder={t(language, "waitlist_company_placeholder")}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                />
              </div>

              <Button
                type="submit"
                disabled={!email || requestAccess.isPending}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium py-2.5 shadow-lg shadow-cyan-500/20"
              >
                {requestAccess.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t(language, "waitlist_submitting")}
                  </>
                ) : (
                  t(language, "waitlist_submit")
                )}
              </Button>

              {requestAccess.isError && (
                <p className="text-red-400 text-sm text-center">
                  {t(language, "waitlist_error")}
                </p>
              )}
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
