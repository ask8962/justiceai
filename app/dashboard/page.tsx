'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth-context';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────

interface ApiKey {
    id: string;
    name: string;
    keyPrefix: string;
    scopes: string[];
    status: 'active' | 'revoked';
    tier: string;
    quotaLimit: number;
    quotaUsed: number;
    lastUsedAt: any;
    createdAt: any;
}

interface UsageStats {
    totalRequests: number;
    totalKeys: number;
    activeKeys: number;
    requestsByDay: Record<string, number>;
    requestsByEndpoint: Record<string, number>;
}

// ─── Sidebar Navigation Items ────────────────────────────────

const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'api-keys', label: 'API keys', icon: '🔑' },
    { id: 'usage', label: 'Usage', icon: '📈' },
    { id: 'docs', label: 'Documentation', icon: '📖' },
    { id: 'playground', label: 'Playground', icon: '⚡' },
];

// ─── Main Dashboard ───────────────────────────────────────────

export default function DeveloperDashboardPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [usage, setUsage] = useState<UsageStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Create key state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyTier, setNewKeyTier] = useState('free');
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auth check
    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    // Fetch data
    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const headers: Record<string, string> = {
                'x-user-id': user.uid,
                'x-user-email': user.email || '',
            };
            const [keysRes, usageRes] = await Promise.all([
                fetch('/api/dashboard/keys', { headers }),
                fetch('/api/dashboard/usage', { headers }),
            ]);
            if (keysRes.ok) {
                const d = await keysRes.json();
                setKeys(d.data || []);
            }
            if (usageRes.ok) {
                const d = await usageRes.json();
                setUsage(d.data || null);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) fetchData();
    }, [user, fetchData]);

    // Create key
    const handleCreateKey = async () => {
        if (!user || !newKeyName.trim()) return;
        setCreating(true);
        try {
            const res = await fetch('/api/dashboard/keys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.uid,
                    'x-user-email': user.email || '',
                },
                body: JSON.stringify({ name: newKeyName.trim(), tier: newKeyTier }),
            });
            const data = await res.json();
            if (res.ok) {
                setCreatedKey(data.data.key);
                fetchData();
            } else {
                setError(data.error || 'Failed to create key');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    // Revoke key
    const handleRevokeKey = async (keyId: string) => {
        if (!user) return;
        if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;
        try {
            const res = await fetch(`/api/dashboard/keys/${keyId}`, {
                method: 'DELETE',
                headers: { 'x-user-id': user.uid },
            });
            if (res.ok) fetchData();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (authLoading || !user) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
                <div className="w-8 h-8 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    const activeKeys = keys.filter((k) => k.status === 'active');
    const revokedKeys = keys.filter((k) => k.status === 'revoked');
    const quotaPercent = activeKeys.length > 0
        ? Math.round((activeKeys.reduce((s, k) => s + (k.quotaUsed || 0), 0) / activeKeys.reduce((s, k) => s + (k.quotaLimit || 100), 0)) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-neutral-100" style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}>

            {/* ═══ Top Bar ═══ */}
            <header className="h-14 border-b border-neutral-800 bg-[#0a0a0a] sticky top-0 z-50 flex items-center px-5">
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
                        <span className="text-lg">⚖️</span>
                        <span className="font-semibold text-sm text-neutral-100">JusticeAI</span>
                    </Link>
                    <span className="text-neutral-600">/</span>
                    <span className="text-sm text-neutral-400">Platform</span>
                </div>
                <div className="ml-auto flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Operational
                    </span>
                    <div className="h-4 w-px bg-neutral-800" />
                    <span className="text-xs text-neutral-500">{user.email}</span>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                        {user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* ═══ Sidebar ═══ */}
                <aside className="w-56 min-h-[calc(100vh-3.5rem)] border-r border-neutral-800 bg-[#0a0a0a] p-3 flex flex-col">
                    <nav className="space-y-0.5 flex-1">
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${activeTab === item.id
                                        ? 'bg-neutral-800 text-white'
                                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                                    }`}
                            >
                                <span className="text-base">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </nav>
                    <div className="mt-auto pt-4 border-t border-neutral-800">
                        <Link
                            href="/chat"
                            className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-md transition"
                        >
                            <span>←</span> Back to Chat
                        </Link>
                    </div>
                </aside>

                {/* ═══ Content Area ═══ */}
                <main className="flex-1 min-h-[calc(100vh-3.5rem)] overflow-y-auto">
                    <div className="max-w-4xl mx-auto px-8 py-8">

                        {/* Error */}
                        {error && (
                            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex items-center justify-between">
                                <span className="text-sm text-red-400">{error}</span>
                                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 text-sm">✕</button>
                            </div>
                        )}

                        {/* ─── OVERVIEW TAB ─── */}
                        {activeTab === 'overview' && (
                            <div>
                                <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
                                <p className="text-sm text-neutral-500 mb-8">
                                    Manage your API keys and monitor usage for <code className="text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded text-xs">anukalp-apex-v1</code>
                                </p>

                                {/* Stat Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">API Requests</p>
                                        <p className="text-3xl font-semibold text-white">{(usage?.totalRequests || 0).toLocaleString()}</p>
                                        <p className="text-xs text-neutral-500 mt-1">Last 30 days</p>
                                    </div>
                                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Active Keys</p>
                                        <p className="text-3xl font-semibold text-white">{activeKeys.length}</p>
                                        <p className="text-xs text-neutral-500 mt-1">{revokedKeys.length} revoked</p>
                                    </div>
                                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Quota Used</p>
                                        <p className="text-3xl font-semibold text-white">{quotaPercent}%</p>
                                        <div className="mt-2 w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${quotaPercent > 80 ? 'bg-red-500' : quotaPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${quotaPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <h2 className="text-sm font-medium text-neutral-300 mb-3">Quick actions</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                                    <button
                                        onClick={() => { setActiveTab('api-keys'); setShowCreateModal(true); }}
                                        className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-left hover:border-neutral-700 transition group"
                                    >
                                        <span className="text-xl mb-2 block">🔑</span>
                                        <span className="text-sm font-medium text-white block">Create API key</span>
                                        <span className="text-xs text-neutral-500 group-hover:text-neutral-400">Generate a new key for your app</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('docs')}
                                        className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-left hover:border-neutral-700 transition group"
                                    >
                                        <span className="text-xl mb-2 block">📖</span>
                                        <span className="text-sm font-medium text-white block">View documentation</span>
                                        <span className="text-xs text-neutral-500 group-hover:text-neutral-400">API reference and examples</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('playground')}
                                        className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-left hover:border-neutral-700 transition group"
                                    >
                                        <span className="text-xl mb-2 block">⚡</span>
                                        <span className="text-sm font-medium text-white block">Open playground</span>
                                        <span className="text-xs text-neutral-500 group-hover:text-neutral-400">Test API calls interactively</span>
                                    </button>
                                </div>

                                {/* Recent Activity - Endpoints */}
                                {usage?.requestsByEndpoint && Object.keys(usage.requestsByEndpoint).length > 0 && (
                                    <div>
                                        <h2 className="text-sm font-medium text-neutral-300 mb-3">Requests by endpoint</h2>
                                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-neutral-800">
                                                        <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium uppercase">Endpoint</th>
                                                        <th className="text-right px-4 py-3 text-xs text-neutral-500 font-medium uppercase">Requests</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Object.entries(usage.requestsByEndpoint).sort((a, b) => b[1] - a[1]).map(([ep, count]) => (
                                                        <tr key={ep} className="border-b border-neutral-800/50 last:border-0">
                                                            <td className="px-4 py-3 font-mono text-xs text-neutral-300">{ep}</td>
                                                            <td className="px-4 py-3 text-right text-neutral-400">{count.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── API KEYS TAB ─── */}
                        {activeTab === 'api-keys' && (
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <h1 className="text-2xl font-semibold">API keys</h1>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition flex items-center gap-2"
                                    >
                                        <span>+</span> Create new secret key
                                    </button>
                                </div>
                                <p className="text-sm text-neutral-500 mb-6">
                                    Your secret API keys are listed below. Do not share your API key with others, or expose it in the browser or other client-side code.
                                </p>

                                {/* Keys Table */}
                                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-neutral-800">
                                                <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium uppercase">Name</th>
                                                <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium uppercase">Key</th>
                                                <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium uppercase">Tier</th>
                                                <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium uppercase">Usage</th>
                                                <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium uppercase">Created</th>
                                                <th className="text-right px-4 py-3 text-xs text-neutral-500 font-medium uppercase"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr><td colSpan={6} className="text-center py-12 text-neutral-500">Loading...</td></tr>
                                            ) : activeKeys.length === 0 && revokedKeys.length === 0 ? (
                                                <tr><td colSpan={6} className="text-center py-12 text-neutral-500">No API keys yet. Create one to get started.</td></tr>
                                            ) : (
                                                <>
                                                    {activeKeys.map((key) => (
                                                        <tr key={key.id} className="border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/30">
                                                            <td className="px-4 py-3">
                                                                <span className="font-medium text-white">{key.name}</span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <code className="text-xs text-neutral-400 font-mono bg-neutral-800 px-2 py-1 rounded">{key.keyPrefix}</code>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${key.tier === 'enterprise' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                                        : key.tier === 'pro' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                                            : key.tier === 'starter' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                                                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                                                                    }`}>{key.tier}</span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-20 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-emerald-500 rounded-full"
                                                                            style={{ width: `${Math.min(((key.quotaUsed || 0) / (key.quotaLimit || 100)) * 100, 100)}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs text-neutral-500">{key.quotaUsed || 0}/{key.quotaLimit || 100}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-xs text-neutral-500">
                                                                {key.createdAt?._seconds ? new Date(key.createdAt._seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <button
                                                                    onClick={() => handleRevokeKey(key.id)}
                                                                    className="text-xs text-red-400/70 hover:text-red-400 transition px-2 py-1 rounded hover:bg-red-500/10"
                                                                >
                                                                    Revoke
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {revokedKeys.map((key) => (
                                                        <tr key={key.id} className="border-b border-neutral-800/50 last:border-0 opacity-50">
                                                            <td className="px-4 py-3">
                                                                <span className="text-neutral-500">{key.name}</span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <code className="text-xs text-neutral-600 font-mono">{key.keyPrefix}</code>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400/70 border border-red-500/20">revoked</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-xs text-neutral-600">—</td>
                                                            <td className="px-4 py-3 text-xs text-neutral-600">
                                                                {key.createdAt?._seconds ? new Date(key.createdAt._seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                            </td>
                                                            <td></td>
                                                        </tr>
                                                    ))}
                                                </>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Scopes Info */}
                                <div className="mt-6 bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                                    <h3 className="text-sm font-medium text-neutral-300 mb-3">Default permissions</h3>
                                    <p className="text-xs text-neutral-500 mb-3">All keys are created with the following scopes enabled:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['legal-query', 'document-analysis', 'tts', 'stt', 'translate', 'generate-brief'].map(scope => (
                                            <span key={scope} className="text-xs font-mono bg-neutral-800 text-neutral-300 px-2.5 py-1 rounded-md border border-neutral-700">
                                                {scope}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── USAGE TAB ─── */}
                        {activeTab === 'usage' && (
                            <div>
                                <h1 className="text-2xl font-semibold mb-1">Usage</h1>
                                <p className="text-sm text-neutral-500 mb-8">Monitor your API activity and quota consumption.</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Total Requests</p>
                                        <p className="text-3xl font-semibold text-white">{(usage?.totalRequests || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Active Keys</p>
                                        <p className="text-3xl font-semibold text-white">{usage?.activeKeys || activeKeys.length}</p>
                                    </div>
                                </div>

                                {/* Per-key usage */}
                                <h2 className="text-sm font-medium text-neutral-300 mb-3">Usage by key</h2>
                                <div className="space-y-3">
                                    {activeKeys.map(key => (
                                        <div key={key.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <span className="font-medium text-white text-sm">{key.name}</span>
                                                    <code className="ml-2 text-xs text-neutral-500 font-mono">{key.keyPrefix}</code>
                                                </div>
                                                <span className="text-xs text-neutral-500">{key.quotaUsed || 0} / {key.quotaLimit || 100} requests</span>
                                            </div>
                                            <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${((key.quotaUsed || 0) / (key.quotaLimit || 100)) > 0.9 ? 'bg-red-500'
                                                            : ((key.quotaUsed || 0) / (key.quotaLimit || 100)) > 0.7 ? 'bg-amber-500'
                                                                : 'bg-emerald-500'
                                                        }`}
                                                    style={{ width: `${Math.min(((key.quotaUsed || 0) / (key.quotaLimit || 100)) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {activeKeys.length === 0 && (
                                        <p className="text-sm text-neutral-500 text-center py-6">No active keys to show usage for.</p>
                                    )}
                                </div>

                                {/* By Endpoint */}
                                {usage?.requestsByEndpoint && Object.keys(usage.requestsByEndpoint).length > 0 && (
                                    <div className="mt-8">
                                        <h2 className="text-sm font-medium text-neutral-300 mb-3">By endpoint</h2>
                                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-neutral-800">
                                                        <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Endpoint</th>
                                                        <th className="text-right px-4 py-3 text-xs text-neutral-500 font-medium">Count</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Object.entries(usage.requestsByEndpoint).sort((a, b) => b[1] - a[1]).map(([ep, cnt]) => (
                                                        <tr key={ep} className="border-b border-neutral-800/50 last:border-0">
                                                            <td className="px-4 py-2.5 font-mono text-xs text-neutral-300">{ep}</td>
                                                            <td className="px-4 py-2.5 text-right text-neutral-400">{cnt}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── DOCS TAB ─── */}
                        {activeTab === 'docs' && (
                            <div>
                                <h1 className="text-2xl font-semibold mb-1">Documentation</h1>
                                <p className="text-sm text-neutral-500 mb-8">API reference for the JusticeAI anukalp-apex-v1 model.</p>

                                {/* Auth */}
                                <div className="mb-8">
                                    <h2 className="text-lg font-medium text-white mb-3">Authentication</h2>
                                    <p className="text-sm text-neutral-400 mb-3">
                                        Pass your API key in the <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-xs text-neutral-300">Authorization</code> header as a Bearer token:
                                    </p>
                                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 font-mono text-sm text-neutral-300">
                                        Authorization: Bearer sk-justai-xxxxxxxxxxxxx
                                    </div>
                                </div>

                                {/* Endpoints */}
                                <h2 className="text-lg font-medium text-white mb-4">Endpoints</h2>
                                <div className="space-y-3">
                                    {[
                                        { method: 'POST', path: '/api/v1/legal-query', desc: 'Ask a legal question and get a structured response with risk assessment, applicable laws, and reasoning.', body: '{ "question": "string", "language": "en-US" }' },
                                        { method: 'POST', path: '/api/v1/tts', desc: 'Convert text to speech via Sarvam AI. Returns base64-encoded audio.', body: '{ "text": "string", "target_language": "hi-IN" }' },
                                        { method: 'POST', path: '/api/v1/stt', desc: 'Convert speech to text. Send base64-encoded audio.', body: '{ "audio": "base64", "language": "hi-IN" }' },
                                        { method: 'POST', path: '/api/v1/translate', desc: 'Translate text between 12 Indian languages.', body: '{ "text": "string", "source_language": "en-IN", "target_language": "hi-IN" }' },
                                        { method: 'POST', path: '/api/v1/generate-brief', desc: 'Generate a professional case brief from chat history.', body: '{ "chatHistory": [{ "role": "user", "content": "..." }] }' },
                                        { method: 'GET', path: '/api/v1/usage', desc: 'Get usage statistics for the authenticated API key.', body: '' },
                                    ].map((ep) => (
                                        <div key={ep.path} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${ep.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                                                    }`}>{ep.method}</span>
                                                <code className="text-sm font-mono text-white">{ep.path}</code>
                                            </div>
                                            <p className="text-xs text-neutral-400 mb-2">{ep.desc}</p>
                                            {ep.body && (
                                                <div className="bg-neutral-800/60 rounded-lg p-3 font-mono text-xs text-neutral-400 mt-2">
                                                    {ep.body}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Quick Start */}
                                <div className="mt-8">
                                    <h2 className="text-lg font-medium text-white mb-3">Quick start</h2>
                                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 overflow-x-auto">
                                        <pre className="text-xs font-mono text-neutral-300 leading-relaxed whitespace-pre">{`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'}/api/v1/legal-query \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"question": "What are my rights as a tenant?", "language": "en-US"}'`}</pre>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── PLAYGROUND TAB ─── */}
                        {activeTab === 'playground' && (
                            <div>
                                <h1 className="text-2xl font-semibold mb-1">Playground</h1>
                                <p className="text-sm text-neutral-500 mb-6">Test the API directly from your browser.</p>
                                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
                                    <span className="text-4xl mb-4 block">⚡</span>
                                    <p className="text-neutral-300 font-medium mb-2">Use the standalone test console</p>
                                    <p className="text-sm text-neutral-500 mb-4">Open <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-xs text-neutral-300">testingofjusticeai/index.html</code> in your browser to interactively test all API endpoints.</p>
                                    <a
                                        href="/dashboard"
                                        className="inline-block text-sm text-indigo-400 hover:text-indigo-300 transition"
                                    >
                                        Or switch to API keys tab to get your key →
                                    </a>
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>

            {/* ═══ Create Key Modal ═══ */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { if (!createdKey) { setShowCreateModal(false); } }}>
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        {!createdKey ? (
                            <>
                                <div className="px-6 pt-6 pb-4 border-b border-neutral-800">
                                    <h2 className="text-lg font-semibold text-white">Create new secret key</h2>
                                    <p className="text-sm text-neutral-500 mt-1">Generate a new API key for programmatic access.</p>
                                </div>
                                <div className="px-6 py-5 space-y-4">
                                    <div>
                                        <label className="text-sm text-neutral-400 mb-1.5 block">Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Production, Dev, Mobile..."
                                            value={newKeyName}
                                            onChange={(e) => setNewKeyName(e.target.value)}
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-neutral-600 transition"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-neutral-400 mb-1.5 block">Tier</label>
                                        <select
                                            value={newKeyTier}
                                            onChange={(e) => setNewKeyTier(e.target.value)}
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-neutral-600 transition appearance-none"
                                        >
                                            <option value="free">Free — 100 requests/month</option>
                                            <option value="starter">Starter — 1,000 requests/month</option>
                                            <option value="pro">Pro — 10,000 requests/month</option>
                                            <option value="enterprise">Enterprise — Unlimited</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="px-6 pb-6 flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateKey}
                                        disabled={!newKeyName.trim() || creating}
                                        className="px-5 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {creating ? 'Creating...' : 'Create secret key'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="px-6 pt-6 pb-4 border-b border-neutral-800">
                                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <span className="text-emerald-400">✓</span> Key created
                                    </h2>
                                    <p className="text-sm text-amber-400 mt-1">
                                        Please save this secret key somewhere safe. You won't be able to view it again.
                                    </p>
                                </div>
                                <div className="px-6 py-5">
                                    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-3 flex items-center gap-2">
                                        <code className="flex-1 text-sm text-emerald-400 font-mono break-all select-all">{createdKey}</code>
                                        <button
                                            onClick={() => copyToClipboard(createdKey)}
                                            className="shrink-0 p-2 hover:bg-neutral-700 rounded-md transition text-neutral-400 hover:text-white"
                                        >
                                            {copied ? '✓' : '📋'}
                                        </button>
                                    </div>
                                </div>
                                <div className="px-6 pb-6 flex justify-end">
                                    <button
                                        onClick={() => { setShowCreateModal(false); setCreatedKey(null); setNewKeyName(''); }}
                                        className="px-5 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition"
                                    >
                                        Done
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
