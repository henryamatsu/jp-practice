import { geminiEngine } from "@/lib/gemini-engine";

interface RequestBody {
  topic: string;
  difficulty: string;
  useJapanese: boolean;
  previousQuestions?: string[];
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { topic, difficulty, useJapanese, previousQuestions } = body;

    const { questions, actualTopic } = await geminiEngine.generateQuestions(
      topic,
      difficulty,
      useJapanese,
      previousQuestions
    );

    return Response.json({ questions, actualTopic });
  } catch (error) {
    console.error("Question generation API error:", error);
    return Response.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}
