import { Download, Loader2 } from "lucide-react";
import { useDownloadUrl } from "@/hooks/useDownloadUrl";

export default function DownloadButton({ className = "" }: { className?: string }) {
  const { download, loading } = useDownloadUrl();

  return (
    <button
      id="download"
      onClick={download}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all animate-pulse-glow ${
        loading ? "opacity-70 cursor-wait" : ""
      } ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Проверяем актуальную версию...
        </>
      ) : (
        <>
          <Download className="w-5 h-5" />
          Скачать клиент
        </>
      )}
    </button>
  );
}
