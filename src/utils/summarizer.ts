
import { generateSummaryWithGemini } from './geminiSummarizer';

const SUMMARY_PROMPT = `You are an expert academic writer and technical communicator. Summarize the following extracted text from a PDF into a well-organized, easily understandable, and reader-friendly format.

Ensure the summary:

Captures the key ideas and main points clearly.

Avoids copying large blocks of text directly; paraphrase naturally.

Divides the content into logical sections or bullet points if needed.

Maintains the original meaning without adding new information.

Uses professional, simple, and engaging language suitable for a report or academic document.

Fixes any grammar or formatting issues present in the raw extracted text.

Output should be concise but complete enough for someone who has not read the full document to understand the main content easily.`;

export async function generateSummary(text: string): Promise<string> {
  try {
    if (!text || text.trim().length === 0) {
      return "No text to summarize";
    }

    const maxLength = 10000; // Limiting input length
    const truncatedText = text.length > maxLength ? 
      text.substring(0, maxLength) + "..." : 
      text;
      
    // Use Gemini-based summarization with our updated prompt
    return await generateSummaryWithGemini(SUMMARY_PROMPT, truncatedText);
  } catch (error) {
    console.error("Error generating summary:", error);
    throw error;
  }
}
