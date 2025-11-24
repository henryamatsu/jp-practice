"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

interface MessageInputProps {
  input: string
  setInput: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
}

export function MessageInput({ input, setInput, onSubmit, isLoading }: MessageInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e as any)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 w-full">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message... (Shift+Enter for new line)"
        className="flex-1 min-w-0 bg-background border border-input rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary max-h-24"
        rows={1}
        disabled={isLoading}
        style={{ fontSize: '16px' }}
      />
      <Button type="submit" disabled={isLoading || !input.trim()} size="sm" className="gap-2 shrink-0 w-full sm:w-auto">
        <Send className="w-4 h-4" />
        <span className="sm:hidden">Send</span>
      </Button>
    </form>
  )
}
