import { mkdir, readdir, readFile, writeFile, stat, realpath } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { prepareImage } from "../src/lib/image-optimization.mjs";

// Offline only. Never connects to Supabase or changes/deletes input files.
const [source, destination, edge = "1920"] = process.argv.slice(2);
const maxEdge = Number(edge);
if (!source || !destination || !Number.isInteger(maxEdge) || maxEdge < 320 || maxEdge > 3840) {
  throw new Error("Usage: node scripts/prepare-webp.mjs INPUT_DIR NEW_OUTPUT_DIR [MAX_EDGE:320..3840]");
}
const input = await realpath(source), output = path.resolve(destination);
if (output === input || output.startsWith(input + path.sep)) throw new Error("Output must be outside input");
await mkdir(output); // Refuse existing destinations to protect previous backups.
const files = [], manifest = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const source = path.join(directory, entry.name);
    if (entry.isDirectory()) { await walk(source); continue; }
    if (entry.isFile() && /\.(png|jpe?g|webp)$/i.test(entry.name)) {
      files.push({source, size:(await stat(source)).size, png:/\.png$/i.test(entry.name)});
    }
  }
}
await walk(input);
files.sort((a,b) => Number(b.png)-Number(a.png) || b.size-a.size || a.source.localeCompare(b.source));
for (const {source} of files) {
  const relative = path.relative(input, source);
  const bytes = await readFile(source);
  const hash = createHash("sha256").update(bytes).digest("hex");
  const backup = path.join(output, "originals", relative);
  await mkdir(path.dirname(backup), {recursive:true});
  await writeFile(backup, bytes, {flag:"wx"});
  const row = {original:relative, sha256:hash, originalBytes:bytes.length, maxEdge, status:"original-only"};
  try {
    const converted = await prepareImage(bytes, maxEdge);
    if (converted) {
      const candidate = path.join("webp", relative + ".webp");
      await mkdir(path.dirname(path.join(output, candidate)), {recursive:true});
      await writeFile(path.join(output, candidate), converted.data, {flag:"wx"});
      Object.assign(row, {candidate, convertedBytes:converted.data.length, savedBytes:converted.savedBytes,
        reductionPercent:Math.round(converted.savedBytes/bytes.length*1000)/10,
        originalWidth:converted.originalWidth,originalHeight:converted.originalHeight,
        width:converted.width,height:converted.height,status:"review-required"});
    }
  } catch {
    // Keep the verified source bytes; continue preparing other images.
    row.status = "conversion-failed-original-preserved";
  }
  manifest.push(row);
  await writeFile(path.join(output,"manifest.json"), JSON.stringify(manifest,null,2));
}
console.log(`Prepared ${manifest.length} backed-up images (large PNGs first). Review manifest and appearance before selecting any candidate.`);
