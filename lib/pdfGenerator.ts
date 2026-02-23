import PDFDocument from 'pdfkit';

/**
 * Strips ANSI escape codes (color codes like [31m, [0m) from text.
 */
function stripAnsi(text: string): string {
    return text.replace(/\u001b\[[0-9;]*m/g, '')     // ESC[ sequences
        .replace(/\[([0-9;]*)m/g, '');         // Bare [31m sequences without ESC
}

/**
 * Generates a beautifully formatted PDF legal notice.
 * Returns a Buffer containing the PDF data.
 */
export async function generateLegalPDF(
    noticeText: string,
    metadata?: {
        company?: string;
        amount?: string;
        orderDate?: string;
        issueType?: string;
        citations?: string;
        riskLevel?: string;
    }
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const cleanText = stripAnsi(noticeText);

            const doc = new PDFDocument({
                margin: 60,
                size: 'A4',
                bufferPages: true,
                info: {
                    Title: 'Legal Notice - Consumer Protection Act, 2019',
                    Author: 'JusticeAI',
                },
            });

            const buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', (err) => reject(err));

            const pageWidth = doc.page.width - 120; // 60px margin each side

            // ═══════════════════════════════════════════════
            //  HEADER / LETTERHEAD
            // ═══════════════════════════════════════════════

            // Red accent bar at top
            doc.rect(0, 0, doc.page.width, 6).fill('#DC2626');

            // Brand name
            doc.moveDown(1);
            doc.font('Helvetica-Bold')
                .fontSize(22)
                .fillColor('#1E293B')
                .text('JUSTICEAI', { align: 'center' });

            doc.font('Helvetica')
                .fontSize(9)
                .fillColor('#64748B')
                .text('AI-Powered Consumer Rights Platform', { align: 'center' });

            // Divider line
            doc.moveDown(0.5);
            const dividerY = doc.y;
            doc.moveTo(60, dividerY)
                .lineTo(doc.page.width - 60, dividerY)
                .strokeColor('#CBD5E1')
                .lineWidth(1)
                .stroke();

            doc.moveDown(1);

            // ═══════════════════════════════════════════════
            //  TITLE
            // ═══════════════════════════════════════════════

            doc.font('Helvetica-Bold')
                .fontSize(14)
                .fillColor('#DC2626')
                .text('NOTICE UNDER THE CONSUMER PROTECTION ACT, 2019', {
                    align: 'center',
                });

            doc.moveDown(0.8);

            // ═══════════════════════════════════════════════
            //  DATE & REFERENCE
            // ═══════════════════════════════════════════════

            const today = new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            });

            doc.font('Helvetica-Bold')
                .fontSize(10)
                .fillColor('#334155')
                .text(`Date: `, { continued: true });
            doc.font('Helvetica')
                .text(today);

            if (metadata?.company) {
                doc.font('Helvetica-Bold')
                    .text(`To: `, { continued: true });
                doc.font('Helvetica')
                    .text(`The Grievance Officer, ${metadata.company}`);
            }

            doc.moveDown(0.5);

            // Subject line
            if (metadata?.issueType) {
                doc.font('Helvetica-Bold')
                    .fontSize(10)
                    .fillColor('#334155')
                    .text(`Subject: `, { continued: true });
                doc.font('Helvetica')
                    .text(`Complaint regarding "${metadata.issueType}" — Demand for Rs ${metadata.amount || 'N/A'}`);
            }

            doc.moveDown(0.3);

            // Thin separator
            const sepY = doc.y;
            doc.moveTo(60, sepY)
                .lineTo(doc.page.width - 60, sepY)
                .strokeColor('#E2E8F0')
                .lineWidth(0.5)
                .stroke();

            doc.moveDown(0.8);

            // ═══════════════════════════════════════════════
            //  BODY — The Legal Draft
            // ═══════════════════════════════════════════════

            // Split the notice into paragraphs and render each one
            const paragraphs = cleanText.split(/\n\n+/);

            doc.font('Helvetica')
                .fontSize(11)
                .fillColor('#1E293B');

            for (const para of paragraphs) {
                const trimmed = para.trim();
                if (!trimmed) continue;

                // Check if it looks like a heading (ALL CAPS or starts with "Re:" or "Subject:")
                const isHeading = trimmed === trimmed.toUpperCase() && trimmed.length < 80;

                if (isHeading) {
                    doc.moveDown(0.5);
                    doc.font('Helvetica-Bold')
                        .fontSize(11)
                        .fillColor('#334155')
                        .text(trimmed, { align: 'left' });
                    doc.moveDown(0.3);
                } else {
                    doc.font('Helvetica')
                        .fontSize(11)
                        .fillColor('#1E293B')
                        .text(trimmed, {
                            align: 'justify',
                            lineGap: 3,
                        });
                    doc.moveDown(0.6);
                }
            }

            // ═══════════════════════════════════════════════
            //  CITATIONS BOX
            // ═══════════════════════════════════════════════

            if (metadata?.citations) {
                doc.moveDown(0.5);

                const boxTop = doc.y;
                const boxHeight = 50;

                // Light blue background box
                doc.rect(60, boxTop, pageWidth, boxHeight)
                    .fill('#EFF6FF');

                doc.font('Helvetica-Bold')
                    .fontSize(9)
                    .fillColor('#1E40AF')
                    .text('LEGAL REFERENCES:', 70, boxTop + 10);

                doc.font('Helvetica')
                    .fontSize(9)
                    .fillColor('#334155')
                    .text(stripAnsi(metadata.citations), 70, boxTop + 24, {
                        width: pageWidth - 20,
                    });

                doc.y = boxTop + boxHeight + 10;
            }

            // ═══════════════════════════════════════════════
            //  FOOTER
            // ═══════════════════════════════════════════════

            const footerY = doc.page.height - 80;

            // Footer divider
            doc.moveTo(60, footerY)
                .lineTo(doc.page.width - 60, footerY)
                .strokeColor('#E2E8F0')
                .lineWidth(0.5)
                .stroke();

            doc.font('Helvetica-Oblique')
                .fontSize(8)
                .fillColor('#94A3B8')
                .text(
                    'This document was drafted electronically via JusticeAI (justiceai.in). ' +
                    'This is an AI-assisted draft and does not constitute formal legal counsel. ' +
                    'Please consult a qualified advocate before sending.',
                    60, footerY + 10,
                    { align: 'center', width: pageWidth }
                );

            // Red accent bar at bottom
            doc.rect(0, doc.page.height - 6, doc.page.width, 6).fill('#DC2626');

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}
