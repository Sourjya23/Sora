const axios = require("axios");

const OLLAMA_BASE_URL = "http://127.0.0.1:11434/api";

class OllamaService {
  /**
   * Generates a completion from an Ollama model.
   * @param {string} model - The model name (e.g., 'llama3', 'deepseek-coder')
   * @param {string} prompt - The prompt text
   * @param {boolean} expectJson - Whether to force JSON output format
   * @returns {Promise<string>} The generated response text
   */
  static async generate(model, prompt, expectJson = false, options = {}) {
    try {
      const payload = {
        model,
        prompt,
        stream: false,
      };

      if (expectJson) {
        payload.format = "json";
      }

      if (Object.keys(options).length > 0) {
        payload.options = options;
      }

      const response = await axios.post(`${OLLAMA_BASE_URL}/generate`, payload);
      return response.data.response;
    } catch (error) {
      console.error(`Ollama Generate Error (${model}):`, error.message);
      throw new Error(`Failed to generate response from local AI (${model})`);
    }
  }

  /**
   * Generates a chat response from an Ollama model.
   * @param {string} model - The model name
   * @param {Array<{role: string, content: string}>} messages - Chat history
   * @param {boolean} expectJson - Whether to force JSON output format
   * @returns {Promise<string>} The assistant's reply
   */
  static async chat(model, messages, expectJson = false, options = {}) {
    try {
      const payload = {
        model,
        messages,
        stream: false,
      };

      if (expectJson) {
        payload.format = "json";
      }

      if (Object.keys(options).length > 0) {
        payload.options = options;
      }

      const response = await axios.post(`${OLLAMA_BASE_URL}/chat`, payload);
      return response.data.message.content;
    } catch (error) {
      console.error(`Ollama Chat Error (${model}):`, error.message);
      throw new Error(`Failed to chat with local AI (${model})`);
    }
  }
}

module.exports = OllamaService;
