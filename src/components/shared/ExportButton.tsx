import { Download } from "lucide-react";

interface ExportButtonProps {
  data: any[];
  filename: string;
}

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]).join(",");
  const rows = data
    .map((row) =>
      Object.values(row)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButton({ data, filename }: ExportButtonProps) {
  return (
    <button
      onClick={() => exportToCSV(data, filename)}
      className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-md transition-colors border border-gray-700 text-sm font-medium"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </button>
  );
}
