# Japanese Practice App

A Next.js application for practicing Japanese language skills through AI-powered conversations using Google's Gemini API.

## Features

- **Multiple Practice Topics**: Choose from various topics including greetings, daily life, numbers, food, directions, grammar, hiragana, and katakana
- **Difficulty Levels**: Select from Elementary, Middle School, High School, or College/Advanced levels to match your proficiency
- **Japanese Character Toggle**: Choose between romaji-only mode (default) or Japanese characters (hiragana/katakana/kanji)
- **Random Topic Selection**: Let the app randomly select a topic for varied practice
- **AI-Powered Conversations**: Uses Google's Gemini 2.5 Flash Lite model for natural language interactions
- **Adaptive Temperature**: High creativity for initial lessons (varied introductions), low temperature for teaching (consistent, accurate responses)
- **Smart Translation Practice**: When asking for translations, the AI won't show the answer in the question
- **Topic Display**: Current topic is always visible in the chat header
- **Dark/Light Mode**: Toggle between themes for comfortable viewing
- **Modern UI**: Built with Next.js, React, and Tailwind CSS

## Setup

### Prerequisites

- Node.js 18+ installed
- A Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the root directory:

```bash
GEMINI_API_KEY=your_api_key_here
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Architecture

### Key Components

- **`lib/gemini-engine.ts`**: Core Gemini AI integration class that handles:
  - API communication with Google's Gemini model
  - System instruction management
  - Random topic selection
  - Message format conversion

- **`lib/topics.json`**: Configuration file containing all practice topics and their specific instructions

- **`app/api/chat/route.ts`**: Next.js API route that handles chat requests

- **`components/chat-interface.tsx`**: Main chat UI component

- **`components/topic-selector.tsx`**: Topic selection dropdown

### How It Works

1. **Topic & Difficulty Configuration**: All topics and difficulty levels are defined in `lib/topics.json` with their names and specific instructions
2. **System Instructions**: A base system instruction is combined with difficulty-specific and topic-specific instructions
3. **Difficulty Levels**:
   - **Elementary**: Very simple vocabulary, basic sentence structures, hiragana with furigana support
   - **Middle School**: Intermediate vocabulary, more complex patterns, common kanji with readings
   - **High School**: Advanced vocabulary, complex grammar, more kanji and idiomatic expressions
   - **College/Advanced**: Sophisticated vocabulary, nuanced expressions, formal language, literary forms
4. **Random Topic**: When "Random" is selected, the engine picks a random topic from the available options
5. **Japanese Character Mode**:
   - **Romaji Mode (Default)**: All Japanese text is displayed in romaji (romanized Japanese)
   - **Japanese Mode**: Uses hiragana, katakana, and kanji appropriate for the difficulty level
6. **Adaptive Temperature**:
   - Initial lesson: Temperature 1.0 (high creativity for varied introductions)
   - Teaching responses: Temperature 0.3 (low creativity for consistent, accurate answers)
7. **Smart Teaching**:
   - No greetings - jumps straight into the lesson
   - When asking for translations, doesn't show the answer in the question
   - Corrects mistakes and suggests better alternatives
   - Stays on topic unless asked to change
8. **Message Flow**:
   - User selects a topic, difficulty level, character mode, and starts the chat
   - AI jumps directly into the first exercise/task
   - User sends messages which are processed by the Gemini API with consistent teaching responses
   - Conversation history is maintained (last 20 messages)
   - Current topic is displayed in the chat header

## Customization

### Adding New Topics

Edit `lib/topics.json` in the `topics` section:

```json
{
  "topics": {
    "your-topic": {
      "name": "Your Topic Name",
      "instruction": "Specific instructions for this topic..."
    }
  }
}
```

### Adding New Difficulty Levels

Edit `lib/topics.json` in the `difficulties` section:

```json
{
  "difficulties": {
    "your-level": {
      "name": "Your Level Name",
      "instruction": "Specific instructions for this difficulty level..."
    }
  }
}
```

### Changing the AI Model

Edit `lib/gemini-engine.ts` and change the `MODEL_CODE` property:

```typescript
MODEL_CODE = "gemini-2.5-flash-lite"; // Change to any supported Gemini model
```

### Adjusting Temperature

In `lib/gemini-engine.ts`, modify the temperature in the `generateResponse` method:

```typescript
config: {
  temperature: 0.7, // 0.0 = deterministic, 1.0 = creative
  systemInstruction,
}
```

## Tech Stack

- **Framework**: Next.js 16
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API via `@google/genai`
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React

## License

MIT

