"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { Button } from "@/components/ui/button";
import { RotateCcw, RefreshCw } from "lucide-react";
import topicsData from "@/lib/topics.json";

interface Message {
  role: "user" | "assistant";
  content: string;
  failed?: boolean;
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
  const [lastUserMessage, setLastUserMessage] = useState<string>("");
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
    setLastUserMessage(userMessage);

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
      } else {
        // Mark the last message as failed if no response
        setMessages((prev) => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = { ...updated[updated.length - 1], failed: true };
          }
          return updated;
        });
      }
      if (data.actualTopic) {
        setActualTopic(data.actualTopic);
      }
    } catch (error) {
      console.error("[v0] Failed to send message:", error);
      // Mark the last message as failed
      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = { ...updated[updated.length - 1], failed: true };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!lastUserMessage || isLoading) return;

    // Remove the failed message if it exists
    setMessages((prev) => {
      const filtered = prev.filter((msg) => !msg.failed);
      return filtered;
    });

    // Retry with the last user message
    const recentMessages = messages.filter((msg) => !msg.failed).slice(-20);

    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: recentMessages,
          topic: actualTopic,
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
      } else {
        // Mark as failed again
        setMessages((prev) => [
          ...prev,
          { role: "user", content: lastUserMessage, failed: true },
        ]);
      }
      if (data.actualTopic) {
        setActualTopic(data.actualTopic);
      }
    } catch (error) {
      console.error("[v0] Failed to retry message:", error);
      // Mark as failed again
      setMessages((prev) => [
        ...prev,
        { role: "user", content: lastUserMessage, failed: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full max-w-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur shrink-0">
        <div className="flex flex-col min-w-0 flex-1 mr-2">
          <h2 className="text-lg font-semibold truncate">Japanese Learner</h2>
          <p className="text-sm text-muted-foreground truncate">{getTopicName()}</p>
        </div>
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          className="gap-2 bg-transparent shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
        <MessageList messages={messages} isLoading={isLoading} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background/95 backdrop-blur sticky bottom-0 p-4 shrink-0">
        <div className="space-y-2 max-w-full">
          {lastUserMessage && messages.some((msg) => msg.failed) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <span>Failed to get response</span>
              <Button
                onClick={handleRetry}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="gap-2 shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </Button>
            </div>
          )}
          <MessageInput
            input={input}
            setInput={setInput}
            onSubmit={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
