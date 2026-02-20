'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/app/auth-context';
import { getAuditTrail, verifyRecordIntegrity, AuditRecord } from '@/lib/audit-service';
import { Button } from '@/components/ui/button';
import {
    Shield, ShieldCheck, ShieldAlert, ArrowLeft, Loader2,
    ChevronDown, ChevronUp, RefreshCw, Hash, Clock, Scale,
    AlertTriangle, CheckCircle, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface VerificationState {
    [recordId: string]: { valid: boolean; checked: boolean } | undefined;
}

export default function AuditPage() {
    const { user } = useAuth();
    const [records, setRecords] = useState<AuditRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [verifications, setVerifications] = useState<VerificationState>({});
    const [isVerifyingAll, setIsVerifyingAll] = useState(false);

    useEffect(() => {
        if (user) loadAuditTrail();
    }, [user]);

    const loadAuditTrail = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await getAuditTrail(user.uid);
            setRecords(data);
        } catch (err) {
            console.error('Failed to load audit trail:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const verifySingle = async (record: AuditRecord) => {
        const result = await verifyRecordIntegrity(record);
        setVerifications((prev) => ({
            ...prev,
            [record.id]: { valid: result.valid, checked: true },
        }));
    };

    const verifyAll = async () => {
        setIsVerifyingAll(true);
        for (const record of records) {
            await verifySingle(record);
        }
        setIsVerifyingAll(false);
    };

    const getRiskBadge = (level?: string) => {
        switch (level?.toUpperCase()) {
            case 'LOW':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3" /> Low
                    </span>
                );
            case 'MEDIUM':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        <AlertTriangle className="w-3 h-3" /> Medium
                    </span>
                );
            case 'HIGH':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <AlertCircle className="w-3 h-3" /> High
                    </span>
                );
            default:
                return null;
        }
    };

    const getIntegrityBadge = (recordId: string) => {
        const v = verifications[recordId];
        if (!v?.checked) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                    <Shield className="w-3 h-3" /> Not verified
                </span>
            );
        }
        if (v.valid) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    <ShieldCheck className="w-3 h-3" /> Verified ✓
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                <ShieldAlert className="w-3 h-3" /> Tampered ⚠
            </span>
        );
    };

    const formatDate = (ts: any) => {
        if (!ts) return 'Pending...';
        try {
            const date = ts.toDate ? ts.toDate() : new Date(ts);
            return date.toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'Asia/Kolkata',
            });
        } catch {
            return 'Unknown';
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 shadow-sm">
                    <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/chat"
                                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Chat
                            </Link>
                            <div className="w-px h-6 bg-slate-200" />
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-indigo-600" />
                                <h1 className="text-lg font-bold text-slate-900">Advice Ledger</h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-500">
                                {records.length} record{records.length !== 1 ? 's' : ''}
                            </span>
                            <Button
                                size="sm"
                                onClick={verifyAll}
                                disabled={isVerifyingAll || records.length === 0}
                                className="gap-2 bg-indigo-600 hover:bg-indigo-500"
                            >
                                {isVerifyingAll ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <ShieldCheck className="w-4 h-4" />
                                )}
                                Verify All
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={loadAuditTrail}
                                disabled={isLoading}
                                className="gap-2"
                            >
                                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-5xl mx-auto px-4 py-6">
                    {/* Info Banner */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-indigo-600 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-indigo-900 text-sm">RegTech-Grade Audit Trail</h3>
                                <p className="text-xs text-indigo-700 mt-1">
                                    Every AI response is cryptographically hashed (SHA-256) and stored as an immutable advice record.
                                    Click "Verify All" to confirm no records have been tampered with.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                            <p className="text-sm text-slate-500">Loading audit records...</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && records.length === 0 && (
                        <div className="text-center py-20">
                            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-slate-600 mb-1">No advice records yet</h3>
                            <p className="text-sm text-slate-400">
                                Ask a legal question in the chat to create your first audit record.
                            </p>
                            <Link href="/chat">
                                <Button className="mt-4 gap-2">
                                    <Scale className="w-4 h-4" />
                                    Go to Chat
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Records List */}
                    {!isLoading && records.length > 0 && (
                        <div className="space-y-3">
                            {records.map((record) => (
                                <div
                                    key={record.id}
                                    className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                                >
                                    {/* Row Summary */}
                                    <button
                                        onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                                        className="w-full px-4 py-3 flex items-center gap-4 text-left hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">
                                                {record.question}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(record.timestamp)}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                                    <Hash className="w-3 h-3" />
                                                    {record.recordHash?.slice(0, 12)}...
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {getRiskBadge(record.response?.risk_level)}
                                            {getIntegrityBadge(record.id)}
                                            {expandedId === record.id ? (
                                                <ChevronUp className="w-4 h-4 text-slate-400" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Expanded Detail */}
                                    {expandedId === record.id && (
                                        <div className="border-t border-slate-200 px-4 py-4 space-y-4 bg-slate-50">
                                            {/* Hash Details */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div className="bg-white rounded-lg p-3 border border-slate-200">
                                                    <p className="text-xs text-slate-500 mb-1">Input Hash (SHA-256)</p>
                                                    <p className="text-xs font-mono text-slate-700 break-all">{record.inputHash}</p>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 border border-slate-200">
                                                    <p className="text-xs text-slate-500 mb-1">Output Hash (SHA-256)</p>
                                                    <p className="text-xs font-mono text-slate-700 break-all">{record.outputHash}</p>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 border border-slate-200">
                                                    <p className="text-xs text-slate-500 mb-1">Record Hash (SHA-256)</p>
                                                    <p className="text-xs font-mono text-slate-700 break-all">{record.recordHash}</p>
                                                </div>
                                            </div>

                                            {/* Response Content */}
                                            <div className="bg-white rounded-lg p-4 border border-slate-200">
                                                <h4 className="text-sm font-semibold text-slate-700 mb-2">AI Response Summary</h4>
                                                <p className="text-sm text-slate-600">{record.response?.summary}</p>
                                            </div>

                                            <div className="bg-white rounded-lg p-4 border border-slate-200">
                                                <h4 className="text-sm font-semibold text-slate-700 mb-2">Applicable Law</h4>
                                                <p className="text-sm text-slate-600">{record.response?.relevant_law}</p>
                                            </div>

                                            {/* Reasoning Steps */}
                                            {record.response?.reasoning_steps && (
                                                <div className="bg-white rounded-lg p-4 border border-slate-200">
                                                    <h4 className="text-sm font-semibold text-slate-700 mb-2">
                                                        Reasoning Chain ({record.response.reasoning_steps.length} steps)
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {record.response.reasoning_steps.map((step, i) => (
                                                            <div key={i} className="flex gap-2">
                                                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-medium">
                                                                    {i + 1}
                                                                </div>
                                                                <p className="text-xs text-slate-600 pt-0.5">{step}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Metadata */}
                                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                                <span>Model: {record.modelVersion}</span>
                                                <span>Language: {record.language}</span>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => verifySingle(record)}
                                                    className="gap-1 text-xs h-7"
                                                >
                                                    <ShieldCheck className="w-3 h-3" />
                                                    Verify this record
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
