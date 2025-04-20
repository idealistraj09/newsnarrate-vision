import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url"; // <-- this is the key

// Set the worker source for pdf.js
GlobalWorkerOptions.workerSrc = workerSrc;

export async function estimatePDFPageCount(data: ArrayBuffer): Promise<number> {
  const pdf = await getDocument({ data }).promise;
  return pdf.numPages;
}

export async function extractTextFromPDF(file: File, maxPages = 3): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: buffer }).promise;

  let text = "";
  for (let i = 1; i <= Math.min(pdf.numPages, maxPages); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(" ");
    text += pageText + "\n";
  }

  return text.trim();
}

export async function hasPDFExtractableText(file: File): Promise<boolean> {
  const text = await extractTextFromPDF(file);
  return text.length > 50;
}
