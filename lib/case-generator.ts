import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
});

const MODEL = 'llama-3.3-70b-versatile';

export interface CaseBrief {
    title: string;
    client_goal: string;
    parties: { name: string; role: string }[];
    chronology: { date: string; event: string }[];
    legal_issues: string[];
    applicable_laws: { law: string; section: string }[];
    evidence_checklist: { item: string; status: 'available' | 'missing' | 'unknown'; description: string }[];
    immediate_actions: string[];
    missing_info: string[];
}

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
  "title": "Short descriptive title (e.g., 'Rental Deposit Dispute')",
  "client_goal": "What the user wants to achieve",
  "parties": [{"name": "User", "role": "Tenant"}, ...],
  "chronology": [{"date": "Values", "event": "Event description"}],
  "legal_issues": ["Issue 1", "Issue 2"],
  "applicable_laws": [{"law": "Act Name", "section": "Section"}],
  "evidence_checklist": [
    {"item": "Lease Agreement", "status": "available|missing|unknown", "description": "Proof of tenancy taking place"}
  ],
  "immediate_actions": ["Action 1", "Action 2"],
  "missing_info": ["Info 1", "Info 2"]
}`;

export async function generateCaseBrief(chatHistory: { role: string; content: string }[]): Promise<CaseBrief> {
    try {
        const transcript = chatHistory
            .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
            .join('\n\n');

        const userPrompt = `Please generate a Case Brief from the following consultation history:\n\n${transcript}`;

        const chatCompletion = await groq.chat.completions.create({
            model: MODEL,
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
            throw new Error('Failed to generate structured case brief');
        }

        return JSON.parse(jsonMatch[0]) as CaseBrief;
    } catch (error) {
        console.error('Case Brief Generation Error:', error);
        throw error;
    }
}
