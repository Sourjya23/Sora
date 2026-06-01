const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const GEMINI_CASCADE = [
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash"
];

const OPENROUTER_CASCADE = [
  "google/gemma-2-9b-it:free",
  "mistralai/mistral-7b-instruct:free",
  "meta-llama/llama-3-8b-instruct:free"
];

class OllamaService {
  static async generate(modelName, prompt, expectJson = false, options = {}) {
    // Attempt Gemini Models
    for (const geminiModel of GEMINI_CASCADE) {
      try {
        const model = genAI.getGenerativeModel({
          model: geminiModel,
          generationConfig: expectJson ? { responseMimeType: "application/json" } : {},
        });

        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 10000))
        ]);
        return result.response.text();
      } catch (error) {
        console.warn(`[Gemini Generate Router] ${geminiModel} failed: ${error.message}. Cascading...`);
      }
    }

    // Fallback to OpenRouter Models
    for (const orModel of OPENROUTER_CASCADE) {
      try {
        const response = await Promise.race([
          openai.chat.completions.create({
            model: orModel,
            messages: [{ role: "user", content: prompt }]
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 10000))
        ]);
        return response.choices[0].message.content;
      } catch (error) {
        console.warn(`[OpenRouter Generate Router] ${orModel} failed: ${error.message}. Cascading...`);
      }
    }

    throw new Error("Failed to generate response. All AI models and fallbacks exhausted.");
  }

  static async chat(modelName, messages, expectJson = false, options = {}) {
    // Attempt Gemini Models
    for (const geminiModel of GEMINI_CASCADE) {
      try {
        const systemInstruction = messages.find(m => m.role === "system")?.content;
        
        const model = genAI.getGenerativeModel({
          model: geminiModel,
          systemInstruction: systemInstruction || undefined,
          generationConfig: expectJson ? { responseMimeType: "application/json" } : {},
        });

        const rawHistory = messages
          .filter(m => m.role !== "system")
          .slice(0, -1)
          .map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
          }));

        const history = [];
        for (const msg of rawHistory) {
          if (history.length === 0 && msg.role === 'model') {
            history.push({ role: 'user', parts: [{ text: 'Hello' }] });
          }
          if (history.length > 0 && history[history.length - 1].role === msg.role) {
            history[history.length - 1].parts[0].text += '\\n\\n' + msg.parts[0].text;
          } else {
            history.push(msg);
          }
        }

        const lastMessage = messages[messages.length - 1].content;
        const chatSession = model.startChat({ history });
        
        const result = await Promise.race([
          chatSession.sendMessage(lastMessage),
          new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 10000))
        ]);
        
        return result.response.text();
      } catch (error) {
        console.warn(`[Gemini Chat Router] ${geminiModel} failed: ${error.message}. Cascading...`);
      }
    }

    // Fallback to OpenRouter Models
    for (const orModel of OPENROUTER_CASCADE) {
      try {
        // OpenRouter natively supports standard system/user/assistant formats
        const response = await Promise.race([
          openai.chat.completions.create({
            model: orModel,
            messages: messages,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 10000))
        ]);
        return response.choices[0].message.content;
      } catch (error) {
        console.warn(`[OpenRouter Chat Router] ${orModel} failed: ${error.message}. Cascading...`);
      }
    }

    throw new Error("Failed to chat with AI. All models and fallbacks exhausted.");
  }
}

module.exports = OllamaService;
