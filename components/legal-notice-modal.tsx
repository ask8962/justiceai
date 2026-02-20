'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, FileText, Loader2, Copy, Check, Pencil, Download } from 'lucide-react';
import { LegalResponse } from '@/lib/gemini';

interface LegalNoticeModalProps {
    response: LegalResponse;
    language: string;
    onClose: () => void;
}

export function LegalNoticeModal({ response, language, onClose }: LegalNoticeModalProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [noticeText, setNoticeText] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isEdited, setIsEdited] = useState(false);

    const generateNotice = async () => {
        setIsGenerating(true);
        try {
            // Dynamic import to avoid circular deps
            const { generateLegalNotice } = await import('@/lib/gemini');
            const notice = await generateLegalNotice(response, language);
            setNoticeText(notice);
            setIsEdited(false);
        } catch (error) {
            console.error('Notice generation error:', error);
            setNoticeText('Failed to generate notice. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (noticeText) {
            navigator.clipboard.writeText(noticeText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNoticeText(e.target.value);
        setIsEdited(true);
    };

    const handleSaveAsPDF = () => {
        if (!noticeText) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Legal Notice - JusticeAI</title>
                <style>
                    @page { margin: 2cm; }
                    body {
                        font-family: 'Times New Roman', Times, serif;
                        font-size: 13pt;
                        line-height: 1.8;
                        color: #1a1a1a;
                        max-width: 700px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #333;
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                        font-size: 10pt;
                        color: #666;
                    }
                    .content { white-space: pre-wrap; }
                    .footer {
                        margin-top: 30px;
                        padding-top: 10px;
                        border-top: 1px solid #ccc;
                        font-size: 9pt;
                        color: #999;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="header">LEGAL NOTICE — Generated via JusticeAI</div>
                <div class="content">${noticeText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                <div class="footer">This is an AI-generated draft for reference only. Please consult a qualified lawyer before use.</div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 300);
    };

    // Generate on mount
    if (!noticeText && !isGenerating) {
        generateNotice();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col border border-slate-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-slate-900">Legal Notice Draft</h2>
                        {isEdited && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                Edited
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {noticeText && !isGenerating && (
                            <Button size="sm" variant="outline" onClick={generateNotice} className="gap-2 text-blue-600">
                                <Loader2 className="w-4 h-4" />
                                Regenerate
                            </Button>
                        )}
                        {noticeText && (
                            <Button size="sm" variant="outline" onClick={handleSaveAsPDF} className="gap-2 text-emerald-600">
                                <Download className="w-4 h-4" />
                                Save PDF
                            </Button>
                        )}
                        {noticeText && (
                            <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2">
                                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy'}
                            </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <p className="text-sm text-slate-600">Drafting legal notice using AI...</p>
                            <p className="text-xs text-slate-400">Based on: {response.relevant_law}</p>
                        </div>
                    ) : noticeText ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                <Pencil className="w-3 h-3" />
                                Click below to edit — replace [PLACEHOLDERS] with your details
                            </div>
                            <textarea
                                value={noticeText}
                                onChange={handleTextChange}
                                className="w-full min-h-[400px] bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-800 font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
                                spellCheck={false}
                            />
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-amber-50">
                    <p className="text-xs text-amber-800">
                        <strong>⚠️ Disclaimer:</strong> This is an AI-generated draft for reference only.
                        Please get it reviewed by a qualified lawyer before sending.
                    </p>
                </div>
            </div>
        </div>
    );
}
