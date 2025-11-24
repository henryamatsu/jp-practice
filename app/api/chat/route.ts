import { geminiEngine } from "@/lib/gemini-engine";

interface RequestBody {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  topic: string;
  difficulty: string;
  useJapanese: boolean;
  isInitial?: boolean;
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { messages, topic, difficulty, useJapanese, isInitial } = body;

    const { text, actualTopic } = await geminiEngine.generateResponse(
      messages,
      topic,
      difficulty,
      useJapanese,
      isInitial
    );

    return Response.json({ message: text, actualTopic });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
