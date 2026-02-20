# JusticeAI - Setup Guide

## Overview
JusticeAI is a legal first-aid system for Indian citizens powered by Google Gemini API and Firebase. It provides accessible legal guidance through conversational AI, voice input, and document analysis.

## Prerequisites
- Node.js 16+ and pnpm installed
- Google Firebase account
- Google AI Studio (Gemini API) account

## Environment Variables Setup

### 1. Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing one
3. Enable Authentication (Email/Password method)
4. Create a Firestore database
5. Copy your Firebase config values from Project Settings:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

### 2. Gemini API Setup
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API Key" or create a new key
3. Copy the key as `NEXT_PUBLIC_GEMINI_API_KEY`

### 3. Add Variables to v0
In the v0 sidebar, click "Vars" and add all 7 environment variables above.

## Installation & Running

```bash
# Install dependencies (automatic in v0)
pnpm install

# Run development server
pnpm dev
```

Navigate to `http://localhost:3000` in your browser.

## Features

### Authentication
- Email/Password sign-up and login via Firebase Auth
- Session persistence with auth context

### Legal Chat
- Conversational AI powered by Google Gemini
- Risk assessment with visual meter
- Structured reasoning explanations
- Chat history saved to Firebase Firestore

### Voice Input
- Record questions using Web Speech API
- Real-time transcription
- Fallback support for browsers without Speech API

### Document Analysis
- Upload PDF and image documents
- OCR extraction with Gemini Vision
- Legal analysis of uploaded documents
- Document context in chat responses

### Explainability
- Detailed reasoning panel showing AI thinking
- Risk classification (High/Medium/Low)
- Relevant IPC sections and Acts cited
- Disclaimer on AI limitations

## Firestore Schema

Collections created automatically:

```
users/
  {userId}/
    email: string
    createdAt: timestamp

chats/
  {chatId}/
    userId: string
    messages: []
      - role: 'user' | 'assistant'
      - content: string
      - timestamp: timestamp
      - reasoning: string (for assistant)
    createdAt: timestamp
    updatedAt: timestamp
```

## Troubleshooting

### "Firebase not initialized"
- Verify all Firebase environment variables are added
- Check Firebase Console for project creation

### "Gemini API Key Error"
- Verify `NEXT_PUBLIC_GEMINI_API_KEY` is correct
- Ensure API is enabled in Google Cloud Console

### "Speech Recognition not available"
- Use HTTPS (required for Web Speech API)
- Check browser compatibility (Chrome/Edge recommended)

## Deployment to Vercel

1. Push code to GitHub
2. Connect repository in Vercel Dashboard
3. Add environment variables in Vercel Project Settings
4. Deploy!

## Legal Disclaimer

JusticeAI provides general legal information only. It is not a substitute for professional legal advice. Always consult with a qualified lawyer for specific legal matters.

## Support

For issues, check:
1. Environment variables are correctly set
2. Firebase project is active and accessible
3. Gemini API key is valid
4. Network connection is stable
