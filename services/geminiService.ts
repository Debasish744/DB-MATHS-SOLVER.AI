
import { GoogleGenAI, Type } from "@google/genai";
import { ExplanationLevel } from "../types";

const getSystemInstruction = (level: ExplanationLevel) => {
  const levelDescriptions = {
    quick: "Focus on the final answer and minimal necessary steps. Be very concise.",
    standard: "Provide a balanced step-by-step guide suitable for high school students.",
    deep: "Explain the 'why' behind every step. Use analogies and break down complex formulas into simpler parts.",
    academic: "Use formal mathematical language, cite specific theorems by name, and provide rigorous proofs where applicable."
  };

  return `You are an elite Mathematical Problem-Solving Assistant and Tutor. 
Your goal is to help students learn by providing clear, step-by-step guidance.

Level Adjustment: ${levelDescriptions[level]}

Rules:
1. Only solve mathematics, physics, or logic problems. Politely decline other subjects.
2. If an image is provided, first describe the mathematical problem shown in the image accurately.
3. List the core theorems, identities, or concepts required to solve the problem.
4. Provide a step-by-step solution where each step is explained in plain English followed by the mathematical derivation.
5. Use LaTeX (wrapped in $$ or $) for all mathematical expressions.
6. Provide a clear 'Final Answer' section.
7. Include a 'tutoringTip' which is a small piece of advice or a mnemonic to help the student remember this concept in the future.

Return your response in structured JSON format.`;
};

export const solveMathProblem = async (
  input: string,
  level: ExplanationLevel = 'standard',
  image?: string
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const contents: any[] = [];
  
  if (image) {
    const base64Data = image.split(',')[1] || image;
    contents.push({
      inlineData: {
        mimeType: "image/png",
        data: base64Data
      }
    });
  }

  contents.push({ text: input || "Please solve this math problem step-by-step." });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: contents },
      config: {
        systemInstruction: getSystemInstruction(level),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            concepts: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }
            },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  math: { type: Type.STRING }
                },
                required: ["title", "explanation", "math"]
              }
            },
            finalAnswer: { type: Type.STRING },
            tutoringTip: { type: Type.STRING }
          },
          required: ["description", "concepts", "steps", "finalAnswer"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
