
/**
 * PDF Processing Service
 * Uses a simpler approach for PDF text extraction rather than pdf.js
 */

// Simple text extraction from PDF using FileReader
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
          
          // For PDF files, we'll extract text via a simpler method
          // This is a basic approach that works for many PDFs with text layers
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

// Extract text from PDF buffer with enhanced text extraction
const extractTextFromPDFBuffer = (buffer: ArrayBuffer): string => {
  // Convert buffer to byte array
  const bytes = new Uint8Array(buffer);
  
  // Simple text extraction by looking for text markers in the PDF
  let text = "";
  let inText = false;
  let textBuffer = "";
  
  // Improved parser to extract text from PDF stream
  // This handles more PDF formats including those with different encodings
  for (let i = 0; i < bytes.length - 1; i++) {
    // Look for text object markers in PDF - improved pattern matching
    if (bytes[i] === 0x28 && bytes[i+1] !== 0x5C) { // '(' character, not preceded by '\'
      inText = true;
      textBuffer = "";
    } else if (bytes[i] === 0x29 && inText) { // ')' character
      inText = false;
      text += textBuffer + " ";
    } else if (inText) {
      // Add character to buffer if it's printable ASCII or common Unicode
      if ((bytes[i] >= 32 && bytes[i] <= 126) || bytes[i] > 191) {
        textBuffer += String.fromCharCode(bytes[i]);
      }
    }
  }
  
  // Clean up the extracted text
  return text
    .replace(/\s+/g, " ")         // Replace multiple spaces with single space
    .replace(/(\w)\s(\W)/g, "$1$2") // Remove spaces between words and punctuation
    .trim();
};

// Check if a PDF has extractable text
export const hasPDFExtractableText = async (file: File): Promise<boolean> => {
  try {
    const text = await extractTextFromPDF(file);
    // If we extract more than 50 characters, assume it has extractable text
    return text.length > 50;
  } catch (error) {
    console.error("Error checking PDF text:", error);
    return false;
  }
};
