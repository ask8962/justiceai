import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { authenticateRequest, addRateLimitHeaders } from '@/lib/api-key-middleware';
import { logApiUsage } from '@/lib/usage-logger';
import { searchLegalKnowledge, formatRetrievedContext } from '@/lib/legal-knowledge';

// Groq API client (server-side)
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Internal Groq model (anukalp-apex-v1 is our branding name)
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Language metadata
const LANGUAGE_NAMES: Record<string, { name: string; script: string }> = {
    'en-US': { name: 'English', script: 'Latin' },
    'hi-IN': { name: 'Hindi', script: 'Devanagari' },
    'bn-IN': { name: 'Bengali', script: 'Bengali' },
    'gu-IN': { name: 'Gujarati', script: 'Gujarati' },
    'kn-IN': { name: 'Kannada', script: 'Kannada' },
    'ml-IN': { name: 'Malayalam', script: 'Malayalam' },
    'mr-IN': { name: 'Marathi', script: 'Devanagari' },
    'od-IN': { name: 'Odia', script: 'Odia' },
    'pa-IN': { name: 'Punjabi', script: 'Gurmukhi' },
    'ta-IN': { name: 'Tamil', script: 'Tamil' },
    'te-IN': { name: 'Telugu', script: 'Telugu' },
    'ur-IN': { name: 'Urdu', script: 'Nastaliq/Urdu' },
};

const LEGAL_SYSTEM_PROMPT = `You are JusticeAI (model: anukalp-apex-v1), an AI legal first-aid assistant for Indian citizens.
Your role is to provide general informational guidance on legal matters under Indian law.

IMPORTANT DISCLAIMER: This is general informational guidance only. It is NOT a substitute for professional legal advice from a qualified lawyer.

When responding to legal questions:
1. Identify the legal issue clearly
2. Reference relevant Indian laws, statutes, and case law where applicable
3. Explain the law in simple, plain language that a non-lawyer can understand
4. Assess the risk level (LOW/MEDIUM/HIGH) for their situation
5. Provide step-by-step reasoning for your analysis
6. List required Evidence/Documents based on the Indian Evidence Act

CRITICAL GUARDRAILS:
- If you are NOT 100% certain of an exact Section number, say "Relevant provisions of [Act Name] may apply" instead.
- NEVER fabricate or hallucinate law section numbers.
- When verified legal references are provided below, USE them and cite them accurately.

Always respond in the language specified by the user.
Format your response as a valid JSON object with these exact fields:
{
  "summary": "Brief 1-2 sentence summary",
  "relevant_law": "Reference to applicable Indian law/statute/section",
  "explanation": "Detailed explanation in plain language",
  "risk_level": "LOW|MEDIUM|HIGH",
  "reasoning_steps": ["Step 1", "Step 2", ...],
  "sources": [{"law": "Full law name", "section": "Section number", "url": "Indian Kanoon URL"}],
  "evidenceChecklist": [{"item": "Document Name", "status": "required|optional", "description": "Why needed"}]
}`;

/**
 * POST /api/v1/legal-query
 * 
 * Body: { question: string, language?: string }
 * Auth: Bearer API key
 */
export async function POST(req: NextRequest) {
    const startTime = Date.now();

    // 1. Authenticate
    const auth = await authenticateRequest(req, 'legal-query');
    if (auth.error) return auth.error;
    const keyDoc = auth.keyDoc!;

    try {
        // 2. Parse body
        const body = await req.json();
        const { question, language = 'en-US' } = body;

        if (!question || typeof question !== 'string') {
            return NextResponse.json(
                { error: { message: 'Missing required field: question', type: 'invalid_request', code: 'missing_field' } },
                { status: 400 }
            );
        }

        // 3. RAG: Search legal knowledge base
        const relevantProvisions = searchLegalKnowledge(question);
        const retrievedContext = formatRetrievedContext(relevantProvisions);

        // 4. Build prompt
        const langInfo = LANGUAGE_NAMES[language] || LANGUAGE_NAMES['en-US'];
        const vernacularInstruction = langInfo.name !== 'English'
            ? `\n\nIMPORTANT: Think and reason in English for legal accuracy, but write your ENTIRE response (all JSON field values) in ${langInfo.name}. Use ${langInfo.script} script.`
            : '';

        const userPrompt = `Language: ${langInfo.name}${vernacularInstruction}\n\nUser Question: ${question}\n${retrievedContext}\n\nProvide a structured JSON response following the schema defined in your system instructions.`;

        // 5. Call Groq LLM
        const chatCompletion = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
                { role: 'system', content: LEGAL_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.5,
            max_tokens: 2048,
        });

        const responseText = chatCompletion.choices[0]?.message?.content || '';

        // 6. Parse JSON response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse structured JSON response from LLM');
        }

        const parsedResponse = JSON.parse(jsonMatch[0]);

        // Enrich sources from RAG if model didn't provide them
        if (!parsedResponse.sources || parsedResponse.sources.length === 0) {
            parsedResponse.sources = relevantProvisions.map((p) => ({
                law: p.law_name,
                section: p.section,
                url: p.indiankanoon_url,
            }));
        }

        // 7. Build response
        const latencyMs = Date.now() - startTime;
        const response = NextResponse.json({
            id: `req_${Date.now().toString(36)}`,
            model: 'anukalp-apex-v1',
            created: Math.floor(Date.now() / 1000),
            data: parsedResponse,
            usage: {
                latency_ms: latencyMs,
            },
        });

        addRateLimitHeaders(response, keyDoc);

        // 8. Log usage (fire-and-forget)
        logApiUsage({
            apiKeyId: keyDoc.id,
            userId: keyDoc.userId,
            endpoint: '/api/v1/legal-query',
            method: 'POST',
            statusCode: 200,
            latencyMs,
            model: 'anukalp-apex-v1',
            req,
        });

        return response;
    } catch (error: any) {
        const latencyMs = Date.now() - startTime;

        logApiUsage({
            apiKeyId: keyDoc.id,
            userId: keyDoc.userId,
            endpoint: '/api/v1/legal-query',
            method: 'POST',
            statusCode: 500,
            latencyMs,
            req,
        });

        console.error('[API] /api/v1/legal-query error:', error);
        return NextResponse.json(
            { error: { message: 'Internal server error', type: 'api_error', code: 'internal_error' } },
            { status: 500 }
        );
    }
}
