"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface JapaneseToggleProps {
  useJapanese: boolean;
  onToggle: (value: boolean) => void;
}

export function JapaneseToggle({
  useJapanese,
  onToggle,
}: JapaneseToggleProps) {
  return (
    <div className="flex items-center justify-between space-x-2">
      <Label htmlFor="japanese-toggle" className="text-sm font-medium">
        Use Japanese characters (hiragana/katakana/kanji)
      </Label>
      <Switch
        id="japanese-toggle"
        checked={useJapanese}
        onCheckedChange={onToggle}
      />
    </div>
  );
}

