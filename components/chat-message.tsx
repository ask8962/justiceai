'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Volume2, Loader2, Square, ThumbsUp, ThumbsDown, ExternalLink, FileText, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RiskMeter } from './risk-meter';
import { LegalNoticeModal } from './legal-notice-modal';
import { ReasoningReportModal } from './reasoning-report-modal';
import { EvidenceChecklist } from './evidence-checklist';
import { LegalResponse } from '@/lib/gemini';
import { textToSpeech, playBase64Audio, SARVAM_LANGUAGES } from '@/lib/sarvam';
import { Timestamp } from 'firebase/firestore';

interface ChatMessageProps {
  type: 'user' | 'assistant';
  content: string | LegalResponse;
  timestamp?: Timestamp | Date;
  isLoading?: boolean;
  language?: string;
  messageId?: string;
  question?: string;
  onFeedback?: (messageId: string, helpful: boolean) => void;
}

/**
 * Animated reasoning steps — reveals one step at a time
 */
function AnimatedReasoningSteps({ steps }: { steps: string[] }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount < steps.length) {
      const timer = setTimeout(() => {
        setVisibleCount((prev) => prev + 1);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [visibleCount, steps.length]);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
      <p className="text-xs text-slate-600 font-medium mb-2 flex items-center gap-1">
        🧠 Chain of Thought:
        {visibleCount < steps.length && (
          <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
        )}
      </p>
      <ol className="space-y-1.5">
        {steps.slice(0, visibleCount).map((step, idx) => (
          <li
            key={idx}
            className="text-xs text-slate-600 animate-fadeIn"
            style={{ animation: 'fadeSlideIn 0.3s ease-out' }}
          >
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] mr-1.5">
              {idx + 1}
            </span>
            {step}
          </li>
        ))}
        {visibleCount < steps.length && (
          <li className="text-xs text-slate-400 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Analyzing...
          </li>
        )}
      </ol>
    </div>
  );
}

export function ChatMessage({
  type,
  content,
  timestamp,
  isLoading,
  language = 'en-US',
  messageId,
  question,
  onFeedback,
}: ChatMessageProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const isUserMessage = type === 'user';
  const isLegalResponse = typeof content === 'object' && 'summary' in content;

  const formatTime = (ts?: Timestamp | Date) => {
    if (!ts) return '';
    try {
      const date = ts instanceof Timestamp ? ts.toDate() : ts;
      return format(date, 'HH:mm');
    } catch {
      return '';
    }
  };

  const handleListen = async () => {
    if (isSpeaking && currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsSpeaking(false);
      setCurrentAudio(null);
      return;
    }

    if (!isLegalResponse) return;

    const response = content as LegalResponse;
    const textToRead = `${response.summary}. ${response.explanation}`;
    const sarvamLang = SARVAM_LANGUAGES[language] || 'en-IN';

    setIsLoadingAudio(true);
    try {
      const base64Audio = await textToSpeech(textToRead, sarvamLang);
      const audio = playBase64Audio(base64Audio);
      setCurrentAudio(audio);
      setIsSpeaking(true);

      audio.onended = () => {
        setIsSpeaking(false);
        setCurrentAudio(null);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setCurrentAudio(null);
      };
    } catch (error) {
      console.error('TTS Error:', error);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleFeedback = (helpful: boolean) => {
    if (feedbackGiven || !messageId || !onFeedback) return;
    setFeedbackGiven(helpful ? 'up' : 'down');
    onFeedback(messageId, helpful);
  };

  if (isUserMessage) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-xs lg:max-w-md">
          <div className="bg-blue-600 text-white rounded-lg px-4 py-2">
            <p className="text-sm">{content as string}</p>
          </div>
          {timestamp && (
            <p className="text-xs text-slate-500 mt-1 text-right">{formatTime(timestamp)}</p>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex gap-3 mb-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" />
          </div>
        </div>
        <div className="flex-grow">
          <div className="bg-slate-100 rounded-lg px-4 py-2">
            <p className="text-sm text-slate-600">Analyzing your query...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLegalResponse) {
    const response = content as LegalResponse;
    const hasSources = response.sources && response.sources.length > 0;

    return (
      <div className="flex gap-3 mb-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-sm font-semibold text-blue-700">⚖</span>
          </div>
        </div>
        <div className="flex-grow space-y-3">
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Summary</h4>
              <p className="text-sm text-slate-700">{response.summary}</p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Applicable Law</h4>
              {hasSources ? (
                <div className="space-y-1">
                  <p className="text-sm text-slate-700">{response.relevant_law}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {response.sources!.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 hover:border-blue-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {src.section || src.law}
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(response.relevant_law + ' Indian law')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  {response.relevant_law} ↗
                </a>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Detailed Explanation</h4>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{response.explanation}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-600">Risk Level:</span>
              <RiskMeter riskLevel={response.risk_level} size="sm" />
            </div>

            {/* Evidence Checklist */}
            {response.evidenceChecklist && response.evidenceChecklist.length > 0 && (
              <EvidenceChecklist items={response.evidenceChecklist} />
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Listen Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleListen}
              disabled={isLoadingAudio}
              className="gap-2 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
            >
              {isLoadingAudio ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : isSpeaking ? (
                <>
                  <Square className="w-4 h-4" />
                  Stop
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  Listen
                </>
              )}
            </Button>

            {/* Generate Legal Notice Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNoticeModal(true)}
              className="gap-2 text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:border-emerald-300"
            >
              <FileText className="w-4 h-4" />
              Draft Notice
            </Button>

            {/* Download Reasoning Report Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowReportModal(true)}
              className="gap-2 text-indigo-600 hover:text-indigo-700 border-indigo-200 hover:border-indigo-300"
            >
              <BarChart2 className="w-4 h-4" />
              Report
            </Button>

            {/* Feedback Buttons */}
            {messageId && onFeedback && (
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-xs text-slate-400 mr-1">Helpful?</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleFeedback(true)}
                  disabled={feedbackGiven !== null}
                  className={`h-8 w-8 p-0 ${feedbackGiven === 'up' ? 'text-green-600 bg-green-50' : 'text-slate-400 hover:text-green-600'}`}
                >
                  <ThumbsUp className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleFeedback(false)}
                  disabled={feedbackGiven !== null}
                  className={`h-8 w-8 p-0 ${feedbackGiven === 'down' ? 'text-red-600 bg-red-50' : 'text-slate-400 hover:text-red-600'}`}
                >
                  <ThumbsDown className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Animated Chain of Thought */}
          <AnimatedReasoningSteps steps={response.reasoning_steps} />

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>Disclaimer:</strong> This is general informational guidance only and not a substitute for professional legal advice. Please consult a qualified lawyer for specific legal matters.
            </p>
          </div>

          {timestamp && (
            <p className="text-xs text-slate-500">{formatTime(timestamp)}</p>
          )}
        </div>

        {/* Legal Notice Modal */}
        {showNoticeModal && (
          <LegalNoticeModal
            response={response}
            language={language}
            onClose={() => setShowNoticeModal(false)}
          />
        )}

        {/* Reasoning Report Modal */}
        {showReportModal && (
          <ReasoningReportModal
            response={response}
            question={(content as any)._question || question || 'N/A'}
            language={language}
            onClose={() => setShowReportModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-4">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
          <span className="text-sm font-semibold text-slate-600">A</span>
        </div>
      </div>
      <div className="flex-grow">
        <div className="bg-slate-100 rounded-lg px-4 py-2">
          <p className="text-sm text-slate-700">{content as string}</p>
        </div>
      </div>
    </div>
  );
}
