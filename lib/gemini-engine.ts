import {
  GoogleGenAI,
  Content,
  FunctionDeclaration,
  Type,
  FunctionCallingConfigMode,
} from "@google/genai";
import topicsData from "./topics.json";
import {
  CORRECTION_INSTRUCTION,
  QUESTION_GENERATION_INSTRUCTION,
  LANGUAGE_DISPLAY_JAPANESE,
  LANGUAGE_DISPLAY_ROMAJI,
} from "./prompts";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const generateQuestionsDeclaration: FunctionDeclaration = {
  name: "generateQuestions",
  parameters: {
    type: Type.OBJECT,
    description: "Generate 5 practice questions for the student to answer.",
    properties: {
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
        },
        description: "An array of exactly 5 practice questions",
      },
    },
    required: ["questions"],
  },
};

class GeminiEngine {
  MODEL_CODE = "gemini-2.5-flash-lite";
  client: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");
    this.client = new GoogleGenAI({ apiKey });
  }

  /**
   * Get the system instruction for corrections (0 temperature)
   * This is ONLY for providing feedback, NOT for generating questions
   */
  getCorrectionSystemInstruction(topic: string, useJapanese: boolean): string {
    let instruction = CORRECTION_INSTRUCTION;

    // Add Japanese text preference
    instruction += useJapanese
      ? LANGUAGE_DISPLAY_JAPANESE
      : LANGUAGE_DISPLAY_ROMAJI;

    // Handle random topic - will be selected by the caller
    if (topic === "random") {
      return instruction;
    }

    // Add topic-specific instruction - THIS IS WHERE "Give English sentences..." comes from
    // const topicConfig =
    //   topicsData.topics[topic as keyof typeof topicsData.topics];
    // if (topicConfig) {
    //   instruction += `\n\nTopic Focus: ${topicConfig.instruction}`;
    // }

    return instruction;
  }

  /**
   * Get the system instruction for question generation (high temperature)
   * This is ONLY for generating questions, NOT for corrections
   */
  getQuestionGenerationInstruction(
    topic: string,
    difficulty: string,
    useJapanese: boolean
  ): string {
    let instruction = QUESTION_GENERATION_INSTRUCTION;

    // Add Japanese text preference
    instruction += useJapanese
      ? LANGUAGE_DISPLAY_JAPANESE
      : LANGUAGE_DISPLAY_ROMAJI;

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

    // Add topic-specific instruction - THIS IS WHERE "Give English sentences..." comes from
    const topicConfig =
      topicsData.topics[topic as keyof typeof topicsData.topics];
    if (topicConfig) {
      instruction += `\n\nTopic Focus: ${topicConfig.instruction}`;
    }

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
   * Generate 5 new questions using high temperature
   * Returns both questions and the actual topic used
   */
  async generateQuestions(
    topic: string,
    difficulty: string,
    useJapanese: boolean,
    previousQuestions?: string[]
  ): Promise<{ questions: string[]; actualTopic: string }> {
    const actualTopic = topic === "random" ? this.getRandomTopic() : topic;
    const systemInstruction = this.getQuestionGenerationInstruction(
      actualTopic,
      difficulty,
      useJapanese
    );

    let prompt = "Generate 5 new practice questions for the student.";
    if (previousQuestions && previousQuestions.length > 0) {
      prompt += `\n\nPrevious questions to avoid repeating:\n${previousQuestions.join(
        "\n"
      )}`;
    }

    const response = await this.client.models.generateContent({
      model: this.MODEL_CODE,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      config: {
        temperature: 1, // High temperature for diversity
        systemInstruction,
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.AUTO,
          },
        },
        tools: [
          {
            functionDeclarations: [generateQuestionsDeclaration],
          },
        ],
      },
    });

    // Extract questions from function call
    const functionCall = response.functionCalls?.[0];
    if (functionCall && functionCall.name === "generateQuestions") {
      const questions = functionCall.args?.questions as string[];
      if (questions && Array.isArray(questions) && questions.length === 5) {
        console.log("=== GENERATED QUESTIONS ===");
        console.log(questions);
        console.log("===========================");
        return { questions, actualTopic };
      }
    }

    // Fallback: parse from text if function calling didn't work
    console.warn("Function calling failed, falling back to text parsing");
    const questions = this.fallbackQuestionParsing(response.text || "");
    return { questions, actualTopic };
  }

  /**
   * Fallback method to parse questions from text response
   */
  private fallbackQuestionParsing(text: string): string[] {
    // Try to extract questions from numbered list or JSON
    const questions: string[] = [];

    // Try JSON first
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 5);
        }
      }
    } catch (e) {
      // Continue to next parsing method
    }

    // Try numbered list
    const lines = text.split("\n");
    for (const line of lines) {
      const match = line.match(/^\d+[\.\)]\s*(.+)$/);
      if (match && match[1]) {
        questions.push(match[1].trim());
        if (questions.length === 5) break;
      }
    }

    // If we got 5 questions, return them
    if (questions.length === 5) {
      return questions;
    }

    // Last resort: generate generic questions
    console.error("Failed to parse questions, using fallback");
    return [
      "Translate this to Japanese: I eat breakfast.",
      "Translate this to Japanese: Where is the station?",
      "Translate this to Japanese: I like reading books.",
      "Translate this to Japanese: What time is it?",
      "Translate this to Japanese: Thank you very much.",
    ];
  }

  /**
   * Generate a response from the model (corrections only, 0 temperature)
   * Returns both the text response and the actual topic used (useful when topic is "random")
   */
  async generateResponse(
    messages: Message[],
    topic: string,
    useJapanese: boolean,
    currentQuestion: string,
    nextQuestion: string
  ): Promise<{ text: string; actualTopic: string }> {
    // If topic is random, pick a random topic for this session
    const actualTopic = topic === "random" ? this.getRandomTopic() : topic;
    const systemInstruction = this.getCorrectionSystemInstruction(
      actualTopic,
      useJapanese
    );
    console.log("=== SYSTEM INSTRUCTION ===");
    console.log(systemInstruction);
    console.log("===========================");

    // Convert message history to Gemini format
    const contents = this.convertMessagesToContents(messages);

    // Add context about the current question and tell it what to ask next
    const lastContent = contents[contents.length - 1];
    if (
      lastContent &&
      lastContent.role === "user" &&
      lastContent.parts &&
      lastContent.parts[0]
    ) {
      lastContent.parts[0].text = `Current question: ${currentQuestion}\n\nStudent's answer: ${lastContent.parts[0].text}\n\nAfter providing feedback, ask this next question: ${nextQuestion}`;
    }

    const response = await this.client.models.generateContent({
      model: this.MODEL_CODE,
      contents,
      config: {
        temperature: 0, // Always 0 for corrections
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
