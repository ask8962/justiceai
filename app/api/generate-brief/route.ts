import { NextRequest, NextResponse } from 'next/server';
import { generateCaseBrief } from '@/lib/case-generator';

export async function POST(req: NextRequest) {
    try {
        const { chatHistory } = await req.json();

        if (!chatHistory || !Array.isArray(chatHistory)) {
            return NextResponse.json(
                { error: 'Invalid chat history format' },
                { status: 400 }
            );
        }

        const caseBrief = await generateCaseBrief(chatHistory);

        return NextResponse.json(caseBrief);
    } catch (error) {
        console.error('Error in /api/generate-brief:', error);
        return NextResponse.json(
            { error: 'Failed to generate case brief' },
            { status: 500 }
        );
    }
}
