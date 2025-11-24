"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import topicsData from "@/lib/topics.json";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  topic: string;
  difficulty: string;
  useJapanese: boolean;
  onRefresh: () => void;
}

export function ChatInterface({
  topic,
  difficulty,
  useJapanese,
  onRefresh,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [actualTopic, setActualTopic] = useState<string>(topic);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get topic display name
  const getTopicName = () => {
    const topicConfig =
      topicsData.topics[actualTopic as keyof typeof topicsData.topics];
    return topicConfig?.name || actualTopic;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat with opening message from assistant
  useEffect(() => {
    if (!initialized) {
      initializeChat();
    }
  }, [initialized, topic]);

  const initializeChat = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [],
          topic,
          difficulty,
          useJapanese,
          isInitial: true,
        }),
      });

      const data = await response.json();
      if (data.message) {
        setMessages([{ role: "assistant", content: data.message }]);
      }
      if (data.actualTopic) {
        setActualTopic(data.actualTopic);
      }
      setInitialized(true);
    } catch (error) {
      console.error("[v0] Failed to initialize chat:", error);
      setInitialized(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message to history
    const updatedMessages: Message[] = [
      ...messages,
      { role: "user" as const, content: userMessage },
    ];
    setMessages(updatedMessages);

    // Keep only last 20 messages
    const recentMessages = updatedMessages.slice(-20);

    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: recentMessages,
          topic: actualTopic, // Use the resolved topic, not the original "random"
          difficulty,
          useJapanese,
        }),
      });

      const data = await response.json();
      if (data.message) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);
      }
      if (data.actualTopic) {
        setActualTopic(data.actualTopic);
      }
    } catch (error) {
      console.error("[v0] Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold truncate">Japanese Learner</h2>
          <p className="text-sm text-muted-foreground">{getTopicName()}</p>
        </div>
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          className="gap-2 bg-transparent"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} isLoading={isLoading} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background/95 backdrop-blur sticky bottom-0 p-4">
        <MessageInput
          input={input}
          setInput={setInput}
          onSubmit={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
