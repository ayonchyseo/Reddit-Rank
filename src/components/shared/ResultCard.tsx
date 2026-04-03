import React from "react";

interface ResultCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ResultCard({
  title,
  children,
  className = "",
}: ResultCardProps) {
  return (
    <div
      className={`bg-gray-900 border border-gray-800 rounded-xl overflow-hidden ${className}`}
    >
      <div className="px-5 py-4 border-b border-gray-800 bg-gray-900/50">
        <h3 className="font-semibold text-gray-100">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
