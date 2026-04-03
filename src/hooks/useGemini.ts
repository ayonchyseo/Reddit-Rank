import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function analyzeWithGemini(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze data with AI.");
  }
}

// Helper to safely parse JSON from Gemini
export function parseGeminiJson<T>(text: string): T | null {
  try {
    // Remove potential markdown blocks and whitespace
    let clean = text.replace(/```json|```/g, "").trim();
    
    // Sometimes Gemini adds comments or trailing commas which JSON.parse doesn't like
    // This is a basic attempt to clean some common issues if JSON.parse fails
    try {
      return JSON.parse(clean) as T;
    } catch (e) {
      // Try to remove trailing commas before closing braces/brackets
      clean = clean.replace(/,\s*([\]}])/g, "$1");
      // Try to remove single-line comments
      clean = clean.replace(/\/\/.*$/gm, "");
      return JSON.parse(clean) as T;
    }
  } catch (e) {
    console.error("Failed to parse Gemini JSON:", e);
    return null;
  }
}
