"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import topicsData from "@/lib/topics.json";

const DIFFICULTIES = Object.entries(topicsData.difficulties).map(
  ([key, value]) => ({
    value: key,
    label: value.name,
  })
);

interface DifficultySelectorProps {
  selectedDifficulty: string;
  onDifficultyChange: (difficulty: string) => void;
}

export function DifficultySelector({
  selectedDifficulty,
  onDifficultyChange,
}: DifficultySelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select difficulty level:</label>
      <Select value={selectedDifficulty} onValueChange={onDifficultyChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DIFFICULTIES.map((difficulty) => (
            <SelectItem key={difficulty.value} value={difficulty.value}>
              {difficulty.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

