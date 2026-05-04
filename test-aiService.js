import "dotenv/config";
import { GoogleGenAI, Type } from "@google/genai";

const aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const userPrompt = JSON.stringify([{id: "1", name: "Project 1", minutes: 120}]);
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: "test",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  projectId: { type: Type.STRING },
                  day: { type: Type.INTEGER }
                },
                required: ["projectId", "day"]
              }
            }
          },
          required: ["schedule"]
        }
      }
    });
    console.log("Success", response.text);
  } catch (err) {
    console.log("Error generated:", err);
  }
}
test();
