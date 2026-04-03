import React, { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";

interface AIInsightBoxProps {
  title?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function AIInsightBox({
  title = "AI Insights",
  children,
  defaultOpen = true,
}: AIInsightBoxProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-reddit rounded-lg bg-gray-900 overflow-hidden my-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2 text-reddit font-semibold">
          <Sparkles className="w-5 h-5" />
          {title}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="p-5 text-gray-200 text-sm leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}
