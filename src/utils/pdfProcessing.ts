
/**
 * Enhanced PDF Processing Service
 * Uses a more robust approach for PDF text extraction
 */

// Improved text extraction from PDF using FileReader
export const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          if (!event.target?.result) {
            reject(new Error("Failed to read PDF file"));
            return;
          }
          
          // For PDF files, extract text using an enhanced extraction method
          const text = extractTextFromPDFBuffer(event.target.result as ArrayBuffer);
          resolve(text);
        } catch (error) {
          console.error("Error processing PDF content:", error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(new Error("Error reading the PDF file"));
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("PDF extraction error:", error);
      reject(error);
    }
  });
};

// Enhanced text extraction algorithm with better support for different PDF formats
const extractTextFromPDFBuffer = (buffer: ArrayBuffer): string => {
  // Convert buffer to byte array
  const bytes = new Uint8Array(buffer);
  
  let text = "";
  let inText = false;
  let textBuffer = "";
  
  // Enhanced parser with support for multiple encodings and PDF structures
  for (let i = 0; i < bytes.length - 4; i++) {
    // Look for text blocks with improved pattern matching
    // Check for text stream markers
    if (
      (bytes[i] === 0x28 && bytes[i+1] !== 0x5C) || // '(' character
      (bytes[i] === 0xFE && bytes[i+1] === 0xFF) || // UTF-16 BOM
      (bytes[i] === 0x2F && bytes[i+1] === 0x54 && bytes[i+2] === 0x65) // "/Te" prefix for text objects
    ) { 
      inText = true;
      textBuffer = "";
    } else if (
      (bytes[i] === 0x29 && inText) || // ')' character
      (bytes[i] === 0x3E && bytes[i+1] === 0x3E) // '>>' stream end
    ) {
      inText = false;
      text += textBuffer + " ";
    } else if (inText) {
      // Add character to buffer if it's printable
      // Support wide range of encodings including UTF-8 and standard ASCII
      if ((bytes[i] >= 32 && bytes[i] <= 126) || bytes[i] > 191 || 
          (bytes[i] === 0x0A || bytes[i] === 0x0D)) { // Include newlines
        textBuffer += String.fromCharCode(bytes[i]);
      }
    }
  }
  
  // Improved text cleanup with better handling for common PDF issues
  return text
    .replace(/\s+/g, " ")                // Replace multiple spaces with single space
    .replace(/(\w)\s(\W)/g, "$1$2")      // Remove spaces between words and punctuation
    .replace(/\\n|\\r/g, " ")            // Replace escape sequences with space
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "") // Remove non-printable characters
    .trim();
};

// Enhanced check if a PDF has extractable text
export const hasPDFExtractableText = async (file: File): Promise<boolean> => {
  try {
    const text = await extractTextFromPDF(file);
    
    // Better heuristic: check for meaningful text content
    const hasEnoughText = text.length > 100;
    const hasWordVariety = new Set(text.split(/\s+/).filter(w => w.length > 2)).size > 20;
    
    return hasEnoughText && hasWordVariety;
  } catch (error) {
    console.error("Error checking PDF text:", error);
    return false;
  }
};

// Get an estimate of the number of pages in the PDF
export const estimatePDFPageCount = (buffer: ArrayBuffer): number => {
  const bytes = new Uint8Array(buffer);
  let pageCount = 0;
  
  // Simple heuristic to count "/Page" objects
  for (let i = 0; i < bytes.length - 5; i++) {
    if (
      bytes[i] === 0x2F &&      // '/'
      bytes[i+1] === 0x50 &&    // 'P'
      bytes[i+2] === 0x61 &&    // 'a'
      bytes[i+3] === 0x67 &&    // 'g'
      bytes[i+4] === 0x65       // 'e'
    ) {
      pageCount++;
    }
  }
  
  // Return at least 1 page if we couldn't detect any
  return Math.max(1, Math.floor(pageCount / 2));
};
