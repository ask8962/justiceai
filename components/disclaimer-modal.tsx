'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Scale } from 'lucide-react';

export function DisclaimerModal() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const accepted = localStorage.getItem('justiceai-disclaimer-accepted');
        if (!accepted) {
            setShow(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('justiceai-disclaimer-accepted', 'true');
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md mx-4 p-6 space-y-4 border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Scale className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Welcome to JusticeAI</h2>
                        <p className="text-sm text-slate-500">AI Legal First-Aid for India</p>
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <p className="text-sm font-semibold text-amber-800">Important Disclaimer</p>
                    </div>
                    <ul className="text-sm text-amber-800 space-y-1 list-disc pl-5">
                        <li>JusticeAI provides <strong>informational guidance only</strong>, not legal advice.</li>
                        <li>Responses are AI-generated and may contain inaccuracies.</li>
                        <li>Always consult a <strong>qualified lawyer</strong> for specific legal matters.</li>
                        <li>We do not establish any attorney-client relationship.</li>
                    </ul>
                </div>

                <p className="text-xs text-slate-500">
                    By continuing, you acknowledge that you understand these limitations and agree to use JusticeAI responsibly.
                </p>

                <Button onClick={handleAccept} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    I Understand — Continue
                </Button>
            </div>
        </div>
    );
}
