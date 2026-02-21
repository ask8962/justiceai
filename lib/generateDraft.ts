import Groq from 'groq-sdk';
import { searchLegalKnowledge, formatRetrievedContext } from './legal-knowledge';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = 'llama-3.3-70b-versatile';

/**
 * Generates a legal notice draft and citations based on structured data.
 * @param data Session data from the flow controller (company, amount, orderDate, issueType)
 */
export async function generateLegalDraft(data: {
    company: string;
    amount: string;
    orderDate: string;
    issueType: string;
}): Promise<{ citations: string; draft_notice: string; risk_level: string } | null> {
    try {
        const query = `Consumer protection e-commerce scam against ${data.company}. Issue: ${data.issueType}. Claiming Rs ${data.amount}. Date: ${data.orderDate}`;

        // 1. Retrieve Indian Law context
        const searchResults = await searchLegalKnowledge(query);
        const contextText = formatRetrievedContext(searchResults);

        if (!contextText || contextText.trim() === '') {
            return null; // Signals INSUFFICIENT LEGAL DATA
        }

        // 2. Draft the notice
        const systemPrompt = `You are an expert Indian Legal Advisor generating a formal Legal Notice Draft for a consumer complaint. 
You must base your draft ONLY on the provided legal context.
        
Context:
${contextText}

Given the facts:
Company: ${data.company}
Amount: Rs ${data.amount}
Order Date: ${data.orderDate}
Issue: ${data.issueType}

Output strictly in the following JSON format:
{
  "citations": "String listing the relevant sections/Acts cited from context",
  "draft_notice": "The formal text of the legal notice, addressed to the grievance officer of the company.",
  "risk_level": "🟢 Low Risk | 🟡 Medium Risk | 🔴 High Risk (Assess based on the facts and consumer law)"
}`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: "Generate the JSON response." }
            ],
            model: GROQ_MODEL,
            temperature: 0.1,
            response_format: { type: 'json_object' },
        });

        const resultJsonStr = completion.choices[0]?.message?.content || '{}';
        const result = JSON.parse(resultJsonStr);

        return {
            citations: result.citations || 'Consumer Protection Act, 2019',
            draft_notice: result.draft_notice || 'Notice content missing',
            risk_level: result.risk_level || '🟢 Low Risk',
        };
    } catch (error) {
        console.error('[generateLegalDraft] Error generating draft:', error);
        return null;
    }
}
