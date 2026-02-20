'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';
import { ArrowRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-gradient">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-500 border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

      {/* ===== Sticky Navbar ===== */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-lg'
          : 'bg-transparent'
          }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚖️</span>
            <span className="text-xl font-bold tracking-tight">JusticeAI</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => router.push('/chat')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/25"
              >
                Open Chat →
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/25"
                >
                  Start Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ===== HERO — Super Simple, Bilingual ===== */}
      <section className="relative min-h-screen flex items-center justify-center hero-gradient mesh-bg pt-20">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Big Friendly Emoji */}
          <div className="animate-fade-in-down text-7xl sm:text-8xl mb-6">⚖️</div>

          {/* Headline — Simple English */}
          <h1 className="animate-fade-in-up text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-4">
            Know Your Legal Rights
            <br />
            <span className="gradient-text">in Simple Words</span>
          </h1>

          {/* Hindi Translation */}
          <p className="animate-fade-in-up delay-100 text-xl sm:text-2xl text-blue-300 font-semibold mb-6 opacity-0">
            अपने कानूनी अधिकार जानें — आसान भाषा में
          </p>

          {/* Simple one-line explanation */}
          <p className="animate-fade-in-up delay-200 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed opacity-0">
            Ask any legal question. Get answers in <strong className="text-white">English or Hindi</strong>.
            <br />
            No lawyer needed. No fees. Just type or speak.
          </p>

          {/* Big CTA Buttons */}
          <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 opacity-0">
            <Link
              href="/login"
              className="group px-10 py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl text-xl font-bold transition-all duration-200 hover:shadow-2xl hover:shadow-blue-600/30 flex items-center gap-3"
            >
              Start for Free — मुफ़्त शुरू करें
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Trust indicators — Simple language */}
          <div className="animate-fade-in-up delay-500 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400 opacity-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">🆓</span>
              <span>100% Free / बिल्कुल मुफ़्त</span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-2">
              <span className="text-lg">🇮🇳</span>
              <span>Indian Laws Only</span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-2">
              <span className="text-lg">🔒</span>
              <span>Private & Safe</span>
            </div>
          </div>
        </div>

        <a href="#how-it-works" className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <ChevronDown className="w-6 h-6 text-slate-500" />
        </a>
      </section>

      {/* ===== HOW TO USE — Visual Step-by-Step ===== */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">How to use / कैसे इस्तेमाल करें</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Just 4 Easy Steps</h2>
            <p className="text-xl text-slate-400">सिर्फ ४ आसान कदम</p>
          </div>

          {/* Steps — Large Visual Cards */}
          <div className="space-y-6 max-w-3xl mx-auto">

            {/* Step 1 */}
            <div className="glass-card rounded-2xl p-6 sm:p-8 flex items-start gap-5 hover:bg-white/[0.06] transition-all duration-300">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl">📝</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-bold px-3 py-1 rounded-full bg-blue-600/30 text-blue-300">Step 1</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-1">Sign Up / Account बनाएं</h3>
                <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
                  Click <strong className="text-white">"Start for Free"</strong> button.
                  Use your <strong className="text-white">Email</strong> or <strong className="text-white">Google account</strong> to sign up. It takes only 10 seconds.
                </p>
                <p className="text-blue-300/80 text-sm mt-2">
                  👆 &quot;मुफ़्त शुरू करें&quot; बटन दबाएं। ईमेल या Google से साइन अप करें। सिर्फ 10 सेकंड लगेंगे।
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="glass-card rounded-2xl p-6 sm:p-8 flex items-start gap-5 hover:bg-white/[0.06] transition-all duration-300">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl">🌐</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-bold px-3 py-1 rounded-full bg-violet-600/30 text-violet-300">Step 2</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-1">Choose Language / भाषा चुनें</h3>
                <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
                  Pick <strong className="text-white">English</strong> 🇬🇧 or <strong className="text-white">Hindi</strong> 🇮🇳.
                  All answers will come in your chosen language.
                </p>
                <p className="text-violet-300/80 text-sm mt-2">
                  👆 English 🇬🇧 या हिंदी 🇮🇳 में से कोई भी भाषा चुनें। सब जवाब उसी भाषा में आएंगे।
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="glass-card rounded-2xl p-6 sm:p-8 flex items-start gap-5 hover:bg-white/[0.06] transition-all duration-300">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-green-600/20 border border-green-500/20 flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl">💬</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-bold px-3 py-1 rounded-full bg-green-600/30 text-green-300">Step 3</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-1">Ask Your Question / सवाल पूछें</h3>
                <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
                  <strong className="text-white">Type</strong> your problem or tap the 🎤 <strong className="text-white">mic button to speak</strong>.
                  Talk like you would talk to a friend — no difficult words needed.
                </p>
                <p className="text-green-300/80 text-sm mt-2">
                  👆 अपनी समस्या लिखें या 🎤 माइक बटन दबाकर बोलें। आसान भाषा में बात करें — कठिन शब्दों की जरूरत नहीं।
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="glass-card rounded-2xl p-6 sm:p-8 flex items-start gap-5 hover:bg-white/[0.06] transition-all duration-300">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-600/20 border border-amber-500/20 flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl">✅</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-bold px-3 py-1 rounded-full bg-amber-600/30 text-amber-300">Step 4</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-1">Get Your Answer / जवाब पाएं</h3>
                <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
                  AI will tell you: <strong className="text-white">Which law applies</strong>, <strong className="text-white">what you can do</strong>,
                  and <strong className="text-white">how serious it is</strong> (🟢 Low / 🟡 Medium / 🔴 High risk).
                </p>
                <p className="text-amber-300/80 text-sm mt-2">
                  👆 AI बताएगा: कौन सा कानून लागू होता है, आप क्या कर सकते हैं, और स्थिति कितनी गंभीर है (🟢 कम / 🟡 मध्यम / 🔴 ज़्यादा)।
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHAT'S INCLUDED — Simple Feature Cards ===== */}
      <section id="features" className="py-20 sm:py-28 bg-slate-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">What you get / आपको क्या मिलेगा</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Everything Inside JusticeAI</h2>
            <p className="text-xl text-slate-400">JusticeAI में सब कुछ शामिल है</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* Feature Cards */}
            <div className="glass-card rounded-2xl p-6 hover:bg-white/[0.08] transition-all duration-300 group">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-bold mb-2">Ask Legal Questions</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-2">
                Type any problem — property dispute, police complaint, job issue, family matter — and get a clear answer.
              </p>
              <p className="text-xs text-blue-300/70">कोई भी कानूनी सवाल पूछें — प्रॉपर्टी, पुलिस, नौकरी, परिवार — साफ़ जवाब मिलेगा।</p>
            </div>

            <div className="glass-card rounded-2xl p-6 hover:bg-white/[0.08] transition-all duration-300 group">
              <div className="text-4xl mb-4">🎤</div>
              <h3 className="text-lg font-bold mb-2">Voice Input — बोलकर पूछें</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-2">
                Can't type? No problem! Press the mic button and speak in Hindi or English. AI will understand you.
              </p>
              <p className="text-xs text-blue-300/70">टाइप नहीं कर सकते? माइक दबाएं, हिंदी या English में बोलें। AI समझ जाएगा।</p>
            </div>

            <div className="glass-card rounded-2xl p-6 hover:bg-white/[0.08] transition-all duration-300 group">
              <div className="text-4xl mb-4">🔊</div>
              <h3 className="text-lg font-bold mb-2">Listen to Answers — सुनें</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-2">
                Can't read well? Press "Listen" button and hear the answer spoken out loud in Hindi or English.
              </p>
              <p className="text-xs text-blue-300/70">पढ़ नहीं सकते? "Listen" बटन दबाएं — जवाब सुनाई देगा।</p>
            </div>

            <div className="glass-card rounded-2xl p-6 hover:bg-white/[0.08] transition-all duration-300 group">
              <div className="text-4xl mb-4">🚦</div>
              <h3 className="text-lg font-bold mb-2">Risk Level — कितना गंभीर है</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-2">
                Every answer shows: 🟢 Low Risk (don't worry), 🟡 Medium (be careful), 🔴 High (act now!).
              </p>
              <p className="text-xs text-blue-300/70">हर जवाब बताएगा: 🟢 कम खतरा, 🟡 सावधान रहें, 🔴 तुरंत कार्रवाई करें!</p>
            </div>

            <div className="glass-card rounded-2xl p-6 hover:bg-white/[0.08] transition-all duration-300 group">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-lg font-bold mb-2">Download Report — रिपोर्ट</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-2">
                Download a professional PDF report of any AI answer. Show it to a lawyer or keep for your records.
              </p>
              <p className="text-xs text-blue-300/70">किसी भी जवाब की PDF रिपोर्ट डाउनलोड करें। वकील को दिखाएं या रिकॉर्ड रखें।</p>
            </div>

            <div className="glass-card rounded-2xl p-6 hover:bg-white/[0.08] transition-all duration-300 group">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-bold mb-2">Draft Legal Notice — नोटिस</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-2">
                Need to send a legal notice? AI creates a draft for you. Edit it, then download as PDF.
              </p>
              <p className="text-xs text-blue-300/70">कानूनी नोटिस भेजना है? AI ड्राफ्ट बना देगा। एडिट करें, PDF डाउनलोड करें।</p>
            </div>

            <div className="glass-card rounded-2xl p-6 hover:bg-white/[0.08] transition-all duration-300 group">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-lg font-bold mb-2">Safety Alerts — सुरक्षा</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-2">
                If you're in danger (domestic violence, abuse, threats), AI shows emergency helpline numbers immediately.
              </p>
              <p className="text-xs text-blue-300/70">खतरे में हैं? AI तुरंत हेल्पलाइन नंबर दिखाएगा — 181, 1098, 112</p>
            </div>

            <div className="glass-card rounded-2xl p-6 hover:bg-white/[0.08] transition-all duration-300 group">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-lg font-bold mb-2">Audit Trail — रिकॉर्ड</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-2">
                All your questions and answers are saved securely. Check them anytime in the "Audit Trail" section.
              </p>
              <p className="text-xs text-blue-300/70">सब सवाल-जवाब सुरक्षित सेव होते हैं। &quot;Audit Trail&quot; में कभी भी देखें।</p>
            </div>

            <div className="glass-card rounded-2xl p-6 hover:bg-white/[0.08] transition-all duration-300 group">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-lg font-bold mb-2">20+ Indian Laws — भारतीय कानून</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-2">
                IPC, CrPC, CPC, Constitution, IT Act, Consumer Protection, POCSO, DV Act, RTI, and many more.
              </p>
              <p className="text-xs text-blue-300/70">IPC, CrPC, संविधान, IT एक्ट, उपभोक्ता संरक्षण, POCSO, DV एक्ट, RTI और बहुत कुछ।</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== EXAMPLE QUESTIONS — Real-world scenarios ===== */}
      <section className="py-20 sm:py-28 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">Example Questions / उदाहरण सवाल</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">What Can You Ask?</h2>
            <p className="text-xl text-slate-400">आप क्या पूछ सकते हैं?</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { emoji: '🏠', q: "\"My landlord won't return my deposit\"", hi: '"मकान मालिक डिपॉजिट नहीं लौटा रहा"' },
              { emoji: '👮', q: '"Police is not filing my FIR"', hi: '"पुलिस मेरी FIR नहीं लिख रही"' },
              { emoji: '💼', q: '"My company fired me without notice"', hi: '"कंपनी ने बिना नोटिस नौकरी से निकाला"' },
              { emoji: '👨‍👩‍👧', q: '"My husband is demanding dowry"', hi: '"पति दहेज मांग रहा है"' },
              { emoji: '🛒', q: '"I got a defective product online"', hi: '"ऑनलाइन खराब सामान आया"' },
              { emoji: '📱', q: '"Someone is threatening me on WhatsApp"', hi: '"कोई WhatsApp पर धमकी दे रहा है"' },
            ].map((item, i) => (
              <div
                key={i}
                className="glass-card rounded-xl p-5 hover:bg-white/[0.06] transition-all duration-300 cursor-default"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <p className="text-white font-medium text-base">{item.q}</p>
                    <p className="text-blue-300/70 text-sm mt-1">{item.hi}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-slate-500 text-sm mt-8">
            ...and many more! Ask anything about Indian law. / ...और बहुत कुछ! भारतीय कानून के बारे में कुछ भी पूछें।
          </p>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div className="text-6xl mb-6">🙏</div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Your Rights Matter. Know Them Today.
          </h2>
          <p className="text-xl text-blue-300 font-semibold mb-2">
            आपके अधिकार मायने रखते हैं। आज ही जानें।
          </p>
          <p className="text-slate-400 mb-8 text-lg">
            Free. Private. In your language.
            <br />
            <span className="text-slate-500">मुफ़्त। निजी। आपकी भाषा में।</span>
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl text-xl font-bold transition-all duration-200 hover:shadow-2xl hover:shadow-blue-600/30"
          >
            Start Now — अभी शुरू करें
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚖️</span>
              <span className="font-semibold">JusticeAI</span>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 max-w-lg">
                <strong>⚠️ Important / ज़रूरी:</strong> JusticeAI gives general information only. It is NOT a lawyer.
                Always talk to a real lawyer before taking any legal action.
              </p>
              <p className="text-xs text-slate-600 mt-1">
                JusticeAI सिर्फ जानकारी देता है, यह वकील नहीं है। कोई भी कदम उठाने से पहले असली वकील से बात करें।
              </p>
            </div>
          </div>

          {/* Developer Link + Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-white/5">
            <p className="text-xs text-slate-600">
              © 2026 JusticeAI. All rights reserved.
            </p>
            <Link
              href="/dashboard"
              className="text-xs text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-1.5 mt-2 sm:mt-0"
            >
              <span className="text-sm">⚡</span>
              For Developers — API & Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
