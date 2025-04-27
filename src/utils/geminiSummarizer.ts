import { generateSummary } from './summarizer';

// Environment variable for API key
const API_KEY = 'AIzaSyAdonQ7MXhZmToca53KX0jXwq9g3rR3FCk';

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
    console.log("Text being sent to Gemini API:", text);
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAdonQ7MXhZmToca53KX0jXwq9g3rR3FCk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an expert academic writer and technical communicator. Summarize the following extracted text from a PDF into a well-organized, easily understandable, and reader-friendly format.

Ensure the summary:
- Captures the key ideas and main points clearly
- Avoids copying large blocks of text directly; paraphrase naturally
- Divides the content into logical sections or bullet points if needed
- Maintains the original meaning without adding new information
- Uses professional, simple, and engaging language suitable for a report or academic document
- Fixes any grammar or formatting issues present in the raw extracted text

The text to summarize is:

${text}

Summary:`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3, // Slightly reduced for more focused output
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
