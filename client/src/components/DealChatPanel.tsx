import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send, Sparkles, Loader2, MessageSquare } from "lucide-react";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DealChatPanelProps {
  dealId: number;
  className?: string;
  compact?: boolean;
}

// ─── Suggested Prompts ───────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  "帮我分析一下当前的渗透策略",
  "哪个维度最需要优先突破？",
  "有哪些关键风险需要注意？",
];

// ─── Component ───────────────────────────────────────────────────────────────

export function DealChatPanel({ dealId, className, compact = false }: DealChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch chat history
  const { data: messages = [], isLoading: loadingHistory } = trpc.dealChat.list.useQuery(
    { dealId, limit: 50 },
    { enabled: !!dealId }
  );

  // Send message mutation
  const sendMutation = trpc.dealChat.send.useMutation({
    onSuccess: () => {
      setInput("");
      utils.dealChat.list.invalidate({ dealId });
    },
  });

  const utils = trpc.useUtils();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMutation.isPending]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate({ dealId, message: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt: string) => {
    if (sendMutation.isPending) return;
    sendMutation.mutate({ dealId, message: prompt });
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header — compact */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 shrink-0">
        <MessageSquare size={13} className="text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">AI 军师</span>
      </div>

      {/* Messages area — takes all available space */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3"
      >
        {messages.length === 0 && !loadingHistory && (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <Sparkles size={20} className="text-amber-500/60" />
            <p className="text-xs text-muted-foreground text-center">
              问我任何关于这笔交易的问题
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePromptClick(prompt)}
                  className="text-[10px] px-2 py-1 rounded-full border border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg: any) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={10} className="text-primary" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-foreground"
              )}
            >
              {msg.role === "assistant" ? (
                <Streamdown>{msg.content}</Streamdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {sendMutation.isPending && (
          <div className="flex gap-2 justify-start">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles size={10} className="text-primary" />
            </div>
            <div className="bg-muted/50 rounded-lg px-3 py-2">
              <Loader2 size={14} className="animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input area — compact single-line */}
      <div className="shrink-0 px-3 py-2 border-t border-border/30">
        <div className="flex items-center gap-1.5 bg-muted/30 rounded-lg border border-border/30 px-2.5 py-1.5 focus-within:border-primary/40 transition-colors">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            className="flex-1 bg-transparent text-xs border-0 outline-none placeholder:text-muted-foreground/40 h-6"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            className="h-6 w-6 p-0 shrink-0"
          >
            <Send size={12} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DealChatPanel;
