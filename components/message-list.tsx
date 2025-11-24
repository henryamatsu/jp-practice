"use client"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  return (
    <div className="space-y-4 max-w-2xl mx-auto w-full">
      {messages.map((message, index) => (
        <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-xs sm:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
              message.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            <p className="text-sm sm:text-base break-words whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
