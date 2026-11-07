// Browser-only: retain originals, avoid sending large files through Server Actions.
export async function prepareBrowserImage(file: File): Promise<Blob | null> {
  if (!["image/png", "image/jpeg"].includes(file.type)) return null;
  if (typeof createImageBitmap !== "function") return null;
  let bitmap: ImageBitmap | undefined;
  try {
    if (file.type === "image/png") {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const view = new DataView(bytes.buffer);
      // Skip APNG rather than flatten its animation. Walk chunks, not pixel data.
      for (let offset = 8; offset + 12 <= bytes.length;) {
        const length = view.getUint32(offset);
        const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
        if (type === "acTL") return null;
        offset += length + 12;
      }
    }
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    if (bitmap.width * bitmap.height > 40_000_000) return null;
    const ratio = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", .82));
    return blob?.type === "image/webp" && blob.size < file.size ? blob : null;
  } catch { return null; }
  finally { bitmap?.close(); }
}
