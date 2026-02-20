'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from './chat-message';
import { VoiceInput } from './voice-input';
import { ReasoningPanel } from './reasoning-panel';
import { RiskMeter } from './risk-meter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Trash2, History, BarChart3 } from 'lucide-react';
import { LegalResponse } from '@/lib/gemini';
import { queryLegalAssistant } from '@/lib/gemini';
import { saveLegalQuery, getUserQueries, deleteQuery, saveFeedback, getAppStats, AppStats } from '@/lib/firebase-service';
import { Timestamp } from 'firebase/firestore';
import { detectSafetyRisk, SafetyResult } from '@/lib/safety-detector';
import { SafetyEscalationModal } from './safety-escalation-modal';
import { CaseBriefModal, CaseBrief } from './case-brief-modal';
import { FileText } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string | LegalResponse;
  timestamp: Timestamp;
}

interface LegalChatProps {
  userId: string;
  initialLanguage?: string;
}

export function LegalChat({ userId, initialLanguage = 'en-US' }: LegalChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<string>(initialLanguage || 'en-US');
  const [showHistory, setShowHistory] = useState(false);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [safetyResult, setSafetyResult] = useState<SafetyResult | null>(null);

  const [showSafetyModal, setShowSafetyModal] = useState(false);

  // Case Brief State
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [caseBrief, setCaseBrief] = useState<CaseBrief | null>(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleGenerateBrief = async () => {
    try {
      setIsGeneratingBrief(true);

      const chatHistory = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: typeof msg.content === 'string'
          ? msg.content
          : JSON.stringify(msg.content)
      }));

      const res = await fetch('/api/generate-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatHistory }),
      });

      if (!res.ok) throw new Error('Failed to generate brief');

      const data = await res.json();
      setCaseBrief(data);
    } catch (error) {
      console.error('Error generating brief:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate case brief',
        variant: 'destructive',
      });
      setShowBriefModal(false);
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  // Load chat history and stats on mount
  useEffect(() => {
    loadChatHistory();
    loadStats();
  }, [userId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const queries = await getUserQueries(userId);
      const historyMessages: Message[] = [];

      queries.forEach((query) => {
        historyMessages.push({
          id: `user-${query.id}`,
          type: 'user',
          content: query.question,
          timestamp: query.timestamp,
        });

        historyMessages.push({
          id: `ai-${query.id}`,
          type: 'assistant',
          content: query.ai_response,
          timestamp: query.timestamp,
        });
      });

      setMessages(historyMessages);
    } catch (error) {
      console.error('Error loading chat history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat history',
        variant: 'destructive',
      });
    }
  };

  const loadStats = async () => {
    try {
      const appStats = await getAppStats();
      setStats(appStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSubmit = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    try {
      setIsLoading(true);
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: text,
        timestamp: Timestamp.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');

      // Query the legal assistant
      const response = await queryLegalAssistant(text, language);

      // Save to Firestore first to get the queryId
      const queryId = await saveLegalQuery(userId, text, response, language);

      const aiMessage: Message = {
        id: `ai-${queryId}`,
        type: 'assistant',
        content: response,
        timestamp: Timestamp.now(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Safety check — detect high-risk situations
      const safety = detectSafetyRisk(text, response.risk_level);
      if (safety.isCritical) {
        setSafetyResult(safety);
        setShowSafetyModal(true);
      }

      // Refresh stats
      loadStats();
    } catch (error) {
      console.error('Error querying legal assistant:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your query. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, helpful: boolean) => {
    try {
      const queryId = messageId.replace('ai-', '');
      await saveFeedback(queryId, helpful, userId, language);
      toast({
        title: helpful ? '👍 Thanks!' : '👎 Noted',
        description: helpful ? 'Glad this was helpful!' : 'We\'ll work to improve.',
      });
      // Refresh stats
      loadStats();
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all messages?')) return;

    try {
      for (const msg of messages) {
        if (msg.type === 'assistant') {
          const queryId = msg.id.replace('ai-', '');
          await deleteQuery(queryId);
        }
      }
      setMessages([]);
      toast({
        title: 'Success',
        description: 'Chat history cleared',
      });
    } catch (error) {
      console.error('Error clearing history:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear chat history',
        variant: 'destructive',
      });
    }
  };

  const getLastResponse = (): LegalResponse | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === 'assistant' && typeof messages[i].content !== 'string') {
        return messages[i].content as LegalResponse;
      }
    }
    return null;
  };

  const lastResponse = getLastResponse();
  const helpfulPercent =
    stats && stats.helpfulCount + stats.unhelpfulCount > 0
      ? Math.round((stats.helpfulCount / (stats.helpfulCount + stats.unhelpfulCount)) * 100)
      : null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">JusticeAI Legal First-Aid</h1>
          {/* Stats Bar */}
          {stats && stats.totalQueries > 0 && (
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                {stats.totalQueries} queries served
              </span>
              {helpfulPercent !== null && (
                <span className="flex items-center gap-1">
                  👍 {helpfulPercent}% helpful
                </span>
              )}
              <span>
                🌐 {stats.languages.length > 0 ? stats.languages.join(', ') : 'Multi-language'}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="gap-2"
          >
            <History className="w-4 h-4" />
            {messages.length}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBriefModal(true)}
            className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 hidden sm:flex"
            disabled={messages.length === 0}
          >
            <FileText className="w-4 h-4" />
            Generate Brief
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearHistory}
            disabled={messages.length === 0}
            className="gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex gap-4 p-4">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-2">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-4 text-center animate-fade-in-up">
                <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                  <span className="text-5xl">⚖️</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3">
                  Welcome to JusticeAI
                </h2>
                <h3 className="text-xl text-blue-600 font-semibold mb-6">
                  आपका स्वागत है
                </h3>
                <p className="text-slate-500 max-w-md text-lg leading-relaxed mb-8">
                  I can help you understand Indian Law.
                  <br />
                  <span className="text-slate-400 text-base">
                    मैं भारतीय कानून को समझने में आपकी मदद कर सकता हूँ।
                  </span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full text-left">
                  <button
                    onClick={() => handleSubmit(language === 'hi-IN' ? "ऑनलाइन खराब सामान मिला, रिफंड नहीं मिल रहा" : "Received defective product online, no refund")}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-md transition-all group"
                  >
                    <span className="text-2xl mb-2 block">📦</span>
                    <span className="font-semibold text-slate-900 block group-hover:text-blue-700">Defective Product</span>
                    <span className="text-slate-500 text-sm">खराब सामान / रिफंड</span>
                  </button>
                  <button
                    onClick={() => handleSubmit(language === 'hi-IN' ? "मकान मालिक डिपॉजिट वापस नहीं कर रहा" : "Landlord not returning security deposit")}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-md transition-all group"
                  >
                    <span className="text-2xl mb-2 block">🏠</span>
                    <span className="font-semibold text-slate-900 block group-hover:text-blue-700">Landlord Deposit</span>
                    <span className="text-slate-500 text-sm">किराया / डिपॉजिट विवाद</span>
                  </button>
                  <button
                    onClick={() => handleSubmit(language === 'hi-IN' ? "दुकानदार ने MRP से ज्यादा पैसे लिए, क्या करूँ?" : "Shopkeeper charged more than MRP, what to do?")}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-md transition-all group"
                  >
                    <span className="text-2xl mb-2 block">🛒</span>
                    <span className="font-semibold text-slate-900 block group-hover:text-blue-700">Charged over MRP</span>
                    <span className="text-slate-500 text-sm">MRP से ज्यादा दाम</span>
                  </button>
                  <button
                    onClick={() => handleSubmit(language === 'hi-IN' ? "कंपनी ने वेतन नहीं दिया, क्या करें?" : "Company did not pay my salary")}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-md transition-all group"
                  >
                    <span className="text-2xl mb-2 block">💼</span>
                    <span className="font-semibold text-slate-900 block group-hover:text-blue-700">Unpaid Salary</span>
                    <span className="text-slate-500 text-sm">वेतन नहीं मिला</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    type={msg.type}
                    content={msg.content}
                    timestamp={msg.timestamp}
                    language={language}
                    messageId={msg.type === 'assistant' ? msg.id : undefined}
                    onFeedback={msg.type === 'assistant' ? handleFeedback : undefined}
                    question={msg.type === 'assistant'
                      ? (messages[messages.indexOf(msg) - 1]?.content as string) || ''
                      : undefined
                    }
                  />
                ))}
                {isLoading && <ChatMessage type="assistant" content="" isLoading />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <VoiceInput onTranscript={handleSubmit} disabled={isLoading} language={language} />

            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleSubmit();
                  }
                }}
                placeholder={language === 'hi-IN' ? "यहाँ अपना सवाल लिखें / Type your question..." : "Type your legal question here..."}
                disabled={isLoading}
                className="min-h-12 resize-none"
              />
              <Button onClick={() => handleSubmit()} disabled={isLoading || !input.trim()} className="h-auto">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Reasoning & Risk */}
        {lastResponse && (
          <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
            <div className="sticky top-4 space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Risk Assessment</h3>
                <RiskMeter riskLevel={lastResponse.risk_level} size="md" />
              </div>

              <ReasoningPanel
                steps={lastResponse.reasoning_steps}
                summary="Step-by-step analysis of your legal question"
              />
            </div>
          </div>
        )}
      </div>

      {/* Safety Escalation Modal */}
      {showSafetyModal && safetyResult && (
        <SafetyEscalationModal
          safetyResult={safetyResult}
          onDismiss={() => {
            setShowSafetyModal(false);
            setSafetyResult(null);
          }}
        />
      )}

      {/* Case Brief Modal */}
      {showBriefModal && (
        <CaseBriefModal
          brief={caseBrief}
          isLoading={isGeneratingBrief}
          onClose={() => setShowBriefModal(false)}
          onGenerate={handleGenerateBrief}
        />
      )}
    </div>
  );
}
