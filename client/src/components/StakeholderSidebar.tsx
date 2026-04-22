import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StakeholderInfo {
  id: number;
  name: string;
  title?: string | null;
  role: string;
  sentiment: string;
  engagement: string;
  avatar?: string | null;
}

export interface AIInsight {
  text: string;
  type?: "warning" | "opportunity" | "info";
}

export interface StakeholderSidebarProps {
  stakeholders: StakeholderInfo[];
  aiInsights?: AIInsight[];
  onStakeholderClick?: (id: number) => void;
  className?: string;
}

// ─── Attitude Config ─────────────────────────────────────────────────────────

const ATTITUDE_CONFIG: Record<string, { label: string; className: string }> = {
  Positive: { label: "支持", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Neutral: { label: "中立", className: "bg-gray-50 text-gray-600 border-gray-200" },
  Negative: { label: "阻碍", className: "bg-red-50 text-red-700 border-red-200" },
  // Extended attitudes for Decision Map
  support: { label: "支持", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  neutral: { label: "中立", className: "bg-gray-50 text-gray-600 border-gray-200" },
  blocker: { label: "阻碍", className: "bg-red-50 text-red-700 border-red-200" },
  leaning: { label: "倾向", className: "bg-amber-50 text-amber-700 border-amber-200" },
  unknown: { label: "未知", className: "bg-slate-50 text-slate-500 border-slate-200" },
};

const ROLE_LABELS: Record<string, string> = {
  "Champion": "支持者",
  "Decision Maker": "最终决策",
  "Influencer": "影响者",
  "Blocker": "阻碍者",
  "User": "使用者",
  "Evaluator": "评估者",
};

const INSIGHT_TYPE_CONFIG: Record<string, { dotClass: string }> = {
  warning: { dotClass: "bg-red-500" },
  opportunity: { dotClass: "bg-emerald-500" },
  info: { dotClass: "bg-blue-500" },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function StakeholderSidebar({
  stakeholders,
  aiInsights = [],
  onStakeholderClick,
  className,
}: StakeholderSidebarProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Stakeholder List */}
      <div className="flex-1 min-h-0">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3">
          <h3 className="text-sm font-semibold text-foreground">
            决策人
          </h3>
          <span className="text-xs text-muted-foreground">
            · {stakeholders.length}人
          </span>
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className="space-y-0.5">
            {stakeholders.map((s) => {
              const attitude = ATTITUDE_CONFIG[s.sentiment] || ATTITUDE_CONFIG.unknown;
              const roleLabel = ROLE_LABELS[s.role] || s.role;

              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => onStakeholderClick?.(s.id)}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={s.avatar || undefined} alt={s.name} />
                    <AvatarFallback className="text-xs bg-muted">
                      {s.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground truncate">
                        {s.name}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {s.title || roleLabel}
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn("text-[10px] px-1.5 py-0 h-5 shrink-0 font-normal", attitude.className)}
                  >
                    {attitude.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* AI Quick Insights */}
      {aiInsights.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={13} className="text-amber-500" />
            <span className="text-xs font-semibold text-foreground">AI 快速洞察</span>
          </div>
          <div className="space-y-2">
            {aiInsights.map((insight, idx) => {
              const typeCfg = INSIGHT_TYPE_CONFIG[insight.type || "info"];
              return (
                <div key={idx} className="flex items-start gap-2">
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                      typeCfg?.dotClass || "bg-blue-500"
                    )}
                  />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insight.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default StakeholderSidebar;
