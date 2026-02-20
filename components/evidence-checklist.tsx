'use client';

import { CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export interface EvidenceItem {
    item: string;
    status: 'required' | 'optional';
    description: string;
}

export function EvidenceChecklist({ items }: { items: EvidenceItem[] }) {
    const [checked, setChecked] = useState<Set<number>>(new Set());

    const toggle = (index: number) => {
        const next = new Set(checked);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        setChecked(next);
    };

    const completed = checked.size;
    const total = items.length;
    // Prevent division by zero
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (!items || items.length === 0) return null;

    return (
        <div className="mt-4 p-4 bg-slate-50/50 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Evidence Checklist
                </h3>
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {completed}/{total} Ready
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-200 rounded-full mb-4 overflow-hidden">
                <div
                    className="h-full bg-blue-600 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="space-y-2">
                {items.map((evidence, idx) => (
                    <div
                        key={idx}
                        onClick={() => toggle(idx)}
                        className={`
              group flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200
              ${checked.has(idx)
                                ? 'bg-blue-50/50 border-blue-200 shadow-none'
                                : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'}
            `}
                    >
                        <div className={`
              mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all duration-200
              ${checked.has(idx) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300 group-hover:border-blue-400'}
            `}>
                            {checked.has(idx) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <span className={`font-medium truncate pr-2 ${checked.has(idx) ? 'text-slate-500 line-through decoration-slate-400' : 'text-slate-900'}`}>
                                    {evidence.item}
                                </span>
                                {evidence.status === 'required' && (
                                    <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                                        Required
                                    </span>
                                )}
                            </div>
                            <p className={`text-xs ${checked.has(idx) ? 'text-slate-400' : 'text-slate-600'}`}>
                                {evidence.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
