import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch chat history
  const { data: messages = [], isLoading: loadingHistory } = trpc.dealChat.list.useQuery(
    { dealId, limit: 50 },
    { enabled: !!dealId }
  );

  // Send message mutation
  const sendMutation = trpc.dealChat.send.useMutation({
    onSuccess: () => {
      setInput("");
      // Invalidate to refresh messages
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
    <div className={cn("flex flex-col border-t border-border bg-background", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
        <MessageSquare size={14} className="text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">AI 军师</span>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-y-auto px-3 py-2 space-y-3",
          compact ? "max-h-[200px]" : "max-h-[300px]"
        )}
      >
        {messages.length === 0 && !loadingHistory && (
          <div className="flex flex-col items-center justify-center py-4 gap-3">
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
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={12} className="text-indigo-600" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
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
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <Sparkles size={12} className="text-indigo-600" />
            </div>
            <div className="bg-muted rounded-lg px-3 py-2">
              <Loader2 size={14} className="animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="px-3 py-2 border-t border-border">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-xs border-0 outline-none placeholder:text-muted-foreground/50 min-h-[28px] max-h-[80px] py-1"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            className="h-7 w-7 p-0 shrink-0"
          >
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DealChatPanel;
