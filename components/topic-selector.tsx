"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import topicsData from "@/lib/topics.json"

const TOPICS = [
  { value: "random", label: "Random (Mixed)" },
  ...Object.entries(topicsData.topics).map(([key, value]) => ({
    value: key,
    label: value.name,
  })),
]

interface TopicSelectorProps {
  selectedTopic: string
  onTopicChange: (topic: string) => void
}

export function TopicSelector({ selectedTopic, onTopicChange }: TopicSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select a topic to study:</label>
      <Select value={selectedTopic} onValueChange={onTopicChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TOPICS.map((topic) => (
            <SelectItem key={topic.value} value={topic.value}>
              {topic.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
