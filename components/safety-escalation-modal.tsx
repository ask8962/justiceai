'use client';

import { Button } from '@/components/ui/button';
import { Phone, Shield, X, ExternalLink, AlertTriangle } from 'lucide-react';
import { SafetyResult } from '@/lib/safety-detector';

interface SafetyEscalationModalProps {
    safetyResult: SafetyResult;
    onDismiss: () => void;
}

export function SafetyEscalationModal({ safetyResult, onDismiss }: SafetyEscalationModalProps) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden border-2 border-red-200">
                {/* Red Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-5 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Safety Alert</h2>
                            <p className="text-red-100 text-sm">{safetyResult.categoryLabel}</p>
                        </div>
                    </div>
                </div>

                {/* Warning Message */}
                <div className="px-6 py-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800 leading-relaxed">
                                {safetyResult.warningMessage}
                            </p>
                        </div>
                    </div>

                    {/* Helplines */}
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-600" />
                        Verified Emergency Helplines
                    </h3>
                    <div className="space-y-2 mb-4">
                        {safetyResult.helplines.map((helpline, i) => (
                            <a
                                key={i}
                                href={`tel:${helpline.number}`}
                                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all group"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-slate-800">{helpline.name}</span>
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                            {helpline.available}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">{helpline.description}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-emerald-600 group-hover:text-emerald-700 font-mono">
                                        {helpline.number}
                                    </span>
                                    <Phone className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </a>
                        ))}
                    </div>

                    {/* Legal Aid Link */}
                    <a
                        href="https://nalsa.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors text-sm font-medium mb-4"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Connect to NALSA (Free Legal Aid) — nalsa.gov.in
                    </a>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                        Helpline numbers verified as of 2025
                    </p>
                    <Button
                        onClick={onDismiss}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                    >
                        I understand, show AI guidance
                    </Button>
                </div>
            </div>
        </div>
    );
}
