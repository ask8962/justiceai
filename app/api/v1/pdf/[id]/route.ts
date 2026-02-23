import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDb } from '@/lib/firebase-admin';

/**
 * Serves temporary PDF files stored in Firestore.
 * Twilio fetches the PDF from this URL when delivering media messages.
 * 
 * GET /api/v1/pdf/[id]
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return new NextResponse('Not Found', { status: 404 });
        }

        const db = getFirebaseAdminDb();
        const docRef = db.collection('pdf_cache').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return new NextResponse('PDF not found', { status: 404 });
        }

        const data = doc.data();
        const base64Pdf = data?.pdf as string;

        if (!base64Pdf) {
            return new NextResponse('PDF data missing', { status: 404 });
        }

        // Convert base64 to Buffer and serve as PDF
        const pdfBuffer = Buffer.from(base64Pdf, 'base64');

        // Note: For PDFs, we might want to keep them around for a bit 
        // in case the user re-downloads or forwards within a short window.
        // But for security/cost, we'll delete it immediately after serving.
        // If they click 'forward', WhatsApp handles the media internally.
        docRef.delete().catch(() => { });

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Length': pdfBuffer.length.toString(),
                'Content-Disposition': 'inline; filename="JusticeAI_Legal_Notice.pdf"',
                'Cache-Control': 'no-cache, no-store',
            },
        });
    } catch (error) {
        console.error('[PDF Serve] Error serving PDF:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
