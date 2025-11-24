module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/lib/topics.json (json)", ((__turbopack_context__) => {

__turbopack_context__.v({"topics":{"greetings":{"name":"Greetings & Introductions","instruction":"Focus on common greetings, introductions, and polite phrases. Ask the student to translate or respond to greeting scenarios."},"daily-life":{"name":"Daily Life","instruction":"Focus on everyday vocabulary and common phrases. Have conversations about daily activities, common situations, and practical vocabulary. Ask the student to describe their day or respond to scenarios."},"numbers":{"name":"Numbers & Time","instruction":"Focus on numbers, counting, and time expressions. Practice counting in Japanese, asking about times, dates, and numerical quantities. Include both regular numbers and counter words."},"food":{"name":"Food & Dining","instruction":"Focus on food vocabulary and dining expressions. Teach food-related vocabulary, discuss favorite dishes, and practice restaurant scenarios and ordering."},"directions":{"name":"Directions & Locations","instruction":"Focus on directions and location vocabulary. Practice describing locations, giving directions, and using location-related vocabulary and particles like に, で, etc."},"grammar":{"name":"Grammar Practice","instruction":"Focus on grammar patterns and sentence structures. Practice specific grammar patterns, ask students to construct sentences, and explain grammar concepts clearly."},"hiragana":{"name":"Hiragana Practice","instruction":"Focus on hiragana practice. Practice reading and writing hiragana characters. Ask the student to read hiragana words or write them out phonetically."},"katakana":{"name":"Katakana Practice","instruction":"Focus on katakana practice. Practice reading and writing katakana characters. Include modern loanwords and focus on accurate pronunciation."}}});}),
"[project]/lib/gemini-engine.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "geminiEngine",
    ()=>geminiEngine
]);
(()=>{
    const e = new Error("Cannot find module '@google/genai'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$topics$2e$json__$28$json$29$__ = __turbopack_context__.i("[project]/lib/topics.json (json)");
;
;
const BASE_SYSTEM_INSTRUCTION = `You are a helpful Japanese language tutor. Engage the student in conversation to help them practice Japanese. 
Ask them to translate sentences, practice grammar, or have simple conversations. Be encouraging and provide explanations when asked.`;
class GeminiEngine {
    MODEL_CODE = "gemini-2.5-flash-lite";
    client;
    constructor(){
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY not set");
        this.client = new GoogleGenAI({
            apiKey
        });
    }
    /**
   * Get the system instruction for a given topic
   */ getSystemInstruction(topic) {
        // Handle random topic - will be selected by the caller
        if (topic === "random") {
            return BASE_SYSTEM_INSTRUCTION;
        }
        const topicConfig = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$topics$2e$json__$28$json$29$__["default"].topics[topic];
        if (!topicConfig) {
            return BASE_SYSTEM_INSTRUCTION;
        }
        return `${BASE_SYSTEM_INSTRUCTION}\n\n${topicConfig.instruction}`;
    }
    /**
   * Get a random topic (excluding 'random' itself)
   */ getRandomTopic() {
        const topics = Object.keys(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$topics$2e$json__$28$json$29$__["default"].topics);
        const randomIndex = Math.floor(Math.random() * topics.length);
        return topics[randomIndex];
    }
    /**
   * Convert message history to Gemini Content format
   */ convertMessagesToContents(messages) {
        return messages.map((msg)=>({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [
                    {
                        text: msg.content
                    }
                ]
            }));
    }
    /**
   * Generate a response from the model
   */ async generateResponse(messages, topic, isInitial = false) {
        // If topic is random, pick a random topic for this session
        const actualTopic = topic === "random" ? this.getRandomTopic() : topic;
        const systemInstruction = this.getSystemInstruction(actualTopic);
        let contents;
        if (isInitial) {
            // For initial message, start with a prompt to introduce the session
            contents = [
                {
                    role: "user",
                    parts: [
                        {
                            text: "Start a Japanese learning session. Give a brief greeting and introduce the first task or topic."
                        }
                    ]
                }
            ];
        } else {
            // Convert message history to Gemini format
            contents = this.convertMessagesToContents(messages);
        }
        const response = await this.client.models.generateContent({
            model: this.MODEL_CODE,
            contents,
            config: {
                temperature: 0.7,
                systemInstruction
            }
        });
        return response.text || "I'm sorry, I couldn't generate a response.";
    }
}
const geminiEngine = new GeminiEngine();
}),
"[project]/app/api/chat/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$gemini$2d$engine$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/gemini-engine.ts [app-route] (ecmascript)");
;
async function POST(request) {
    try {
        const body = await request.json();
        const { messages, topic, isInitial } = body;
        const text = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$gemini$2d$engine$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["geminiEngine"].generateResponse(messages, topic, isInitial);
        return Response.json({
            message: text
        });
    } catch (error) {
        console.error("Chat API error:", error);
        return Response.json({
            error: "Failed to generate response"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__78c70155._.js.map