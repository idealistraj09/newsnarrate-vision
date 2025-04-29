
import * as pdfjs from 'pdfjs-dist';

// Configure the worker for pdf.js - use a standard approach that works with Vite
// This loads the worker from the same location as the main pdf.js file
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const MAX_PDF_SIZE_MB = 30; // 30MB limit

// Function to extract text from PDF file
export const extractTextFromPDF = async (file: File): Promise<string> => {
  // Check file size
  if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
    throw new Error(`PDF file size exceeds ${MAX_PDF_SIZE_MB}MB limit`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        
        // Process in batches to avoid memory issues
        const BATCH_SIZE = 10;
        for (let i = 1; i <= pdf.numPages; i += BATCH_SIZE) {
          const batchPromises = [];
          for (let j = i; j <= Math.min(i + BATCH_SIZE - 1, pdf.numPages); j++) {
            batchPromises.push(processPage(pdf, j));
          }
          
          const batchResults = await Promise.all(batchPromises);
          fullText += batchResults.join(' ');
          
          // Small delay to allow garbage collection
          if (i + BATCH_SIZE <= pdf.numPages) {
            await new Promise(r => setTimeout(r, 100));
          }
        }
        
        resolve(fullText);
      } catch (error) {
        console.error('Error extracting text:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

async function processPage(pdf: pdfjs.PDFDocumentProxy, pageNumber: number): Promise<string> {
  const page = await pdf.getPage(pageNumber);
  const content = await page.getTextContent();
  
  // Extract text and maintain some formatting
  let lastY = -1;
  let text = '';
  
  for (const item of content.items) {
    if ('str' in item) {
      // Check if this is a new line based on y position
      const y = (item as any).transform[5]; // y-coordinate
      if (lastY !== -1 && Math.abs(y - lastY) > 5) {
        // If y position changed significantly, add a newline
        text += '\n';
      } else if (text.length > 0 && !text.endsWith(' ') && !text.endsWith('\n')) {
        // Add space between items on the same line
        text += ' ';
      }
      
      text += item.str;
      lastY = y;
    }
  }
  
  // Add page separator
  return `${text}\n\n`;
}

// Function to check if a PDF has extractable text
export const hasPDFExtractableText = async (file: File): Promise<boolean> => {
  try {
    const text = await extractTextFromPDF(file);
    // Check if extracted text has meaningful content (not just whitespace or common PDF artifacts)
    const cleanText = text.replace(/\s+/g, ' ').trim();
    return cleanText.length > 50; // Arbitrary threshold
  } catch (error) {
    console.error("Error checking PDF text extractability:", error);
    return false;
  }
};

// Function to estimate PDF page count
export const estimatePDFPageCount = async (arrayBuffer: ArrayBuffer): Promise<number> => {
  try {
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    return pdf.numPages;
  } catch (error) {
    console.error("Error estimating PDF page count:", error);
    return 0;
  }
};
