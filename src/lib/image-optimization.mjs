import sharp from "sharp";

// Shared by offline preparation and authenticated uploads. Never performs I/O.
export async function prepareImage(bytes, maxEdge = 1920) {
  if (!Number.isInteger(maxEdge) || maxEdge < 320 || maxEdge > 3840) {
    throw new Error("Image edge must be between 320 and 3840 pixels");
  }
  const options = { limitInputPixels: 40_000_000, animated: true };
  const metadata = await sharp(bytes, options).metadata();
  if (!['png', 'jpeg', 'webp'].includes(metadata.format)) return null;
  // Do not silently turn an animated image into a still frame.
  if ((metadata.pages ?? 1) > 1) return null;
  const { data, info } = await sharp(bytes, options).rotate()
    .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 100 }).toBuffer({ resolveWithObject: true });
  if (data.length >= bytes.length) return null;
  return { data, width: info.width, height: info.height, originalWidth: metadata.width,
    originalHeight: metadata.height, originalBytes: bytes.length, savedBytes: bytes.length - data.length };
}
