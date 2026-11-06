import { mkdir, readdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";

// Offline only. Never connects to Supabase, uploads, changes DB paths or deletes originals.
const [input, output] = process.argv.slice(2).map(value => path.resolve(value));
if (!input || !output || output === input || output.startsWith(input + path.sep)) {
  throw new Error("Usage: node scripts/prepare-webp.mjs INPUT_DIR NEW_OUTPUT_DIR (outside input)");
}
await mkdir(output); // Refuse an existing destination to protect previous backups.
const manifest = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const source = path.join(directory, entry.name);
    if (entry.isDirectory()) { await walk(source); continue; }
    if (!entry.isFile() || !/\.(png|jpe?g)$/i.test(entry.name)) continue;
    const relative = path.relative(input, source);
    const bytes = await readFile(source);
    const hash = createHash("sha256").update(bytes).digest("hex");
    const backup = path.join(output, "originals", relative);
    await mkdir(path.dirname(backup), { recursive: true });
    await copyFile(source, backup, constants.COPYFILE_EXCL);
    const row = { original: relative, sha256: hash, originalBytes: bytes.length, status: "original-only" };
    const metadata = await sharp(bytes, { animated: true }).metadata();
    if ((metadata.pages ?? 1) > 1) { manifest.push({...row, status:"skipped-animation"}); continue; }
    const converted = await sharp(bytes).rotate().resize({width:1920,height:1920,fit:"inside",withoutEnlargement:true}).webp({quality:82,alphaQuality:100}).toBuffer();
    const check = await sharp(converted).metadata();
    if (check.format !== "webp" || !check.width || !check.height) throw new Error("Invalid converted image");
    if (converted.length < bytes.length) {
      // Preserve extension in the candidate name so foo.png and foo.jpg never collide.
      const candidate = path.join("webp", relative + ".webp");
      await mkdir(path.dirname(path.join(output, candidate)), {recursive:true});
      await writeFile(path.join(output, candidate), converted, {flag:"wx"});
      Object.assign(row, {candidate, convertedBytes:converted.length, width:check.width, height:check.height, status:"review-required"});
    }
    manifest.push(row);
    await writeFile(path.join(output, "manifest.json"), JSON.stringify(manifest,null,2));
  }
}
await walk(input);
await writeFile(path.join(output, "manifest.json"), JSON.stringify(manifest,null,2));
console.log(`Prepared ${manifest.length} backed-up images. Review manifest and appearance before selecting any candidate.`);
