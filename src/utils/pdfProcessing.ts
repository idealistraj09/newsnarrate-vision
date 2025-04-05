/**
 * Enhanced PDF Processing Service
 * Uses a more robust approach for PDF text extraction with improved filtering
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
// and improved filtering of non-readable content
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
  
  // Significantly improved text cleanup with more aggressive filtering
  let cleanText = text
    // Remove PDF structural elements
    .replace(/endobj|endstream|obj|stream|xref|trailer|startxref/g, ' ')
    .replace(/\/[A-Za-z0-9]+\s*<<.*?>>/gs, ' ')  // Remove PDF dictionary objects
    .replace(/\/[A-Za-z0-9]+/g, ' ')             // Remove PDF name objects
    .replace(/\[\s*[0-9\s\.]+\s*\]/g, ' ')       // Remove PDF arrays
    // Remove PDF metadata markers, headers and footers
    .replace(/Text\/Image[A-Z]\/Image[A-Z]\/Image[A-Z]\]\/XObject<<\/Image\d+\s+\d+\s+\d+\s+R/g, ' ')
    .replace(/en-US\s+en-US/g, ' ')              // Remove repeated language markers
    
    // Advanced non-English text filtering - Keep only Latin alphabet and common punctuation
    .replace(/[^\x20-\x7E\s.,?!;:'"()[\]{}]/g, '') 
    
    // Basic cleanup
    .replace(/\s+/g, ' ')                // Replace multiple spaces with single space
    .replace(/(\w)\s(\W)/g, "$1$2")      // Remove spaces between words and punctuation
    .replace(/\\n|\\r/g, " ")            // Replace escape sequences with space
    .trim();
  
  // Final filter to try to detect paragraphs of actual readable text
  let paragraphs = cleanText.split(/\s{2,}|\.{2,}/).filter(p => {
    // Only keep strings that look like actual text (contain letters and spaces)
    return p.length > 20 && /[a-zA-Z]{3,}/.test(p) && p.split(' ').length >= 4;
  });
  
  return paragraphs.join('\n\n');
};

// Enhanced check if a PDF has extractable text
export const hasPDFExtractableText = async (file: File): Promise<boolean> => {
  try {
    const text = await extractTextFromPDF(file);
    
    // Better heuristic: check for meaningful text content
    const hasEnoughText = text.length > 100;
    const hasWordVariety = new Set(text.split(/\s+/).filter(w => w.length > 2)).size > 20;
    const hasEnglishWords = /\b(the|and|that|have|for|not|with|you|this|but|his|from|they|say|her|she|will|one|all|would|there|their|what|out|about|who|get|which|when|make|can|like|time|just|him|know|take|into|year|your|good)\b/i.test(text);
    
    return hasEnoughText && hasWordVariety && hasEnglishWords;
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
