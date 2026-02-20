/**
 * Document processing service for extracting text from PDFs and images
 * Uses PDF.js for PDF processing and OCR for images (simplified version using Gemini)
 */

/**
 * Extract text from PDF file
 * For MVP, we'll use a simple approach - rely on Gemini's vision capabilities
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Check file type
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      throw new Error('File must be a PDF');
    }

    // For production, you'd use pdf.js library
    // For MVP, we'll convert to base64 and let Gemini handle it
    const base64 = await fileToBase64(file);
    
    console.log('PDF file prepared for processing');
    
    return base64;
  } catch (error) {
    console.error(' Error extracting PDF text:', error);
    throw error;
  }
}

/**
 * Extract text from image file using Gemini Vision
 */
export async function extractTextFromImage(file: File): Promise<string> {
  try {
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('File must be an image (JPEG, PNG, GIF, or WebP)');
    }

    // Convert to base64
    const base64 = await fileToBase64(file);
    
    console.log('[v0] Image file prepared for processing');
    
    return base64;
  } catch (error) {
    console.error('[v0] Error extracting image text:', error);
    throw error;
  }
}

/**
 * Convert file to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 part (remove data:image/... prefix)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Process document file (PDF or image) and extract text content
 */
export async function processDocument(file: File): Promise<string> {
  try {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      return await extractTextFromPDF(file);
    } else if (file.type.startsWith('image/')) {
      return await extractTextFromImage(file);
    } else {
      throw new Error('Unsupported file type. Please upload a PDF or image.');
    }
  } catch (error) {
    console.error('[v0] Error processing document:', error);
    throw error;
  }
}

/**
 * Validate document file
 */
export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  // Check file type
  const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
  const isImage = file.type.startsWith('image/');

  if (!isPdf && !isImage) {
    return { valid: false, error: 'Please upload a PDF or image file' };
  }

  return { valid: true };
}
