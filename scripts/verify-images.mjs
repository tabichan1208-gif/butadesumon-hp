import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import sharp from "sharp";
import { prepareImage } from "../src/lib/image-optimization.mjs";

const root = await mkdtemp(tmpdir()+"/butadesumon-image-test-");
const input = root+"/input", output = root+"/output";
await mkdir(input);
const png = await sharp({create:{width:2600,height:1800,channels:4,background:{r:111,g:75,b:40,alpha:.6}}}).png().toBuffer();
const webp = await prepareImage(png);
assert.ok(webp && webp.data.length < png.length);
const meta = await sharp(webp.data).metadata();
assert.equal(meta.width,1920);assert.ok(meta.hasAlpha);assert.equal(meta.format,"webp");
const small = await sharp({create:{width:64,height:32,channels:3,background:"red"}}).png().toBuffer();
const smallCandidate = await prepareImage(small);
if(smallCandidate) {assert.equal(smallCandidate.width,64);assert.equal(smallCandidate.height,32);}
// Animated input stays animated by retaining its original; corrupt input is not accepted as a candidate.
const gif = await sharp({create:{width:8,height:16,channels:4,background:"red",pageHeight:8}}).gif().toBuffer();
assert.equal(await prepareImage(gif),null);
await assert.rejects(prepareImage(Buffer.from("invalid image")));
await assert.rejects(prepareImage(png,100));
await writeFile(input+"/large.png",png);await writeFile(input+"/small.png",small);
await writeFile(input+"/broken.png","broken");
const run = () => spawnSync(process.execPath,["scripts/prepare-webp.mjs",input,output],{encoding:"utf8"});
const result=run();assert.equal(result.status,0,result.stderr);
const manifest=JSON.parse(await readFile(output+"/manifest.json","utf8"));
assert.equal(manifest[0].original,"large.png");
assert.ok(manifest.find(row=>row.original==="broken.png").status.includes("failed"));
for(const row of manifest){
  const original=await readFile(input+"/"+row.original), backup=await readFile(output+"/originals/"+row.original);
  assert.deepEqual(backup,original);assert.equal(row.sha256,createHash("sha256").update(original).digest("hex"));
}
assert.notEqual(run().status,0,"existing backup must not be overwritten");
console.log("PASS: shared image conversion, smaller WebP, bounded size, alpha, no enlargement, unsupported/corrupt input, large-PNG priority, exact backup/hash, per-file failure recovery, overwrite refusal.");

// Exercise browser policy/fallbacks without network or a live browser.
const ts = await import("typescript");
const browserSource = await readFile("src/lib/browser-image.ts","utf8");
const js = ts.default.transpileModule(browserSource,{compilerOptions:{target:ts.default.ScriptTarget.ES2022,module:ts.default.ModuleKind.ES2022}}).outputText;
const {prepareBrowserImage}=await import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));
let closed=0,drawn=0;
globalThis.createImageBitmap=async()=>({width:2600,height:1800,close(){closed++}});
globalThis.document={createElement(){return {width:0,height:0,getContext(){return{drawImage(){drawn++}}},toBlob(callback,type){assert.equal(this.width,1920);callback(new Blob(["small"],{type}))}}}};
assert.ok(await prepareBrowserImage(new File([png],"photo.png",{type:"image/png"})));
assert.equal(closed,1);assert.equal(drawn,1);
const animated=new Uint8Array(20);new DataView(animated.buffer).setUint32(8,0);animated.set(Buffer.from("acTL"),12);
assert.equal(await prepareBrowserImage(new File([animated],"animated.png",{type:"image/png"})),null);
assert.equal(drawn,1,"APNG must not be flattened");
assert.equal(await prepareBrowserImage(new File([png],"photo.gif",{type:"image/gif"})),null);
globalThis.document={createElement(){throw new Error("unsupported canvas")}};
assert.equal(await prepareBrowserImage(new File([png],"photo.png",{type:"image/png"})),null);
assert.equal(closed,2,"failed conversion releases bitmap and falls back to original");
console.log("PASS: browser resize policy, APNG/unsupported-format preservation, conversion failure fallback, bitmap cleanup (mock browser APIs).");
