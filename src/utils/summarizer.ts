
export async function generateSummary(text: string): Promise<string> {
  // Define maximum chunk size to process
  const MAX_CHUNK_SIZE = 4000; // Characters per chunk
  const chunks = splitTextIntoChunks(text, MAX_CHUNK_SIZE);
  
  // For very long texts, we'll summarize each chunk separately and then combine
  if (chunks.length > 1) {
    console.log(`Text too long, splitting into ${chunks.length} chunks for summarization`);
    const chunkSummaries = await Promise.all(
      chunks.map(chunk => processTextWithAI(chunk))
    );
    
    // If we have multiple chunk summaries, summarize them together
    const combinedSummary = chunkSummaries.join("\n\n");
    
    if (combinedSummary.length > MAX_CHUNK_SIZE) {
      return processTextWithAI(combinedSummary);
    }
    
    return combinedSummary;
  }
  
  return processTextWithAI(text);
}

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

async function processTextWithAI(text: string): Promise<string> {
  try {
    // Use a simple algorithm for summarization if text is very short
    if (text.length < 200) {
      return text;
    }

    // Extract key sentences based on position and keywords
    const summary = extractiveSummarization(text);
    return summary;
  } catch (error) {
    console.error("Error in AI summarization:", error);
    return "Failed to generate summary. Please try again later.";
  }
}

function extractiveSummarization(text: string): string {
  // Split text into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  if (sentences.length <= 3) {
    return text; // Text is already short enough
  }
  
  // Score each sentence based on heuristics
  const scoredSentences = sentences.map((sentence, index) => {
    // Score based on position (first and last sentences are often important)
    const positionScore = 
      index === 0 || index === sentences.length - 1 ? 2 : 
      index < sentences.length * 0.2 ? 1.5 : 
      index > sentences.length * 0.8 ? 1.2 : 1;
    
    // Score based on length (not too short, not too long)
    const words = sentence.split(/\s+/).length;
    const lengthScore = 
      words < 5 ? 0.5 :
      words > 25 ? 0.7 : 1;
    
    // Score based on presence of keywords or phrases suggesting importance
    const keywordScore = 
      /important|significant|key|main|primary|essential|crucial|critical|fundamental/i.test(sentence) ? 1.5 : 
      /conclude|summary|therefore|thus|result|finding/i.test(sentence) ? 1.4 : 1;
    
    const totalScore = positionScore * lengthScore * keywordScore;
    
    return {
      text: sentence.trim(),
      score: totalScore,
      index
    };
  });
  
  // Sort sentences by their original position to maintain flow
  const selectedSentences = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(3, Math.floor(sentences.length * 0.3))) // Get top 30% sentences or at least 3
    .sort((a, b) => a.index - b.index);
  
  return selectedSentences.map(s => s.text).join(" ");
}
