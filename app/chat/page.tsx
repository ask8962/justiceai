'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { LegalChat } from '@/components/legal-chat';
import { DisclaimerModal } from '@/components/disclaimer-modal';
import { useAuth } from '@/app/auth-context';
import { signOutUser } from '@/lib/auth-service';
import { Button } from '@/components/ui/button';
import { LogOut, Globe, Shield, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

// All supported languages
const LANGUAGES = [
  { code: 'en-US', label: 'English', native: 'English', subtitle: 'Continue in English', emoji: '🇬🇧', color: 'blue' },
  { code: 'hi-IN', label: 'Hindi', native: 'हिंदी', subtitle: 'हिंदी में जारी रखें', emoji: '🇮🇳', color: 'orange' },
  { code: 'bn-IN', label: 'Bengali', native: 'বাংলা', subtitle: 'বাংলায় চালিয়ে যান', emoji: '🇮🇳', color: 'green' },
  { code: 'gu-IN', label: 'Gujarati', native: 'ગુજરાતી', subtitle: 'ગુજરાતીમાં ચાલુ રાખો', emoji: '🇮🇳', color: 'red' },
  { code: 'kn-IN', label: 'Kannada', native: 'ಕನ್ನಡ', subtitle: 'ಕನ್ನಡದಲ್ಲಿ ಮುಂದುವರಿಸಿ', emoji: '🇮🇳', color: 'yellow' },
  { code: 'ml-IN', label: 'Malayalam', native: 'മലയാളം', subtitle: 'മലയാളത്തിൽ തുടരുക', emoji: '🇮🇳', color: 'teal' },
  { code: 'mr-IN', label: 'Marathi', native: 'मराठी', subtitle: 'मराठीत सुरू ठेवा', emoji: '🇮🇳', color: 'purple' },
  { code: 'od-IN', label: 'Odia', native: 'ଓଡ଼ିଆ', subtitle: 'ଓଡ଼ିଆରେ ଜାରି ରଖନ୍ତୁ', emoji: '🇮🇳', color: 'cyan' },
  { code: 'pa-IN', label: 'Punjabi', native: 'ਪੰਜਾਬੀ', subtitle: 'ਪੰਜਾਬੀ ਵਿੱਚ ਜਾਰੀ ਰੱਖੋ', emoji: '🇮🇳', color: 'amber' },
  { code: 'ta-IN', label: 'Tamil', native: 'தமிழ்', subtitle: 'தமிழில் தொடரவும்', emoji: '🇮🇳', color: 'rose' },
  { code: 'te-IN', label: 'Telugu', native: 'తెలుగు', subtitle: 'తెలుగులో కొనసాగించండి', emoji: '🇮🇳', color: 'indigo' },
  { code: 'ur-IN', label: 'Urdu', native: 'اردو', subtitle: 'اردو میں جاری رکھیں', emoji: '🇮🇳', color: 'emerald' },
];

// Color mappings for hover effects
const colorMap: Record<string, string> = {
  blue: 'hover:border-blue-500 hover:shadow-blue-100',
  orange: 'hover:border-orange-500 hover:shadow-orange-100',
  green: 'hover:border-green-500 hover:shadow-green-100',
  red: 'hover:border-red-500 hover:shadow-red-100',
  yellow: 'hover:border-yellow-500 hover:shadow-yellow-100',
  teal: 'hover:border-teal-500 hover:shadow-teal-100',
  purple: 'hover:border-purple-500 hover:shadow-purple-100',
  cyan: 'hover:border-cyan-500 hover:shadow-cyan-100',
  amber: 'hover:border-amber-500 hover:shadow-amber-100',
  rose: 'hover:border-rose-500 hover:shadow-rose-100',
  indigo: 'hover:border-indigo-500 hover:shadow-indigo-100',
  emerald: 'hover:border-emerald-500 hover:shadow-emerald-100',
};

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [showLanguageSelect, setShowLanguageSelect] = useState(true);

  // Check if language was already chosen this session
  useEffect(() => {
    const savedLang = sessionStorage.getItem('justiceai-language');
    if (savedLang) {
      setSelectedLanguage(savedLang);
      setShowLanguageSelect(false);
    }
  }, []);

  const handleLanguageSelect = (lang: string) => {
    setSelectedLanguage(lang);
    setShowLanguageSelect(false);
    sessionStorage.setItem('justiceai-language', lang);
  };

  const handleChangeLanguage = () => {
    setShowLanguageSelect(true);
    sessionStorage.removeItem('justiceai-language');
  };

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('justiceai-language');
      await signOutUser();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive',
      });
    }
  };

  // Get display name for selected language
  const selectedLangInfo = LANGUAGES.find(l => l.code === selectedLanguage);

  return (
    <ProtectedRoute>
      <DisclaimerModal />

      {/* Language Selection Gate (Full Screen Overlay) */}
      {showLanguageSelect && (
        <div className="fixed inset-0 z-[60] bg-slate-50 hero-gradient mesh-bg flex items-center justify-center p-4">
          <div className="glass-card bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-12 max-w-4xl w-full animate-scale-in text-center shadow-2xl border border-white/50">
            {/* Greeting */}
            <div className="mb-8">
              <div className="text-5xl mb-4">🌏</div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
                Choose your language
              </h2>
              <p className="text-lg text-blue-600 font-semibold">
                अपनी भाषा चुनें
              </p>
            </div>

            {/* Language Grid - 12 Languages */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`group relative p-5 rounded-2xl bg-white border border-slate-200 hover:shadow-xl hover:scale-105 transition-all duration-300 ${colorMap[lang.color] || ''}`}
                >
                  <div className="text-3xl mb-2">{lang.emoji}</div>
                  <p className="text-lg font-bold text-slate-900 mb-0.5">{lang.native}</p>
                  <p className="text-xs text-slate-500">{lang.label}</p>
                </button>
              ))}
            </div>

            <p className="text-sm text-slate-500">
              Powered by Sarvam AI • 12 Indian Languages
            </p>
          </div>
        </div>
      )}

      {/* Main Chat UI */}
      <div className="h-screen flex flex-col bg-slate-50">
        {/* Top Navigation */}
        <div className="border-b border-slate-200 bg-white shadow-sm z-10">
          <div className="max-w-full px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="md:hidden text-slate-500">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-xl">⚖️</span>
                  JusticeAI
                </h1>
                <p className="text-[10px] text-slate-500 font-medium">
                  Legal First-Aid / कानूनी सहायता
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              {selectedLanguage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleChangeLanguage}
                  className="gap-2 text-slate-700 border-slate-200 hover:bg-slate-50 hidden sm:flex"
                >
                  <Globe className="w-4 h-4 text-blue-600" />
                  {selectedLangInfo?.native || selectedLanguage}
                </Button>
              )}

              {/* Audit Trail Button */}
              <Link href="/audit">
                <Button variant="ghost" size="sm" className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Audit Trail / रिकॉर्ड</span>
                </Button>
              </Link>

              {/* Sign Out */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2 text-slate-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        {user && selectedLanguage && !showLanguageSelect && (
          <div className="flex-1 overflow-hidden relative">
            <LegalChat userId={user.uid} initialLanguage={selectedLanguage} />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
