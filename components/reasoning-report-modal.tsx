'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Loader2, Shield, Scale, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { LegalResponse } from '@/lib/gemini';

interface ReasoningReportModalProps {
  response: LegalResponse;
  question: string;
  language: string;
  onClose: () => void;
}

function generateReportId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'JA-';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

export function ReasoningReportModal({ response, question, language, onClose }: ReasoningReportModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const reportId = useState(() => generateReportId())[0];
  const reportDate = new Date().toLocaleString('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

  const getRiskColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'LOW': return { bg: '#dcfce7', text: '#166534', border: '#86efac', label: 'LOW RISK' };
      case 'MEDIUM': return { bg: '#fef9c3', text: '#854d0e', border: '#fde047', label: 'MEDIUM RISK' };
      case 'HIGH': return { bg: '#fecaca', text: '#991b1b', border: '#fca5a5', label: 'HIGH RISK' };
      default: return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', label: 'UNKNOWN' };
    }
  };

  const getRiskIcon = () => {
    switch (response.risk_level?.toUpperCase()) {
      case 'LOW': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'MEDIUM': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'HIGH': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <Shield className="w-5 h-5 text-slate-500" />;
    }
  };

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    const risk = getRiskColor(response.risk_level);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setIsGenerating(false);
      return;
    }

    const sourcesHtml = response.sources?.length
      ? response.sources.map(s => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:11pt;">${s.law}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:11pt;">${s.section}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">
            <a href="${s.url}" style="color:#2563eb;font-size:10pt;text-decoration:none;">${s.url}</a>
          </td>
        </tr>
      `).join('')
      : '<tr><td colspan="3" style="padding:12px;text-align:center;color:#94a3b8;">No specific sources cited</td></tr>';

    const stepsHtml = response.reasoning_steps?.map((step, i) => `
      <div style="display:flex;gap:12px;margin-bottom:14px;">
        <div style="flex-shrink:0;width:28px;height:28px;border-radius:50%;background:#eff6ff;color:#2563eb;font-size:11pt;font-weight:600;display:flex;align-items:center;justify-content:center;">${i + 1}</div>
        <div style="flex:1;padding-top:4px;font-size:11pt;line-height:1.6;color:#334155;">${step}</div>
      </div>
    `).join('') || '<p style="color:#94a3b8;">No reasoning steps available</p>';

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Legal Reasoning Report - ${reportId}</title>
  <style>
    @page { margin: 1.5cm 2cm; size: A4; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1e293b; line-height: 1.6; }
    .page { max-width: 750px; margin: 0 auto; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e3a5f; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-icon { width: 36px; height: 36px; background: #1e3a5f; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 16pt; }
    .logo-text { font-size: 18pt; font-weight: 700; color: #1e3a5f; }
    .meta { text-align: right; font-size: 9pt; color: #64748b; line-height: 1.8; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 11pt; font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
    .risk-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 16px; border-radius: 6px; font-weight: 700; font-size: 11pt; letter-spacing: 0.5px; }
    .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 11pt; line-height: 1.7; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 10pt; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 2px solid #1e3a5f; display: flex; justify-content: space-between; align-items: flex-start; font-size: 8pt; color: #94a3b8; }
    .disclaimer { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 12px; font-size: 9pt; color: #92400e; margin-top: 20px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">⚖</div>
        <div>
          <div class="logo-text">JusticeAI</div>
          <div style="font-size:8pt;color:#64748b;letter-spacing:0.5px;">EXPLAINABLE LEGAL REASONING REPORT</div>
        </div>
      </div>
      <div class="meta">
        Report ID: <strong>${reportId}</strong><br/>
        Date: ${reportDate}<br/>
        Model: Llama 3.3 70B (Groq)<br/>
        Language: ${language}
      </div>
    </div>

    <div class="section">
      <div class="section-title">1. User Query</div>
      <div class="summary-box">${question.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>

    <div class="section">
      <div class="section-title">2. Case Summary</div>
      <div class="summary-box">${response.summary?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || 'N/A'}</div>
    </div>

    <div class="section">
      <div class="section-title">3. Risk Assessment</div>
      <div style="display:flex;align-items:center;gap:12px;margin-top:8px;">
        <div class="risk-badge" style="background:${risk.bg};color:${risk.text};border:1px solid ${risk.border};">
          ${risk.label}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">4. Applicable Law</div>
      <div class="summary-box"><strong>${response.relevant_law?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || 'N/A'}</strong></div>
    </div>

    <div class="section">
      <div class="section-title">5. AI Reasoning Chain</div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
        ${stepsHtml}
      </div>
    </div>

    <div class="section">
      <div class="section-title">6. Detailed Explanation</div>
      <div class="summary-box" style="white-space:pre-wrap;">${response.explanation?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || 'N/A'}</div>
    </div>

    <div class="section">
      <div class="section-title">7. Sources & Citations</div>
      <table>
        <thead>
          <tr>
            <th>Law / Statute</th>
            <th>Section</th>
            <th>Reference URL</th>
          </tr>
        </thead>
        <tbody>${sourcesHtml}</tbody>
      </table>
    </div>

    <div class="disclaimer">
      <strong>⚠️ Important Disclaimer:</strong> This report is generated by an AI system for informational purposes only. It does NOT constitute legal advice. The analysis is based on limited information provided and may not account for all relevant facts or recent legal developments. Always consult a qualified legal professional before taking any legal action.
    </div>

    <div class="footer">
      <div>
        Generated by JusticeAI — AI-Powered Legal Guidance for India<br/>
        Report ${reportId} · ${reportDate}
      </div>
      <div style="text-align:right;">
        Powered by Llama 3.3 70B via Groq<br/>
        RAG-enhanced with curated Indian legal provisions
      </div>
    </div>
  </div>
</body>
</html>`);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      setIsGenerating(false);
    }, 500);
  };

  const risk = getRiskColor(response.risk_level);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[85vh] flex flex-col border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Scale className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Reasoning Report</h2>
              <p className="text-xs text-slate-500">Report ID: {reportId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="gap-2 bg-indigo-600 hover:bg-indigo-500"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content Preview */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Query */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">User Query</h3>
            <p className="text-sm text-slate-800 bg-slate-50 rounded-lg p-3 border border-slate-200">{question}</p>
          </div>

          {/* Summary */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Case Summary</h3>
            <p className="text-sm text-slate-700">{response.summary}</p>
          </div>

          {/* Risk + Law */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Risk Level</h3>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold"
                style={{ background: risk.bg, color: risk.text, border: `1px solid ${risk.border}` }}
              >
                {getRiskIcon()}
                {risk.label}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Applicable Law</h3>
              <p className="text-sm text-slate-700 font-medium">{response.relevant_law}</p>
            </div>
          </div>

          {/* Reasoning Chain */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
              AI Reasoning Chain ({response.reasoning_steps?.length || 0} steps)
            </h3>
            <div className="space-y-3 bg-slate-50 rounded-lg p-4 border border-slate-200">
              {response.reasoning_steps?.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex items-center justify-center">
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-700 pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sources */}
          {response.sources && response.sources.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Sources & Citations</h3>
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left px-3 py-2 font-medium text-slate-600">Law</th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">Section</th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {response.sources.map((s, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-slate-700">{s.law}</td>
                        <td className="px-3 py-2 text-slate-700">{s.section}</td>
                        <td className="px-3 py-2">
                          <a href={s.url} target="_blank" rel="noopener" className="text-blue-600 hover:underline text-xs">
                            Indian Kanoon ↗
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>⚠️ Disclaimer:</strong> This report is AI-generated for informational purposes only.
              It does not constitute legal advice. Always consult a qualified lawyer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
