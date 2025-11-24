import { GoogleGenAI, Content } from "@google/genai";
import topicsData from "./topics.json";

const BASE_SYSTEM_INSTRUCTION = `You are a helpful Japanese language tutor. You will walk the student through topic-based exercises.

After the student provides their answer for the exercise:
- Tell them if they got it right or wrong
- If wrong, explain what was incorrect
- Provide the correct answer
- Suggest alternative or more natural ways to say it when appropriate
- If the user responded with English or with a loanword, make sure to give them native Japanese words to use instead except where the loanword is the most natural way to say it.
- At the end of each of your messages, continue with another exercise. Keep it closely related to the topic

Be brief and concise in your corrections and explanations.`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

class GeminiEngine {
  MODEL_CODE = "gemini-2.5-flash-lite";
  client: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");
    this.client = new GoogleGenAI({ apiKey });
  }

  /**
   * Get the system instruction for a given topic, difficulty, and Japanese usage preference
   */
  getSystemInstruction(
    topic: string,
    difficulty: string,
    useJapanese: boolean
  ): string {
    let instruction = BASE_SYSTEM_INSTRUCTION;

    // Add Japanese text preference
    if (useJapanese) {
      instruction += `\n\nLanguage Display: Use Japanese characters (hiragana, katakana, and kanji as appropriate for the difficulty level). Include romaji in parentheses when helpful.`;
    } else {
      instruction += `\n\nLanguage Display: Use ONLY romaji (romanized Japanese). Do NOT use any Japanese characters (hiragana, katakana, or kanji). All Japanese text must be written in romaji.`;
    }

    // Add difficulty-specific instruction
    const difficultyConfig =
      topicsData.difficulties[
        difficulty as keyof typeof topicsData.difficulties
      ];
    if (difficultyConfig) {
      instruction += `\n\nDifficulty Level: ${difficultyConfig.instruction}`;
    }

    // Handle random topic - will be selected by the caller
    if (topic === "random") {
      return instruction;
    }

    // Add topic-specific instruction
    const topicConfig =
      topicsData.topics[topic as keyof typeof topicsData.topics];
    if (topicConfig) {
      instruction += `\n\nTopic Focus: ${topicConfig.instruction}`;
    }

    // Important instruction about not giving away answers
    instruction += `\n\nIMPORTANT: When asking the student to translate a Japanese sentence or phrase, do NOT provide the English translation in your question. Only show the Japanese/romaji that they need to translate. Wait for their answer before providing the correct translation.`;

    // Log the full system instruction for debugging
    console.log("=== SYSTEM INSTRUCTION ===");
    console.log(instruction);
    console.log("=========================");

    return instruction;
  }

  /**
   * Get a random topic (excluding 'random' itself)
   */
  getRandomTopic(): string {
    const topics = Object.keys(topicsData.topics);
    const randomIndex = Math.floor(Math.random() * topics.length);
    return topics[randomIndex];
  }

  /**
   * Convert message history to Gemini Content format
   */
  convertMessagesToContents(messages: Message[]): Content[] {
    return messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));
  }

  /**
   * Generate a response from the model
   * Returns both the text response and the actual topic used (useful when topic is "random")
   */
  async generateResponse(
    messages: Message[],
    topic: string,
    difficulty: string,
    useJapanese: boolean,
    isInitial: boolean = false
  ): Promise<{ text: string; actualTopic: string }> {
    // If topic is random, pick a random topic for this session
    const actualTopic = topic === "random" ? this.getRandomTopic() : topic;
    const systemInstruction = this.getSystemInstruction(
      actualTopic,
      difficulty,
      useJapanese
    );

    let contents: Content[];
    // Use higher temperature for initial greeting (more variety)
    // Use lower temperature for teaching responses (more consistent/accurate)
    const temperature = isInitial ? 1.0 : 0;

    if (isInitial) {
      // For initial message, start directly with the lesson (no greeting)
      contents = [
        {
          role: "user",
          parts: [
            {
              text: "Start the Japanese learning session. Skip any greetings or introductions. Jump directly into the first exercise, question, or task for this topic.",
            },
          ],
        },
      ];
    } else {
      // Convert message history to Gemini format
      contents = this.convertMessagesToContents(messages);
    }

    const response = await this.client.models.generateContent({
      model: this.MODEL_CODE,
      contents,
      config: {
        temperature,
        systemInstruction,
      },
    });

    return {
      text: response.text || "I'm sorry, I couldn't generate a response.",
      actualTopic,
    };
  }
}

export const geminiEngine = new GeminiEngine();
