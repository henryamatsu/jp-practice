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
  const [questionQueue, setQuestionQueue] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [allQuestions, setAllQuestions] = useState<string[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewStartIndex, setReviewStartIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializingRef = useRef(false); // Prevent double initialization in StrictMode

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
    if (!initialized && !initializingRef.current) {
      initializeChat();
    }
  }, [initialized]); // Only depend on initialized to prevent double calls

  const initializeChat = async () => {
    // Prevent double initialization in React StrictMode
    if (initializingRef.current) {
      return;
    }
    initializingRef.current = true;

    setIsLoading(true);
    try {
      // Generate first set of 5 questions
      const questionsResponse = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          difficulty,
          useJapanese,
        }),
      });

      const questionsData = await questionsResponse.json();
      if (questionsData.questions && questionsData.questions.length === 5) {
        setQuestionQueue(questionsData.questions);
        setAllQuestions(questionsData.questions);
        setCurrentQuestionIndex(0);

        // Set the actual topic if it was random
        if (questionsData.actualTopic) {
          setActualTopic(questionsData.actualTopic);
        }

        // Present the first question
        setMessages([
          {
            role: "assistant",
            content: `Let's begin! Here's your first question:\n\n${questionsData.questions[0]}`,
          },
        ]);
      }

      setInitialized(true);
    } catch (error) {
      console.error("Failed to initialize chat:", error);
      setInitialized(true);
      initializingRef.current = false; // Reset on error so it can be retried
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || questionQueue.length === 0) return;

    const userMessage = input.trim();
    setInput("");
    setLastUserMessage(userMessage);

    // Add user message to history
    const updatedMessages: Message[] = [
      ...messages,
      { role: "user" as const, content: userMessage },
    ];
    setMessages(updatedMessages);

    setIsLoading(true);
    try {
      // Get correction for current question and determine next question
      const currentQuestion = questionQueue[currentQuestionIndex];
      const nextIndex = currentQuestionIndex + 1;

      let nextQuestion = "";
      let willNeedNewQuestions = false;

      if (nextIndex < questionQueue.length) {
        // Next question from current queue
        nextQuestion = questionQueue[nextIndex];
      } else if (isReviewMode) {
        // Will need to generate new questions after this
        willNeedNewQuestions = true;
        nextQuestion = "Please wait while we prepare new questions...";
      } else {
        // Will enter review mode after this
        nextQuestion = `Review time! Let's practice these again:\n\n${questionQueue[0]}`;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.slice(-6), // Keep last 3 exchanges for context
          topic: actualTopic,
          useJapanese,
          currentQuestion,
          nextQuestion,
        }),
      });

      const data = await response.json();

      if (data.message) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);

        // Update state based on what happens next
        if (nextIndex < questionQueue.length) {
          // Move to next question in queue
          setCurrentQuestionIndex(nextIndex);
        } else if (willNeedNewQuestions) {
          // Finished review, generate new questions
          setIsReviewMode(false);
          const questionsResponse = await fetch("/api/generate-questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topic: actualTopic,
              difficulty,
              useJapanese,
              previousQuestions: allQuestions,
            }),
          });

          const questionsData = await questionsResponse.json();
          if (questionsData.questions && questionsData.questions.length === 5) {
            setQuestionQueue(questionsData.questions);
            setAllQuestions([...allQuestions, ...questionsData.questions]);
            setCurrentQuestionIndex(0);

            // Update actualTopic if it changed (shouldn't normally, but just in case)
            if (questionsData.actualTopic) {
              setActualTopic(questionsData.actualTopic);
            }
          }
        } else {
          // Finished 5 new questions, enter review mode
          setIsReviewMode(true);
          const reviewQuestions = questionQueue; // The 5 questions we just completed
          setQuestionQueue(reviewQuestions);
          setReviewStartIndex(allQuestions.length - 5);
          setCurrentQuestionIndex(0);
        }
      } else {
        // Mark the last message as failed if no response
        setMessages((prev) => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              failed: true,
            };
          }
          return updated;
        });
      }

      if (data.actualTopic) {
        setActualTopic(data.actualTopic);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Mark the last message as failed
      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            failed: true,
          };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!lastUserMessage || isLoading || questionQueue.length === 0) return;

    // Remove the failed message if it exists
    setMessages((prev) => {
      const filtered = prev.filter((msg) => !msg.failed);
      return filtered;
    });

    // Retry with the last user message
    const recentMessages = messages.filter((msg) => !msg.failed).slice(-6);
    const currentQuestion = questionQueue[currentQuestionIndex];
    const nextIndex = currentQuestionIndex + 1;
    const nextQuestion =
      nextIndex < questionQueue.length
        ? questionQueue[nextIndex]
        : questionQueue[0];

    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: recentMessages,
          topic: actualTopic,
          useJapanese,
          currentQuestion,
          nextQuestion,
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
      console.error("Failed to retry message:", error);
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
        <div className="flex flex-col min-w-0 flex-1">
          <h2 className="text-lg font-semibold truncate">Japanese Learner</h2>
          <p className="text-sm text-muted-foreground truncate">
            {getTopicName()}
          </p>
        </div>
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
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="gap-2 w-full"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start New Session</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
