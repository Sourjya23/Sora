const OllamaService = require("../utils/ollamaService");
const Lesson = require("../models/Lesson");

const LESSON_SYSTEM_PROMPT = `You are an expert programming tutor. Your job is to generate a structured, progressive lesson about the topic the user requests.

CRITICAL RULES:
- Stay STRICTLY on the requested topic. Do NOT discuss anything unrelated.
- Generate EXACTLY 4-5 sections that progressively increase in difficulty.
- Each section MUST have a practical code example and an exercise.
- Code examples must be correct, runnable, and well-commented.
- Exercises must be specific and testable (not vague).
- Use simple, beginner-friendly language.

You MUST respond with valid JSON in this exact format (no markdown, no backticks, just raw JSON):
{
  "title": "Learning <Topic>",
  "language": "javascript",
  "sections": [
    {
      "heading": "Section title",
      "explanation": "Clear explanation of the concept (2-3 paragraphs, use \\n for newlines)",
      "codeExample": "// Runnable code example\\nconsole.log('Hello');",
      "exercise": {
        "instructions": "What the user should code",
        "starterCode": "// Starter code with TODOs for the user to fill in",
        "hint": "A helpful hint"
      }
    }
  ]
}`;

const CHAT_SYSTEM_PROMPT = `You are an expert programming tutor having a conversation with a student who is learning a specific topic.

CRITICAL RULES:
CRITICAL RULES:
- Stay STRICTLY on the topic being discussed. Do NOT discuss anything unrelated (e.g., if learning React, do not discuss Go, TypeScript, Math, or general knowledge).
- If the student asks an off-topic or irrelevant question (like "What is 2+2?"), YOU MUST REFUSE TO ANSWER IT. Reply with exactly one short sentence redirecting them: "That is off-topic. Let's get back to learning [Topic]."
- NEVER generate large paragraphs. Keep your responses under 3 sentences maximum, unless you are writing code.
- If the student shares code, review it briefly and give specific feedback.
- Format your response as plain text with code blocks using triple backticks.`;

exports.generateLesson = async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({ message: "Topic is required" });
    }

    const prompt = `${LESSON_SYSTEM_PROMPT}\n\nGenerate a complete lesson about: "${topic.trim()}"\n\nRespond ONLY with the JSON object. No other text.`;
    
    // Call local Llama 3 and enforce JSON output
    let text = await OllamaService.generate("llama3", prompt, true);



    // Strip markdown code fences if present
    text = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    let lesson;
    try {
      lesson = JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse AI response:", text);
      return res.status(500).json({
        message: "AI returned invalid format. Please try again.",
        raw: text,
      });
    }

    // Save lesson to database
    const savedLesson = await Lesson.create({
      userId: req.user.id,
      topic: topic.trim(),
      language: lesson.language || "javascript",
      sections: lesson.sections,
    });

    res.status(200).json({ lesson, lessonId: savedLesson._id });
  } catch (error) {
    console.error("Generate lesson error:", error.message);
    if (error.status === 429 || error.message?.includes("429") || error.message?.includes("quota")) {
      return res.status(429).json({ message: "AI quota exceeded. Please wait a few minutes and try again, or upgrade your Gemini API plan." });
    }
    res.status(500).json({ message: "Failed to generate lesson", error: error.message });
  }
};

exports.chatWithAI = async (req, res) => {
  try {
    const { topic, messages, code } = req.body;

    if (!topic || !messages || messages.length === 0) {
      return res.status(400).json({ message: "Topic and messages are required" });
    }

    let systemContext = `${CHAT_SYSTEM_PROMPT}\n\nThe student is currently learning about: "${topic}".`;
    if (code) {
      systemContext += `\n\nThe student's current code:\n\`\`\`\n${code}\n\`\`\``;
    }

    const conversation = [
      { role: "system", content: systemContext },
      { role: "assistant", content: "Understood! I'm ready to help with " + topic + ". What would you like to know?" },
      ...messages.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      }))
    ];

    const responseText = await OllamaService.chat("llama3", conversation, false);

    res.status(200).json({ reply: responseText });
  } catch (error) {
    console.error("Chat with AI error:", error.message);
    if (error.status === 429 || error.message?.includes("429") || error.message?.includes("quota")) {
      return res.status(429).json({ message: "AI quota exceeded. Please wait a few minutes and try again." });
    }
    res.status(500).json({ message: "Failed to get AI response", error: error.message });
  }
};

exports.getLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find({ userId: req.user.id })
      .select("-sections")
      .sort({ createdAt: -1 });
    res.status(200).json(lessons);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch lessons" });
  }
};

exports.getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findOne({ _id: req.params.id, userId: req.user.id });
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    
    // Format to match the AI generation structure expected by frontend
    const formattedLesson = {
      title: `Learning ${lesson.topic}`,
      language: lesson.language,
      sections: lesson.sections
    };
    
    res.status(200).json({ lesson: formattedLesson, topic: lesson.topic });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch lesson" });
  }
};
