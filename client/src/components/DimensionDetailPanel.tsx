import { useState, useMemo } from "react";
import {
  X, Check, Play, AlertTriangle, Clock, ChevronDown, ChevronUp,
  Sparkles, Plus, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { DIMENSION_CONFIG, STATUS_CONFIG } from "./DecisionMap";
import type { DimensionData, ActionItem } from "./DecisionMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DimensionDetailPanelProps {
  dimensionKey: string;
  dimension: DimensionData | null;
  actions: ActionItem[];
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (dimensionKey: string, status: string) => void;
  onActionToggle?: (actionId: number, completed: boolean) => void;
  onAddAction?: (text: string, dimensionKey: string) => void;
  className?: string;
}

// ─── Status Options ──────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "not_started", labelZh: "待启动", labelEn: "Not Started" },
  { value: "in_progress", labelZh: "进行中", labelEn: "In Progress" },
  { value: "completed", labelZh: "已完成", labelEn: "Completed" },
  { value: "blocked", labelZh: "阻塞", labelEn: "Blocked" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function DimensionDetailPanel({
  dimensionKey,
  dimension,
  actions,
  isOpen,
  onClose,
  onStatusChange,
  onActionToggle,
  onAddAction,
  className,
}: DimensionDetailPanelProps) {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const [newActionText, setNewActionText] = useState("");
  const [showAddAction, setShowAddAction] = useState(false);

  const config = DIMENSION_CONFIG[dimensionKey];
  const status = dimension?.status || "not_started";
  const statusCfg = STATUS_CONFIG[status];

  // Sort actions: pending first, then in_progress, then done
  const sortedActions = useMemo(() => {
    const order: Record<string, number> = {
      blocked: 0,
      pending: 1,
      accepted: 2,
      in_progress: 3,
      done: 4,
    };
    return [...actions].sort(
      (a, b) => (order[a.status] ?? 2) - (order[b.status] ?? 2)
    );
  }, [actions]);

  const completedCount = actions.filter(
    (a) => a.status === "done"
  ).length;
  const totalCount = actions.length;

  if (!isOpen || !config) return null;

  const handleAddAction = () => {
    if (newActionText.trim() && onAddAction) {
      onAddAction(newActionText.trim(), dimensionKey);
      setNewActionText("");
      setShowAddAction(false);
    }
  };

  return (
    <div
      className={cn(
        "w-[340px] shrink-0 border-l border-border/30 bg-card/50 backdrop-blur-sm flex flex-col h-full",
        "animate-in slide-in-from-right-4 duration-200",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: config.color + "18" }}
            >
              <config.icon size={16} style={{ color: config.color }} />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-foreground">
                {isZh ? config.label : config.labelEn}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {completedCount}/{totalCount}{" "}
                {isZh ? "个动作已完成" : "actions done"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Status selector */}
        <div className="flex items-center gap-1.5">
          {STATUS_OPTIONS.map((opt) => {
            const isActive = status === opt.value;
            const optCfg = STATUS_CONFIG[opt.value];
            return (
              <button
                key={opt.value}
                onClick={() => onStatusChange?.(dimensionKey, opt.value)}
                className={cn(
                  "flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all",
                  isActive
                    ? "text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50"
                )}
                style={isActive ? { backgroundColor: optCfg?.color } : undefined}
              >
                {isZh ? opt.labelZh : opt.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Summary */}
      {dimension?.aiSummary && (
        <div className="px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={11} className="text-primary" />
            <span className="text-[10px] font-medium text-primary">
              {isZh ? "AI 分析" : "AI Analysis"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {dimension.aiSummary}
          </p>
        </div>
      )}

      {/* Action Items */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">
            {isZh ? "关键动作" : "Action Items"}
          </span>
          <button
            onClick={() => setShowAddAction(!showAddAction)}
            className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
          >
            <Plus size={12} />
            {isZh ? "添加" : "Add"}
          </button>
        </div>

        {/* Add action input */}
        {showAddAction && (
          <div className="px-4 pb-2">
            <div className="flex gap-2">
              <Textarea
                value={newActionText}
                onChange={(e) => setNewActionText(e.target.value)}
                placeholder={
                  isZh ? "描述下一步动作..." : "Describe next action..."
                }
                className="text-xs min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddAction();
                  }
                }}
              />
            </div>
            <div className="flex gap-2 mt-1.5">
              <Button
                size="sm"
                onClick={handleAddAction}
                disabled={!newActionText.trim()}
                className="h-7 text-[10px]"
              >
                {isZh ? "确认" : "Add"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAddAction(false);
                  setNewActionText("");
                }}
                className="h-7 text-[10px]"
              >
                {isZh ? "取消" : "Cancel"}
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 pb-4 space-y-1.5">
            {sortedActions.length === 0 ? (
              <div className="py-8 text-center">
                <Clock size={20} className="mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {isZh
                    ? "暂无动作项，点击上方添加"
                    : "No actions yet. Click Add above."}
                </p>
              </div>
            ) : (
              sortedActions.map((action) => {
                const isDone = action.status === "done";
                const isBlocked = action.status === "blocked";
                const isInProgress =
                  action.status === "in_progress" ||
                  action.status === "accepted";
                const priorityColor =
                  action.priority === "high"
                    ? "text-red-500"
                    : action.priority === "medium"
                    ? "text-amber-500"
                    : "text-muted-foreground/50";

                return (
                  <div
                    key={action.id}
                    className={cn(
                      "group flex items-start gap-2.5 p-2.5 rounded-lg transition-colors",
                      isDone
                        ? "bg-muted/20 opacity-60"
                        : "hover:bg-muted/30"
                    )}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() =>
                        onActionToggle?.(action.id, !isDone)
                      }
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                        isDone
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : isBlocked
                          ? "border-red-400 text-red-400"
                          : isInProgress
                          ? "border-blue-400 text-blue-400"
                          : "border-muted-foreground/30 hover:border-muted-foreground/50"
                      )}
                    >
                      {isDone && <Check size={12} />}
                      {isBlocked && <AlertTriangle size={10} />}
                      {isInProgress && <Play size={10} />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-xs leading-relaxed",
                          isDone
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        )}
                      >
                        {action.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {action.priority && (
                          <span
                            className={cn(
                              "text-[9px] font-medium uppercase",
                              priorityColor
                            )}
                          >
                            {action.priority === "high"
                              ? isZh
                                ? "高优"
                                : "HIGH"
                              : action.priority === "medium"
                              ? isZh
                                ? "中等"
                                : "MED"
                              : isZh
                              ? "低"
                              : "LOW"}
                          </span>
                        )}
                        <span className="text-[9px] text-muted-foreground/50">
                          {isDone
                            ? isZh
                              ? "已完成"
                              : "Done"
                            : isBlocked
                            ? isZh
                              ? "受阻"
                              : "Blocked"
                            : isInProgress
                            ? isZh
                              ? "进行中"
                              : "Active"
                            : isZh
                            ? "待处理"
                            : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Notes section */}
      {dimension?.notes && (
        <div className="px-4 py-3 border-t border-border/30">
          <span className="text-[10px] font-medium text-muted-foreground mb-1 block">
            {isZh ? "备注" : "Notes"}
          </span>
          <p className="text-xs text-foreground/80 leading-relaxed">
            {dimension.notes}
          </p>
        </div>
      )}
    </div>
  );
}

export default DimensionDetailPanel;
