import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User, Globe, Users, Palette, Mail, Check, Send,
  Sun, Moon, Shield, Crown
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [nameSaved, setNameSaved] = useState(false);

  // Fetch team members
  const { data: members = [] } = trpc.team.listMembers.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const inviteMutation = trpc.team.invite.useMutation({
    onSuccess: () => {
      setInviteSent(true);
      setInviteEmail("");
      toast.success(t("settings.invite.sent"));
      setTimeout(() => setInviteSent(false), 3000);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const updateNameMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      setNameSaved(true);
      toast.success(t("settings.saved"));
      setTimeout(() => setNameSaved(false), 2000);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate({ email: inviteEmail.trim() });
  };

  const handleSaveName = () => {
    if (!displayName.trim()) return;
    updateNameMutation.mutate({ name: displayName.trim() });
  };

  const roleLabel = (role: string) => {
    if (role === "owner") return { label: "Owner", icon: Crown, color: "text-yellow-400" };
    if (role === "admin") return { label: "Admin", icon: Shield, color: "text-blue-400" };
    return { label: "Member", icon: User, color: "text-muted-foreground" };
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account, preferences, and team</p>
      </div>

      {/* ── Account ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">{t("settings.account")}</CardTitle>
          </div>
          <CardDescription>{t("settings.account.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="displayName" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("settings.displayName")}
            </Label>
            <div className="flex gap-2">
              <Input
                id="displayName"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="h-9 text-sm"
              />
              <Button
                size="sm"
                onClick={handleSaveName}
                disabled={updateNameMutation.isPending || !displayName.trim()}
                className="h-9 px-4 shrink-0"
              >
                {nameSaved ? <Check className="w-4 h-4" /> : t("settings.save")}
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("settings.email")}
            </Label>
            <Input
              value={user?.email ?? "—"}
              disabled
              className="h-9 text-sm bg-muted/30"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Appearance ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">{t("settings.theme")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <button
              onClick={() => theme !== "light" && toggleTheme?.()}
              className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border text-sm font-medium transition-all ${
                theme === "light"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun className="w-4 h-4" />
              {t("settings.theme.light")}
            </button>
            <button
              onClick={() => theme !== "dark" && toggleTheme?.()}
              className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border text-sm font-medium transition-all ${
                theme === "dark"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Moon className="w-4 h-4" />
              {t("settings.theme.dark")}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ── Language ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">{t("settings.language")}</CardTitle>
          </div>
          <CardDescription>{t("settings.language.desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <button
              onClick={() => setLanguage("en")}
              className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border text-sm font-medium transition-all ${
                language === "en"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              {language === "en" && <Check className="w-3.5 h-3.5" />}
              🇺🇸 {t("settings.lang.en")}
            </button>
            <button
              onClick={() => setLanguage("zh")}
              className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border text-sm font-medium transition-all ${
                language === "zh"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              {language === "zh" && <Check className="w-3.5 h-3.5" />}
              🇨🇳 {t("settings.lang.zh")}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ── Team ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">{t("settings.team")}</CardTitle>
          </div>
          <CardDescription>{t("settings.team.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Invite form */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("settings.invite.email")}
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleInvite()}
                  placeholder={t("settings.invite.placeholder")}
                  className="h-9 text-sm pl-9"
                  type="email"
                />
              </div>
              <Button
                size="sm"
                onClick={handleInvite}
                disabled={inviteMutation.isPending || !inviteEmail.trim() || inviteSent}
                className="h-9 px-4 shrink-0"
              >
                {inviteSent ? (
                  <><Check className="w-4 h-4 mr-1.5" />{t("settings.invite.sent")}</>
                ) : (
                  <><Send className="w-4 h-4 mr-1.5" />{t("settings.invite.send")}</>
                )}
              </Button>
            </div>
          </div>

          {/* Current members */}
          {members.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("settings.members")}</p>
                {members.map((member: { id: number; name: string | null; email: string | null; role: string }) => {
                  const { label, icon: Icon, color } = roleLabel(member.role);
                  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name ?? "U")}&background=4f46e5&color=fff&size=64`;
                  return (
                    <div key={member.id} className="flex items-center gap-3 py-1.5">
                      <img src={avatarUrl} alt={member.name ?? ""} className="w-8 h-8 rounded-full shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{member.name ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email ?? ""}</p>
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-medium ${color}`}>
                        <Icon className="w-3 h-3" />
                        {label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
