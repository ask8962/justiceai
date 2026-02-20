import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { authenticateRequest, addRateLimitHeaders } from '@/lib/api-key-middleware';
import { logApiUsage } from '@/lib/usage-logger';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Internal Groq model (anukalp-apex-v1 is our branding name)
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const CASE_BRIEF_SYSTEM_PROMPT = `You are an expert legal case analyst. Your task is to review a chat history between a user and a legal AI assistant and structure it into a professional "Case Brief".

Input: A serialized chat transcript.
Output: A structured JSON object representing the case file.

Requirements:
1. Identify the Parties involved (User vs Landlord, Employer, etc.).
2. Construct a Chronology of events from the user's narrative. If dates are missing, use "Undated".
3. Extract specific Legal Issues and Applicable Laws mentioned.
4. Create a DETAILED EVIDENCE TABLE listing all documents/proof needed, their likely status, and why they are important.
5. Suggest Immediate Actions the user should take.
6. Identify Missing Information that is critical for the case.

Format your response as a valid JSON object matching this schema:
{
  "title": "Short descriptive title",
  "client_goal": "What the user wants to achieve",
  "parties": [{"name": "User", "role": "Tenant"}, ...],
  "chronology": [{"date": "Value", "event": "Event description"}],
  "legal_issues": ["Issue 1", "Issue 2"],
  "applicable_laws": [{"law": "Act Name", "section": "Section"}],
  "evidence_checklist": [
    {"item": "Lease Agreement", "status": "available|missing|unknown", "description": "Proof of tenancy"}
  ],
  "immediate_actions": ["Action 1", "Action 2"],
  "missing_info": ["Info 1", "Info 2"]
}`;

/**
 * POST /api/v1/generate-brief
 * 
 * Body: { chatHistory: { role: string, content: string }[] }
 * Auth: Bearer API key
 */
export async function POST(req: NextRequest) {
    const startTime = Date.now();

    const auth = await authenticateRequest(req, 'generate-brief');
    if (auth.error) return auth.error;
    const keyDoc = auth.keyDoc!;

    try {
        const body = await req.json();
        const { chatHistory } = body;

        if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) {
            return NextResponse.json(
                { error: { message: 'Missing or invalid chatHistory array', type: 'invalid_request', code: 'missing_field' } },
                { status: 400 }
            );
        }

        const transcript = chatHistory
            .map((msg: { role: string; content: string }) => `${msg.role.toUpperCase()}: ${msg.content}`)
            .join('\n\n');

        const userPrompt = `Please generate a Case Brief from the following consultation history:\n\n${transcript}`;

        const chatCompletion = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
                { role: 'system', content: CASE_BRIEF_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 4096,
        });

        const responseText = chatCompletion.choices[0]?.message?.content || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            throw new Error('Failed to generate structured case brief from LLM');
        }

        const caseBrief = JSON.parse(jsonMatch[0]);
        const latencyMs = Date.now() - startTime;

        const response = NextResponse.json({
            id: `req_${Date.now().toString(36)}`,
            model: 'anukalp-apex-v1',
            created: Math.floor(Date.now() / 1000),
            data: caseBrief,
            usage: { latency_ms: latencyMs },
        });

        addRateLimitHeaders(response, keyDoc);

        logApiUsage({
            apiKeyId: keyDoc.id,
            userId: keyDoc.userId,
            endpoint: '/api/v1/generate-brief',
            method: 'POST',
            statusCode: 200,
            latencyMs,
            model: 'anukalp-apex-v1',
            req,
        });

        return response;
    } catch (error: any) {
        const latencyMs = Date.now() - startTime;
        logApiUsage({ apiKeyId: keyDoc.id, userId: keyDoc.userId, endpoint: '/api/v1/generate-brief', method: 'POST', statusCode: 500, latencyMs, req });
        console.error('[API] /api/v1/generate-brief error:', error);
        return NextResponse.json(
            { error: { message: 'Case brief generation failed', type: 'api_error', code: 'generation_error' } },
            { status: 500 }
        );
    }
}
