import Groq from 'groq-sdk';
import { searchLegalKnowledge, formatRetrievedContext } from './legal-knowledge';

// Initialize Groq API
const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

const MODEL = 'llama-3.3-70b-versatile';

// Language code to name mapping for all supported languages
export const LANGUAGE_NAMES: Record<string, { name: string; script: string; nativeName: string }> = {
  'en-US': { name: 'English', script: 'Latin', nativeName: 'English' },
  'hi-IN': { name: 'Hindi', script: 'Devanagari', nativeName: 'हिंदी' },
  'bn-IN': { name: 'Bengali', script: 'Bengali', nativeName: 'বাংলা' },
  'gu-IN': { name: 'Gujarati', script: 'Gujarati', nativeName: 'ગુજરાતી' },
  'kn-IN': { name: 'Kannada', script: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  'ml-IN': { name: 'Malayalam', script: 'Malayalam', nativeName: 'മലയാളം' },
  'mr-IN': { name: 'Marathi', script: 'Devanagari', nativeName: 'मराठी' },
  'od-IN': { name: 'Odia', script: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  'pa-IN': { name: 'Punjabi', script: 'Gurmukhi', nativeName: 'ਪੰਜਾਬੀ' },
  'ta-IN': { name: 'Tamil', script: 'Tamil', nativeName: 'தமிழ்' },
  'te-IN': { name: 'Telugu', script: 'Telugu', nativeName: 'తెలుగు' },
  'ur-IN': { name: 'Urdu', script: 'Nastaliq/Urdu', nativeName: 'اردو' },
};

// Helper to get language name from code
export function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code]?.name || 'English';
}

// Define types for legal response schema
export interface LegalResponse {
  summary: string;
  relevant_law: string;
  explanation: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning_steps: string[];
  sources?: { law: string; section: string; url: string }[];
  evidenceChecklist?: { item: string; status: 'required' | 'optional'; description: string }[];
}

export interface DocumentAnalysis {
  key_points: string[];
  potential_risks: string[];
  simplified_summary: string;
}

// System prompt for the legal assistant
const LEGAL_SYSTEM_PROMPT = `You are JusticeAI, an AI legal first-aid assistant for Indian citizens. 
Your role is to provide general informational guidance on legal matters under Indian law.

IMPORTANT DISCLAIMER: This is general informational guidance only. It is NOT a substitute for professional legal advice from a qualified lawyer. 
Always consult a licensed attorney for specific legal matters.

When responding to legal questions:
1. Identify the legal issue clearly
2. Reference relevant Indian laws, statutes, and case law where applicable
3. Explain the law in simple, plain language that a non-lawyer can understand
4. Assess the risk level (LOW/MEDIUM/HIGH) for their situation
5. Provide step-by-step reasoning for your analysis
6. List required Evidence/Documents based on the Indian Evidence Act to support their case

CRITICAL GUARDRAILS:
- If you are NOT 100% certain of an exact Section number, say "Relevant provisions of [Act Name] may apply" instead of inventing a section number.
- NEVER fabricate or hallucinate law section numbers. Accuracy is more important than specificity.
- When verified legal references are provided below, USE them and cite them accurately.
- Include a "sources" array with the law name, section, and URL for each cited provision.

Always respond in the language specified by the user. You MUST support all major Indian languages: Hindi, Bengali, Gujarati, Kannada, Malayalam, Marathi, Odia, Punjabi, Tamil, Telugu, Urdu, and English. Use the appropriate script for each language.
Format your response as a valid JSON object with these exact fields:
{
  "summary": "Brief 1-2 sentence summary of the legal issue",
  "relevant_law": "Reference to applicable Indian law/statute/section",
  "explanation": "Detailed explanation in plain language",
  "risk_level": "LOW|MEDIUM|HIGH",
  "reasoning_steps": ["Step 1 of analysis", "Step 2 of analysis", ...],
  "sources": [{"law": "Full law name", "section": "Section number", "url": "Indian Kanoon URL"}],
  "evidenceChecklist": [
    {"item": "Document Name", "status": "required|optional", "description": "Why it is needed"}
  ]
}`;

/**
 * Query the legal assistant with a user question
 * Now with RAG: retrieves relevant legal provisions before sending to LLM
 */
export async function queryLegalAssistant(
  question: string,
  language: string = 'English'
): Promise<LegalResponse> {
  try {
    // RAG: Search curated legal knowledge base
    const relevantProvisions = searchLegalKnowledge(question);
    const retrievedContext = formatRetrievedContext(relevantProvisions);

    // Build vernacular instruction for non-English languages
    const langInfo = LANGUAGE_NAMES[language] || LANGUAGE_NAMES['en-US'];
    const langName = langInfo.name;
    const vernacularInstruction =
      langName !== 'English'
        ? `\n\nIMPORTANT: Think and reason in English for legal accuracy, but write your ENTIRE response (all JSON field values) in ${langName}. Use ${langInfo.script} script.`
        : '';

    const userPrompt = `Language: ${langName}${vernacularInstruction}

User Question: ${question}
${retrievedContext}

Provide a structured JSON response following the schema defined in your system instructions. Include the "sources" array with any laws you reference.`;

    const chatCompletion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: LEGAL_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 2048,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || '';

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON response from API');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]) as LegalResponse;

    // Validate response structure
    if (
      !parsedResponse.summary ||
      !parsedResponse.relevant_law ||
      !parsedResponse.explanation ||
      !parsedResponse.risk_level ||
      !Array.isArray(parsedResponse.reasoning_steps)
    ) {
      throw new Error('Invalid response structure from Groq API');
    }

    // Enrich sources from RAG if model didn't provide them
    if (!parsedResponse.sources || parsedResponse.sources.length === 0) {
      parsedResponse.sources = relevantProvisions.map((p) => ({
        law: p.law_name,
        section: p.section,
        url: p.indiankanoon_url,
      }));
    }

    return parsedResponse;
  } catch (error) {
    console.error('Groq API Error:', error);
    throw error;
  }
}

/**
 * Analyze a legal document extracted text
 */
export async function analyzeLegalDocument(
  documentText: string,
  language: string = 'English'
): Promise<DocumentAnalysis> {
  try {
    const userPrompt = `Language: ${language}

Please analyze the following legal document and provide:
1. Key points (extract the most important information)
2. Potential risks (identify any concerning clauses or red flags)
3. Simplified summary (explain in plain language what this document means)

Document:\n${documentText}

Respond as a valid JSON object with this structure:
{
  "key_points": ["point 1", "point 2", ...],
  "potential_risks": ["risk 1", "risk 2", ...],
  "simplified_summary": "A plain language explanation of the document"
}`;

    const chatCompletion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: LEGAL_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 4096,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || '';

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON response from API');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]) as DocumentAnalysis;

    // Validate response structure
    if (
      !Array.isArray(parsedResponse.key_points) ||
      !Array.isArray(parsedResponse.potential_risks) ||
      !parsedResponse.simplified_summary
    ) {
      throw new Error('Invalid document analysis response structure');
    }

    return parsedResponse;
  } catch (error) {
    console.error('Document Analysis Error:', error);
    throw error;
  }
}

/**
 * Generate a legal notice draft based on a legal response
 */
export async function generateLegalNotice(
  legalResponse: LegalResponse,
  language: string = 'English'
): Promise<string> {
  try {
    const langInfo = LANGUAGE_NAMES[language] || LANGUAGE_NAMES['en-US'];
    const langName = langInfo.name;
    const vernacularInstruction =
      langName !== 'English'
        ? `\n\nWrite the entire notice in ${langName} using ${langInfo.script} script.`
        : '';

    const userPrompt = `Based on the following legal analysis, generate a formal legal notice draft.${vernacularInstruction}

Legal Issue Summary: ${legalResponse.summary}
Applicable Law: ${legalResponse.relevant_law}
Explanation: ${legalResponse.explanation}
Risk Level: ${legalResponse.risk_level}

Generate a FORMAL LEGAL NOTICE with:
1. Date and reference number (use [DATE] and [REF] as placeholders)
2. "To" field with [RECIPIENT NAME] and [RECIPIENT ADDRESS] placeholders
3. "From" field with [YOUR NAME] and [YOUR ADDRESS] placeholders
4. Subject line referencing the legal issue
5. Body paragraphs citing the relevant law
6. A clear demand or request for action
7. A deadline (e.g., "within 15 days")
8. Warning of further legal action if not complied
9. Signature block with [YOUR NAME]

Output the notice as plain text, formatted as a professional legal letter. Use placeholders like [YOUR NAME], [ADDRESS], [DATE] etc. for personal details.
Do NOT wrap in JSON. Just output the notice text directly.`;

    const chatCompletion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a legal document drafting assistant. Generate professional, formal legal notices under Indian law. Use clear, formal language appropriate for legal correspondence.',
        },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    });

    return chatCompletion.choices[0]?.message?.content || 'Failed to generate notice.';
  } catch (error) {
    console.error('Legal Notice Generation Error:', error);
    throw error;
  }
}
