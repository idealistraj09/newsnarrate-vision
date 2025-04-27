
import { generateSummary } from './summarizer';

// Environment variable for API key
const API_KEY = 'AIzaSyAdonQ7MXhZmToca53KX0jXwq9g3rR3FCk';

/**
 * Fetch news articles using the Gemini API
 */
export async function fetchNewsArticles(category: string): Promise<any[]> {
  if (!API_KEY) {
    console.error("No Gemini API key found");
    return [];
  }

  try {
    console.log("Using Gemini API for fetching news");
    
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
                text: `You are a professional news reporter and content curator. Generate a concise list of the top 10 trending ${category !== 'All' ? category + ' ' : ''}news articles from India. For each article, provide:

1. A compelling headline/title that captures the essence of the story
2. A concise but informative description (2-3 sentences) that summarizes the key points
3. The source of the news (publication name)

The response MUST be in the following JSON format only, without any additional text or explanations:
\`\`\`json
[
  {
    "title": "Headline of the article",
    "description": "Brief description of the article content",
    "source": "Publication Name"
  },
  ...
]
\`\`\`

Ensure the news is current, factual, and represents a diverse range of important topics. Do not include any explanatory text outside the JSON structure.`
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
    return parseGeminiResponse(data);
    
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}

/**
 * Parse the Gemini API response to extract news articles
 */
function parseGeminiResponse(data: any): any[] {
  try {
    let text = data?.candidates[0]?.content?.parts[0]?.text || '';
    
    const jsonPattern = /```json\s*([\s\S]*)\s*```/;
    const match = text.match(jsonPattern);

    if (match && match[1]) {
      const parsedData = JSON.parse(match[1]);

      if (Array.isArray(parsedData)) {
        return parsedData.map((article: any) => ({
          title: article.title || 'No title',
          description: article.description || 'No description',
          source: article.source || 'No source',
        }));
      } else {
        console.error('Parsed data is not an array:', parsedData);
        return [];
      }
    } else {
      console.error('No valid JSON found in response:', text);
      return [];
    }
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    return [];
  }
}
