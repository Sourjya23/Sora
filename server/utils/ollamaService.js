const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class OllamaService {
  /**
   * Drop-in replacement for Ollama generate using Gemini.
   */
  static async generate(modelName, prompt, expectJson = false, options = {}) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        generationConfig: expectJson ? { responseMimeType: "application/json" } : {},
      });

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error(`Gemini Generate Error:`, error.message);
      throw new Error(`Failed to generate response from AI`);
    }
  }

  /**
   * Drop-in replacement for Ollama chat using Gemini.
   */
  static async chat(modelName, messages, expectJson = false, options = {}) {
    try {
      // Extract system instructions for Gemini
      const systemInstruction = messages.find(m => m.role === "system")?.content;
      
      const model = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        systemInstruction: systemInstruction || undefined,
        generationConfig: expectJson ? { responseMimeType: "application/json" } : {},
      });

      // Filter out system messages and map to Gemini format
      const rawHistory = messages
        .filter(m => m.role !== "system")
        .slice(0, -1) // All except the last message
        .map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }));

      // Gemini strictly requires history to start with 'user' and alternate 'user', 'model', 'user', 'model'
      const history = [];
      for (const msg of rawHistory) {
        if (history.length === 0 && msg.role === 'model') {
          // If the first message is model, prepend a dummy user message to satisfy Gemini
          history.push({ role: 'user', parts: [{ text: 'Hello' }] });
        }
        
        if (history.length > 0 && history[history.length - 1].role === msg.role) {
          // Merge consecutive messages of the same role
          history[history.length - 1].parts[0].text += '\\n\\n' + msg.parts[0].text;
        } else {
          history.push(msg);
        }
      }

      const lastMessage = messages[messages.length - 1].content;

      const chatSession = model.startChat({ history });
      const result = await chatSession.sendMessage(lastMessage);
      
      return result.response.text();
    } catch (error) {
      console.error(`Gemini Chat Error:`, error.message);
      throw new Error(`Failed to chat with AI`);
    }
  }
}

module.exports = OllamaService;
