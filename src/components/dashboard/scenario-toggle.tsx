"use client";

import { cn } from "@/lib/utils";
import type { Scenario } from "@/types";

interface ScenarioToggleProps {
  value: Scenario;
  onChange: (scenario: Scenario) => void;
}

const scenarios: { value: Scenario; label: string; description: string }[] = [
  { value: "conservative", label: "Conservative", description: "−20% income" },
  { value: "base", label: "Base", description: "Current plan" },
  { value: "optimistic", label: "Optimistic", description: "+20% income" },
];

export function ScenarioToggle({ value, onChange }: ScenarioToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg bg-muted p-1 text-sm">
      {scenarios.map((s) => (
        <button
          key={s.value}
          onClick={() => onChange(s.value)}
          className={cn(
            "px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer",
            value === s.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          title={s.description}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
