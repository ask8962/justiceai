import PDFDocument from 'pdfkit';

/**
 * Generates a styled PDF Document for a generic legal notice.
 * Returns a Buffer containing the PDF data, which can be uploaded to Firebase.
 */
export async function generateLegalPDF(noticeText: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            // Create a document
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4',
            });

            const buffers: Buffer[] = [];

            // Collect data into a buffer
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            doc.on('error', (err) => reject(err));

            // -- HEADER --
            doc.font('Helvetica-Bold')
                .fontSize(16)
                .text('NOTICE UNDER THE CONSUMER PROTECTION ACT, 2019', {
                    align: 'center'
                });

            doc.moveDown(1);

            doc.font('Helvetica')
                .fontSize(10)
                .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, {
                    align: 'right'
                });

            doc.moveDown(1);

            // -- BODY (The AI Draft) --
            doc.font('Helvetica')
                .fontSize(11)
                .text(noticeText, {
                    align: 'justify',
                    lineGap: 4
                });

            // -- FOOTER (Brand Watermark) --
            doc.moveDown(4);
            const footerY = doc.page.height - 70;

            doc.font('Helvetica-Oblique')
                .fontSize(9)
                .fillColor('gray')
                .text('Drafted electronically via JusticeAI. This is an AI-assisted draft and does not constitute formal legal counsel.',
                    50, footerY, { align: 'center' });

            // Finalize the PDF and end the stream
            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}
