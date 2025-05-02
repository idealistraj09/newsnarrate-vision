import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const DEFAULT_REQUEST_TIMEOUT = 30000; // 30 seconds timeout

export async function generateSummaryWithGemini(prompt: string, content: string): Promise<string> {
  try {
    console.log("Attempting to fetch Gemini API key from Supabase...");

    // Get API key from Supabase - use the correct table and column names
    const { data: secretData, error: keyError } = await supabase
      .from('secrets')
      .select('value')
      .eq('name', 'GEMINI_API_KEY')
      .single();

    if (keyError || !secretData || !secretData.value) {
      console.error("Error fetching Gemini API key:", keyError);
      console.log("Supabase response:", secretData);
      throw new Error("Gemini API key not found. Please configure your API key in Supabase.");
    }

    console.log("Gemini API key fetched successfully.");

    const geminiApiKey = secretData.value;
    
    if (!geminiApiKey || geminiApiKey.trim() === '') {
      throw new Error("Gemini API key is empty. Please add a valid API key.");
    }
    
    console.log("Calling Gemini API with prompt:", prompt);
    console.log("Content length:", content.length);
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
              {
                text: `Please provide a concise summary of the following text. Extract the most important information and main points:

${prompt}\n\n${content}

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
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error (${response.status}):`, errorText);
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const apiResponseData = await response.json();
    console.log("Gemini API response received:", apiResponseData);
    
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
