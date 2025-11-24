"use client"

import { useState } from "react"
import { ChatInterface } from "@/components/chat-interface"
import { TopicSelector } from "@/components/topic-selector"
import { DifficultySelector } from "@/components/difficulty-selector"
import { JapaneseToggle } from "@/components/japanese-toggle"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  const [chatStarted, setChatStarted] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState("random")
  const [selectedDifficulty, setSelectedDifficulty] = useState("elementary")
  const [useJapanese, setUseJapanese] = useState(false)

  const handleStartChat = () => {
    setChatStarted(true)
  }

  const handleRefresh = () => {
    setChatStarted(false)
    setSelectedTopic("random")
    setSelectedDifficulty("elementary")
    setUseJapanese(false)
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {!chatStarted ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Japanese Learner</h1>
              <p className="text-muted-foreground">Practice Japanese through conversation</p>
            </div>

            <TopicSelector selectedTopic={selectedTopic} onTopicChange={setSelectedTopic} />
            
            <DifficultySelector selectedDifficulty={selectedDifficulty} onDifficultyChange={setSelectedDifficulty} />
            
            <JapaneseToggle useJapanese={useJapanese} onToggle={setUseJapanese} />

            <button
              onClick={handleStartChat}
              className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Start Learning
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <ChatInterface topic={selectedTopic} difficulty={selectedDifficulty} useJapanese={useJapanese} onRefresh={handleRefresh} />
        </div>
      )}
    </main>
  )
}
