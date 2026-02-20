'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface ReasoningPanelProps {
  steps: string[];
  summary?: string;
}

export function ReasoningPanel({ steps, summary }: ReasoningPanelProps) {
  const [expanded, setExpanded] = useState(true);

  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-100 transition-colors"
      >
        <h3 className="font-semibold text-slate-900">AI Reasoning</h3>
        <ChevronDown
          className={`w-5 h-5 text-slate-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-slate-200">
          {summary && (
            <div className="p-4 border-b border-slate-200">
              <p className="text-sm text-slate-700">{summary}</p>
            </div>
          )}

          <div className="p-4 space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-grow">
                  <p className="text-sm text-slate-700">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
