
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const DEFAULT_REQUEST_TIMEOUT = 30000; // 30 seconds timeout

export async function generateSummaryWithGemini(prompt: string, content: string): Promise<string> {
  try {
    // Get API key from Supabase - use the correct table and column names
    const { data: secretData, error: keyError } = await supabase
      .from('secrets')
      .select('value')
      .eq('name', 'GEMINI_API_KEY')
      .single();

    if (keyError || !secretData) {
      console.error("Error fetching Gemini API key:", keyError);
      throw new Error("API key not available. Please configure your API key.");
    }

    const geminiApiKey = secretData.value;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT);

    const response = await fetch(`${API_URL}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${prompt}\n\n${content}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const apiResponseData = await response.json();
    
    if (!apiResponseData.candidates || apiResponseData.candidates.length === 0) {
      throw new Error("No summary generated");
    }

    // Extract the summarized text from the response
    const summary = apiResponseData.candidates[0]?.content?.parts?.[0]?.text || "";
    return summary;
  } catch (error: any) {
    console.error("Gemini summarization error:", error);
    
    if (error.name === 'AbortError') {
      throw new Error("Summary generation timed out. Please try again with shorter content.");
    }
    
    throw error;
  }
}
