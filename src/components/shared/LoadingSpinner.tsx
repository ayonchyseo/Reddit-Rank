import { Loader2 } from "lucide-react";

export function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-gray-400">
      <Loader2 className="w-8 h-8 animate-spin text-reddit mb-4" />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="animate-pulse flex space-x-4 p-4 border-b border-gray-800">
      <div className="flex-1 space-y-4 py-1">
        <div className="h-4 bg-gray-800 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-800 rounded"></div>
          <div className="h-4 bg-gray-800 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
}
