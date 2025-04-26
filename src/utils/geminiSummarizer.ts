
import { generateSummary } from './summarizer';

// Environment variable for API key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Generate a summary of the text using the Gemini API
 */
export async function generateGeminiSummary(text: string): Promise<string> {
  // Fall back to the local summarizer if no API key is available
  if (!API_KEY) {
    console.log("No Gemini API key found, using local summarization");
    return generateSummary(text);
  }

  try {
    console.log("Using Gemini API for summarization");
    const MAX_CHUNK_SIZE = 30000; // Gemini has a token limit
    
    // For very long texts, we need to chunk the content
    if (text.length > MAX_CHUNK_SIZE) {
      const chunks = splitTextIntoChunks(text, MAX_CHUNK_SIZE);
      console.log(`Text too long (${text.length} chars), splitting into ${chunks.length} chunks`);
      
      // Process each chunk separately
      const summaries = await Promise.all(
        chunks.map(chunk => summarizeWithGemini(chunk))
      );
      
      // If we have multiple summaries, summarize them together
      const combinedSummary = summaries.join("\n\n");
      
      // If combined summary is still too long, summarize it again
      if (combinedSummary.length > MAX_CHUNK_SIZE) {
        return summarizeWithGemini(combinedSummary);
      }
      
      return combinedSummary;
    }
    
    return summarizeWithGemini(text);
  } catch (error) {
    console.error("Error with Gemini API:", error);
    console.log("Falling back to local summarization");
    // Fall back to the local summarizer if there's an error with the Gemini API
    return generateSummary(text);
  }
}

/**
 * Split text into chunks of maximum size
 */
function splitTextIntoChunks(text: string, maxChunkSize: number): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }
  
  const chunks: string[] = [];
  let currentChunk = "";
  
  // Split by paragraphs first
  const paragraphs = text.split(/\n\s*\n/);
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed the chunk size, start a new chunk
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }
  
  // Add the last chunk if it's not empty
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

/**
 * Call the Gemini API to summarize the text
 */
async function summarizeWithGemini(text: string): Promise<string> {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Please provide a concise summary of the following text. Extract the most important information and main points:

${text}

Summary:`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          topK: 40,
          topP: 0.95
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts && data.candidates[0].content.parts[0]?.text) {
      return data.candidates[0].content.parts[0].text.trim();
    }
    
    throw new Error("Unexpected response format from Gemini API");
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}
