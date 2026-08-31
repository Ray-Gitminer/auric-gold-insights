import { useState, type RefObject } from "react";
import { ImageDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import { exportNodeAsPng, pngFilename } from "@/lib/export-image";

/** Exports the referenced section as a PNG for downstream image generation. */
export function ExportImageButton({
  targetRef,
  filePrefix,
  label,
  className,
}: {
  targetRef: RefObject<HTMLElement | null>;
  filePrefix: string;
  label?: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!targetRef.current) return;
        setBusy(true);
        setFailed(false);
        try {
          await exportNodeAsPng(targetRef.current, pngFilename(filePrefix));
        } catch {
          setFailed(true);
        } finally {
          setBusy(false);
        }
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60",
        failed && "border-negative/50 text-negative",
        className,
      )}
    >
      {busy ? (
        <Loader2 className="size-3 animate-spin" aria-hidden />
      ) : (
        <ImageDown className="size-3" aria-hidden />
      )}
      {failed ? t("export.failed") : (label ?? t("export.png"))}
    </button>
  );
}
