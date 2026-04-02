import { useState, useRef } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency, getStageName } from '@/lib/data';

interface DealReportData {
  company: string;
  name: string;
  stage: string;
  value: number;
  confidenceScore: number;
  companyInfo?: string;
  website?: string;
  stakeholders: Array<{
    name: string;
    title: string | null;
    role: string;
    sentiment: string;
    engagement: string;
  }>;
  snapshot?: {
    whatsHappening?: string;
    keyRisks?: Array<{ title: string; detail: string }> | string[];
    whatsNext?: Array<{ action: string; rationale?: string }> | string[];
    confidenceChange?: number;
  } | null;
  nextActions: Array<{
    text: string;
    dueDate?: Date | string | null;
    completed: boolean;
    status?: string;
  }>;
  interactions: Array<{
    date: Date | string;
    type: string;
    keyParticipant: string | null;
    summary: string | null;
  }>;
}

interface DealPDFExportProps {
  deal: DealReportData;
}

export default function DealPDFExport({ deal }: DealPDFExportProps) {
  const { t, language } = useLanguage();
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);

    const isZh = language === 'zh';
    const now = new Date();
    const dateStr = now.toLocaleDateString(isZh ? 'zh-CN' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    // Build stakeholder rows
    const stakeholderRows = deal.stakeholders.map(s => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:500;">${s.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${s.title ?? '-'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${s.role}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${s.sentiment}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${s.engagement}</td>
      </tr>
    `).join('');

    // Build risks
    const risks = deal.snapshot?.keyRisks ?? [];
    const risksHtml = risks.length > 0 ? risks.map((r, i) => {
      const title = typeof r === 'string' ? r : r.title;
      const detail = typeof r === 'string' ? '' : r.detail;
      return `<div style="margin-bottom:8px;padding:10px 14px;background:#fef2f2;border-left:3px solid #ef4444;border-radius:4px;">
        <div style="font-weight:600;color:#991b1b;font-size:13px;">${title}</div>
        ${detail ? `<div style="color:#7f1d1d;font-size:12px;margin-top:4px;">${detail}</div>` : ''}
      </div>`;
    }).join('') : `<p style="color:#9ca3af;font-style:italic;">${isZh ? '暂无风险记录' : 'No risks recorded'}</p>`;

    // Build next actions
    const pendingActions = deal.nextActions.filter(a => !a.completed);
    const actionsHtml = pendingActions.length > 0 ? `<ul style="padding-left:20px;margin:0;">` +
      pendingActions.map(a => {
        const due = a.dueDate ? new Date(a.dueDate).toLocaleDateString(isZh ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' }) : '';
        const overdue = a.dueDate && new Date(a.dueDate) < now;
        return `<li style="margin-bottom:6px;font-size:13px;">
          ${a.text}${due ? ` <span style="color:${overdue ? '#ef4444' : '#6b7280'};font-size:11px;">(${isZh ? '截止' : 'Due'} ${due})</span>` : ''}
        </li>`;
      }).join('') + '</ul>'
      : `<p style="color:#9ca3af;font-style:italic;">${isZh ? '暂无待办事项' : 'No pending actions'}</p>`;

    // Build what's next
    const whatsNextItems = deal.snapshot?.whatsNext ?? [];
    const whatsNextHtml = whatsNextItems.length > 0 ? whatsNextItems.map(item => {
      const action = typeof item === 'string' ? item : item.action;
      const rationale = typeof item === 'string' ? '' : item.rationale;
      return `<div style="margin-bottom:8px;padding:10px 14px;background:#f0fdf4;border-left:3px solid #22c55e;border-radius:4px;">
        <div style="font-weight:600;color:#166534;font-size:13px;">${action}</div>
        ${rationale ? `<div style="color:#15803d;font-size:12px;margin-top:4px;">${rationale}</div>` : ''}
      </div>`;
    }).join('') : '';

    // Build recent interactions (last 5)
    const recentInteractions = [...deal.interactions].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 5);
    const interactionsHtml = recentInteractions.length > 0 ? recentInteractions.map(m => {
      const d = new Date(m.date).toLocaleDateString(isZh ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `<div style="margin-bottom:10px;padding:10px 14px;background:#f9fafb;border-radius:6px;border:1px solid #e5e7eb;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-weight:600;font-size:13px;color:#1f2937;">${m.type}</span>
          <span style="font-size:11px;color:#6b7280;">${d}</span>
        </div>
        ${m.keyParticipant ? `<div style="font-size:12px;color:#6b7280;margin-bottom:4px;">${isZh ? '参与者' : 'With'}: ${m.keyParticipant}</div>` : ''}
        ${m.summary ? `<div style="font-size:12px;color:#374151;line-height:1.5;">${m.summary.length > 300 ? m.summary.slice(0, 300) + '...' : m.summary}</div>` : ''}
      </div>`;
    }).join('') : `<p style="color:#9ca3af;font-style:italic;">${isZh ? '暂无互动记录' : 'No interactions recorded'}</p>`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${deal.company} - ${isZh ? 'Deal 报告' : 'Deal Report'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, sans-serif; color: #1f2937; line-height: 1.6; }
    @page { size: A4; margin: 20mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body style="padding:40px;max-width:800px;margin:0 auto;">
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #2563eb;">
    <div>
      <h1 style="font-size:24px;font-weight:700;color:#1e3a5f;margin-bottom:4px;">${deal.company}</h1>
      <div style="font-size:14px;color:#6b7280;">${deal.name}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Meridian ${isZh ? '报告' : 'Report'}</div>
      <div style="font-size:12px;color:#6b7280;">${dateStr}</div>
    </div>
  </div>

  <!-- Key Metrics -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;">
    <div style="padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">${isZh ? '阶段' : 'Stage'}</div>
      <div style="font-size:16px;font-weight:600;color:#1e3a5f;">${getStageName(deal.stage, isZh)}</div>
    </div>
    <div style="padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">ACV</div>
      <div style="font-size:16px;font-weight:600;color:#1e3a5f;">${formatCurrency(deal.value)}</div>
    </div>
    <div style="padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">${isZh ? '信心指数' : 'Confidence'}</div>
      <div style="font-size:16px;font-weight:600;color:${deal.confidenceScore >= 70 ? '#16a34a' : deal.confidenceScore >= 40 ? '#d97706' : '#dc2626'};">${deal.confidenceScore}%</div>
    </div>
    <div style="padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">${isZh ? '利益相关方' : 'Stakeholders'}</div>
      <div style="font-size:16px;font-weight:600;color:#1e3a5f;">${deal.stakeholders.length}</div>
    </div>
  </div>

  <!-- Current Situation -->
  ${deal.snapshot?.whatsHappening ? `
  <div style="margin-bottom:24px;">
    <h2 style="font-size:15px;font-weight:600;color:#1e3a5f;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e5e7eb;">${isZh ? '当前动态' : "What's Happening"}</h2>
    <p style="font-size:13px;color:#374151;line-height:1.7;">${deal.snapshot.whatsHappening}</p>
  </div>` : ''}

  <!-- Key Risks -->
  <div style="margin-bottom:24px;">
    <h2 style="font-size:15px;font-weight:600;color:#1e3a5f;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e5e7eb;">${isZh ? '关键风险' : 'Key Risks'}</h2>
    ${risksHtml}
  </div>

  <!-- What's Next -->
  ${whatsNextHtml ? `
  <div style="margin-bottom:24px;">
    <h2 style="font-size:15px;font-weight:600;color:#1e3a5f;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e5e7eb;">${isZh ? '下一步行动' : "What's Next"}</h2>
    ${whatsNextHtml}
  </div>` : ''}

  <!-- Pending Actions -->
  <div style="margin-bottom:24px;">
    <h2 style="font-size:15px;font-weight:600;color:#1e3a5f;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e5e7eb;">${isZh ? '待办事项' : 'Pending Actions'}</h2>
    ${actionsHtml}
  </div>

  <!-- Stakeholders -->
  <div style="margin-bottom:24px;" class="page-break">
    <h2 style="font-size:15px;font-weight:600;color:#1e3a5f;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e5e7eb;">${isZh ? '利益相关方' : 'Stakeholders'}</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="padding:8px 12px;text-align:left;font-weight:600;color:#475569;border-bottom:2px solid #e2e8f0;">${isZh ? '姓名' : 'Name'}</th>
          <th style="padding:8px 12px;text-align:left;font-weight:600;color:#475569;border-bottom:2px solid #e2e8f0;">${isZh ? '职位' : 'Title'}</th>
          <th style="padding:8px 12px;text-align:left;font-weight:600;color:#475569;border-bottom:2px solid #e2e8f0;">${isZh ? '角色' : 'Role'}</th>
          <th style="padding:8px 12px;text-align:left;font-weight:600;color:#475569;border-bottom:2px solid #e2e8f0;">${isZh ? '态度' : 'Sentiment'}</th>
          <th style="padding:8px 12px;text-align:left;font-weight:600;color:#475569;border-bottom:2px solid #e2e8f0;">${isZh ? '参与度' : 'Engagement'}</th>
        </tr>
      </thead>
      <tbody>${stakeholderRows}</tbody>
    </table>
  </div>

  <!-- Recent Interactions -->
  <div style="margin-bottom:24px;">
    <h2 style="font-size:15px;font-weight:600;color:#1e3a5f;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e5e7eb;">${isZh ? '近期互动' : 'Recent Interactions'} (${recentInteractions.length})</h2>
    ${interactionsHtml}
  </div>

  <!-- Footer -->
  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;">
    <div style="font-size:11px;color:#9ca3af;">${isZh ? '由 Meridian 生成' : 'Generated by Meridian'} · ${dateStr}</div>
  </div>
</body>
</html>`;

    // Open in new window and trigger print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      // Wait for fonts to load then print
      setTimeout(() => {
        printWindow.print();
        setExporting(false);
      }, 800);
    } else {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={exporting}
      className="h-8 px-3 text-xs gap-1.5"
    >
      {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
      {language === 'zh' ? '导出报告' : 'Export Report'}
    </Button>
  );
}
