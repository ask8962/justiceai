'use client';

// Sarvam AI API Service
// Base URL: https://api.sarvam.ai
// Auth: api-subscription-key header

const SARVAM_API_KEY = process.env.NEXT_PUBLIC_SARVAM_API_KEY || '';
const SARVAM_BASE_URL = 'https://api.sarvam.ai';

// Language code mapping for Sarvam API
export const SARVAM_LANGUAGES: Record<string, string> = {
    'en-US': 'en-IN',
    'hi-IN': 'hi-IN',
    'bn-IN': 'bn-IN', // Bengali
    'gu-IN': 'gu-IN', // Gujarati
    'kn-IN': 'kn-IN', // Kannada
    'ml-IN': 'ml-IN', // Malayalam
    'mr-IN': 'mr-IN', // Marathi
    'od-IN': 'od-IN', // Odia
    'pa-IN': 'pa-IN', // Punjabi
    'ta-IN': 'ta-IN', // Tamil
    'te-IN': 'te-IN', // Telugu
    'ur-IN': 'ur-IN', // Urdu
};

/**
 * Text-to-Speech using Sarvam Bulbul v3
 * Converts text to natural-sounding speech in Indian languages
 * Returns a base64-encoded audio string (WAV)
 */
export async function textToSpeech(
    text: string,
    targetLanguage: string = 'en-IN'
): Promise<string> {
    // Sarvam TTS has a 500 char limit per input; truncate if needed
    const truncatedText = text.length > 500 ? text.substring(0, 500) : text;

    const response = await fetch(`${SARVAM_BASE_URL}/text-to-speech`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': SARVAM_API_KEY,
        },
        body: JSON.stringify({
            inputs: [truncatedText],
            target_language_code: targetLanguage,
            model: 'bulbul:v3',
            speaker: 'kavya',
            pace: 1.0,
            enable_preprocessing: true,
        }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error('Sarvam TTS Error:', errorData);
        throw new Error(`Sarvam TTS failed: ${response.status}`);
    }

    const data = await response.json();
    // Response contains audios array with base64-encoded audio
    return data.audios[0];
}

/**
 * Speech-to-Text using Sarvam Saaras v3
 * Transcribes audio in Indian languages
 * Accepts an audio Blob (WAV/webm) and returns the transcript
 */
export async function speechToText(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    formData.append('model', 'saaras:v3');
    formData.append('language_code', 'unknown');
    formData.append('with_timestamps', 'false');

    const response = await fetch(`${SARVAM_BASE_URL}/speech-to-text`, {
        method: 'POST',
        headers: {
            'api-subscription-key': SARVAM_API_KEY,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error('Sarvam STT Error:', errorData);
        throw new Error(`Sarvam STT failed: ${response.status}`);
    }

    const data = await response.json();
    return data.transcript || '';
}

/**
 * Translate text between English and Hindi using Sarvam Translate
 */
export async function translateText(
    text: string,
    sourceLanguage: string = 'en-IN',
    targetLanguage: string = 'hi-IN'
): Promise<string> {
    const response = await fetch(`${SARVAM_BASE_URL}/translate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': SARVAM_API_KEY,
        },
        body: JSON.stringify({
            input: text,
            source_language_code: sourceLanguage,
            target_language_code: targetLanguage,
            model: 'mayura:v1',
            enable_preprocessing: true,
        }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error('Sarvam Translate Error:', errorData);
        throw new Error(`Sarvam Translate failed: ${response.status}`);
    }

    const data = await response.json();
    return data.translated_text || '';
}

/**
 * Helper: Play base64 audio
 */
export function playBase64Audio(base64Audio: string): HTMLAudioElement {
    const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
    audio.play();
    return audio;
}
