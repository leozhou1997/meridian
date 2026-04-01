import { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const suggestionsEn = [
  'Which deals are most at risk this week?',
  'Summarize the Acme Corp deal status',
  'Who are the key blockers across my pipeline?',
  'What should I prioritize today?',
  'Draft a follow-up email for GlobalTech',
  'Compare confidence trends across deals',
];

const suggestionsZh = [
  '本周哪些交易风险最高？',
  '总结一下某个交易的当前状态',
  '我的管线中有哪些关键阻碍者？',
  '今天我应该优先处理什么？',
  '帮我起草一封跟进邮件',
  '对比各交易的信心趋势',
];

export default function AskMeridian() {
  const [query, setQuery] = useState('');
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const suggestions = isZh ? suggestionsZh : suggestionsEn;

  const comingSoonMsg = isZh ? 'AI 助手即将上线，此功能正在开发中。' : 'AI assistant coming soon — this feature requires backend integration.';

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-xl w-full text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
          <Compass className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-bold mb-2">{isZh ? '问问 Meridian' : 'Ask Meridian'}</h1>
        <p className="text-muted-foreground text-sm mb-8">
          {isZh ? '你的 AI 销售智能助手。可以询问交易、利益相关者、风险或策略相关问题。' : 'Your AI sales intelligence assistant. Ask about deals, stakeholders, risks, or strategy.'}
        </p>

        <div className="relative mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isZh ? '输入关于你的管线的任何问题...' : 'Ask anything about your pipeline...'}
            className="w-full h-12 px-5 pr-12 rounded-xl bg-card border border-border/60 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                toast(comingSoonMsg);
                setQuery('');
              }
            }}
          />
          <button
            onClick={() => {
              if (query.trim()) {
                toast(comingSoonMsg);
                setQuery('');
              }
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => {
                setQuery(s);
                toast(comingSoonMsg);
              }}
              className="text-left p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-border/60 hover:bg-muted/50 transition-all text-xs text-muted-foreground hover:text-foreground"
            >
              <Sparkles className="w-3 h-3 text-primary/50 mb-1" />
              {s}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
