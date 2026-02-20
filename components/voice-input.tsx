'use client';

import { useRef, useState } from 'react';
import { Mic, MicOff, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { speechToText } from '@/lib/sarvam';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  language?: string;
}

export function VoiceInput({ onTranscript, disabled, language = 'en-US' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        if (audioBlob.size < 100) {
          setTranscript('');
          return;
        }

        setIsProcessing(true);
        try {
          const text = await speechToText(audioBlob);
          setTranscript(text);
        } catch (error) {
          console.error('Sarvam STT error:', error);
          setTranscript('');
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start(250); // collect data every 250ms
      setIsListening(true);
      setTranscript('');
    } catch (error) {
      console.error('Microphone access error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSend = () => {
    if (transcript.trim()) {
      onTranscript(transcript);
      setTranscript('');
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg">
      <Button
        size="sm"
        variant={isListening ? 'destructive' : 'outline'}
        onClick={toggleListening}
        disabled={disabled || isProcessing}
        className={`gap-2 relative ${isListening ? 'px-4 py-2' : 'px-4 py-2'}`}
      >
        {isListening && (
          <span className="absolute inset-0 rounded-md border-2 border-red-400 animate-ping opacity-40" />
        )}
        {isListening ? (
          <>
            <MicOff className="w-5 h-5" />
            Stop
          </>
        ) : (
          <>
            <Mic className="w-5 h-5" />
            Record
          </>
        )}
      </Button>

      {isProcessing && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-3 h-3 animate-spin" />
          Transcribing with Sarvam AI...
        </div>
      )}

      {transcript && !isProcessing && (
        <div className="flex-grow">
          <p className="text-sm text-slate-700 truncate">{transcript}</p>
        </div>
      )}

      {transcript && !isProcessing && (
        <Button
          size="sm"
          onClick={handleSend}
          disabled={disabled || !transcript.trim()}
          className="gap-2"
        >
          <Send className="w-4 h-4" />
          Send
        </Button>
      )}

      {!transcript && !isProcessing && isListening && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs text-slate-500">Listening...</span>
        </div>
      )}
    </div>
  );
}
