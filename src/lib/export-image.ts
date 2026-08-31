import { toPng } from "html-to-image";

/**
 * Rasterise a DOM subtree to a PNG and trigger a download. Used so any news
 * page section can be handed to an image-generation agent as a reference.
 */
export async function exportNodeAsPng(node: HTMLElement, filename: string): Promise<void> {
  const background =
    getComputedStyle(document.documentElement).getPropertyValue("--color-background").trim() ||
    "#06111F";

  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: background,
    style: { margin: "0" },
  });

  const link = document.createElement("a");
  link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  link.href = dataUrl;
  link.click();
}

export function pngFilename(prefix: string): string {
  return `${prefix}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "")}.png`;
}
