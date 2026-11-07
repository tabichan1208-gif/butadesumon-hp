import http from "node:http";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import sharp from "sharp";

// All upstream reads/writes stay on a loopback mock. No production credentials.
const counts = {};
const uploads=[], assets=[];
let failVariant=false;
let question = "Before update", rpcMode = "success", rejectMutation = false;
const mock = http.createServer(async (req,res) => {
  const url = new URL(req.url, "http://localhost");
  const table = url.pathname.split("/").pop();
  counts[table] = (counts[table] ?? 0) + 1;
  res.setHeader("Content-Type", "application/json");
  if (url.pathname === "/auth/v1/user") return res.end(JSON.stringify({id:"test-user",aud:"authenticated",email:"test@example.invalid"}));
  if (req.method !== "GET") {
    if(url.pathname.startsWith("/storage/v1/object/site-media/")) {
      const chunks=[];for await(const chunk of req)chunks.push(chunk);
      const bytes=Buffer.concat(chunks), type=req.headers["content-type"];
      if(failVariant && type==="image/webp"){res.statusCode=500;return res.end(JSON.stringify({message:"mock conversion upload failure"}));}
      uploads.push({path:url.pathname.split("/site-media/")[1],bytes,type});
      return res.end(JSON.stringify({Key:url.pathname}));
    }
    if(table==="media_assets"){
      const chunks=[];for await(const chunk of req)chunks.push(chunk);
      assets.push(JSON.parse(Buffer.concat(chunks).toString()));return res.end("[]");
    }
    if (rejectMutation) {res.statusCode=403;return res.end(JSON.stringify({message:"denied"}));}
    if (table === "faqs") {
      const chunks=[];for await(const chunk of req)chunks.push(chunk);
      const payload=JSON.parse(Buffer.concat(chunks).toString());
      if(payload.question!=="After update"){res.statusCode=400;return res.end(JSON.stringify({message:"invalid mock FAQ payload"}));}
      question=payload.question;return res.end("[]");
    }
    if (table === "create_public_reservation") {
      if (rpcMode !== "success") {res.statusCode=400;return res.end(JSON.stringify({message:rpcMode}));}
      return res.end(JSON.stringify("test-reservation"));
    }
  }
  const data = {
    site_settings:[{id:true,store_name:"Test cafe",hero_image_path:"hero/test.png",hero_mobile_image_path:"hero/mobile.png",about_image_path:"about/test.png",exterior_image_path:"exterior/test.png"}],
    site_content:[],pigs:[{id:"pig",name:"Test pig",image_path:"pigs/test.png"}],
    faqs:[{id:"faq",question,answer:"Test answer"}],
    interior_photos:[{id:"interior",image_path:"interior/test.png",published:true,caption:"Test interior"}],
    pricing_settings:[],pricing_items:[],business_schedule:[{closed_weekdays:[1],open_time:"11:00:00",close_time:"18:00:00"}],business_exceptions:[],
    profiles:[{id:"test-user",role:"ADMIN",permissions:{}}],
  }[table] ?? [];
  res.end(JSON.stringify(req.headers.accept?.includes("vnd.pgrst.object") ? data[0] : data));
});
await new Promise(resolve=>mock.listen(0,"127.0.0.1",resolve));
const upstream=`http://127.0.0.1:${mock.address().port}`;
const env={...process.env,NEXT_PUBLIC_SUPABASE_URL:upstream,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"test-public-key",SUPABASE_SECRET_KEY:"test-secret-key"};
const next="node_modules/next/dist/bin/next";
async function build() {
  const child=spawn(process.execPath,[next,"build","--webpack"],{env,stdio:"pipe"});
  let output="";child.stdout.on("data",c=>output+=c);child.stderr.on("data",c=>output+=c);
  assert.equal(await new Promise(r=>child.on("exit",r)),0,output);
}
let app;
try {
  await build();
  const port=3317, origin=`http://localhost:${port}`;
  app=spawn(process.execPath,[next,"start","-p",String(port)],{env,stdio:"pipe"});
  let logs="";app.stdout.on("data",c=>logs+=c);app.stderr.on("data",c=>logs+=c);
  for(let i=0;i<100;i++){try{await fetch(origin+"/admin/login");break;}catch{await new Promise(r=>setTimeout(r,100));}}
  const first=await fetch(origin);assert.equal(first.status,200,logs);const html=await first.text();
  assert.ok(html.includes("Before update"));assert.ok(html.includes("/_next/image"));
  assert.ok(html.includes("hero%2Fmobile.png")||html.includes("hero%252Fmobile.png")||html.includes("mobile.png"));
  const reads=counts.site_settings;assert.equal(reads,1,"SEO and home must share a cold read");
  const again=await fetch(origin,{headers:{cookie:"unrelated=another-visitor"}});assert.equal(again.status,200);await again.text();
  assert.equal(counts.site_settings,reads,"repeat visitor must use cached public data");
  const admin=await fetch(origin+"/admin",{redirect:"manual"});assert.ok([307,308].includes(admin.status));assert.ok(admin.headers.get("location").includes("/admin/login"));
  const manifest=JSON.parse(await readFile(".next/server/server-reference-manifest.json","utf8"));
  const actionId=Object.entries(manifest.node).find(([,v])=>v.exportedName==="saveFaq")?.[0];assert.ok(actionId,"saveFaq action present");
  async function save(cookie="") {
    const form=new FormData();form.set("1_question","After update");form.set("1_answer","Answer");form.set("1_published","on");
    form.set("0",'["$K1"]');
    return fetch(origin,{method:"POST",headers:{"Next-Action":actionId,Origin:origin,cookie},body:form});
  }
  const before=counts.faqs;await (await save()).text();assert.equal(counts.faqs,before,"unauthenticated action must not mutate");
  const jwt=[{alg:"HS256",typ:"JWT"},{sub:"test-user",exp:Math.floor(Date.now()/1000)+3600,aud:"authenticated"}].map(v=>Buffer.from(JSON.stringify(v)).toString("base64url")).join(".")+".test";
  const session={access_token:jwt,refresh_token:"test-refresh",expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:"bearer",user:{id:"test-user"}};
  const cookie="sb-127-auth-token=base64-"+Buffer.from(JSON.stringify(session)).toString("base64url");
  rejectMutation=true;await (await save(cookie)).text();rejectMutation=false;
  await (await fetch(origin)).text();assert.equal(counts.site_settings,reads,"failed save must not invalidate");
  const saved=await save(cookie);const savedBody=await saved.text();assert.equal(saved.status,200,savedBody);assert.equal(question,"After update","authorized action must mutate mock");
  const updated=await (await fetch(origin)).text();assert.ok(updated.includes("After update"));assert.equal(counts.site_settings,reads+1,"successful save must invalidate");
  async function upload(png) {
    const uploadId=Object.entries(manifest.node).find(([,v])=>v.exportedName==="uploadLibraryImage")[0];
    const form=new FormData();form.append("1_images",new File([png],"test-large.png",{type:"image/png"}));
    form.set("0",'["$K1"]');
    const result=await fetch(origin,{method:"POST",headers:{"Next-Action":uploadId,Origin:origin,cookie},body:form});
    const uploadBody=await result.text();assert.equal(result.status,200);assert.ok(uploadBody.includes("ライブラリへ追加"),uploadBody);
  }
  const png=await sharp({create:{width:2600,height:1800,channels:4,background:{r:110,g:70,b:40,alpha:.6}}}).png().toBuffer();
  await upload(png);
  assert.equal(uploads.length,2);assert.equal(assets.length,2);
  assert.ok(uploads[0].bytes.includes(png),"original upload must preserve original bytes");
  assert.equal(uploads[1].type,"image/webp");
  assert.equal(assets[1].storage_path,assets[0].storage_path+".webp","variant points back to recoverable original");
  const optimized=await sharp(uploads[1].bytes).metadata();assert.equal(optimized.width,1920);assert.ok(optimized.hasAlpha);
  assert.equal(assets[0].size_bytes,png.length);assert.ok(assets[1].size_bytes<png.length);
  failVariant=true;await upload(png);failVariant=false;
  assert.equal(uploads.length,3);assert.equal(assets.length,3,"failed variant must still leave original registered");
  // The existing image-selection action must still accept saved originals.
  const chooseId=Object.entries(manifest.node).find(([,v])=>v.exportedName==="chooseSiteImage")[0];
  const chooseForm=new FormData();chooseForm.set("1_slot","hero");chooseForm.set("1_path",assets[0].storage_path);
  chooseForm.set("0",'["$K1"]');
  const chosen=await fetch(origin,{method:"POST",headers:{"Next-Action":chooseId,Origin:origin,cookie},body:chooseForm});assert.equal(chosen.status,200);assert.ok((await chosen.text()).includes("true"));
  async function reserve(overrides={}) {return fetch(origin+"/api/reservations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({p_reservation_date:"2030-01-08",p_start_time:"12:00",p_duration_minutes:30,...overrides})});}
  const scheduleReads=counts.business_schedule;
  assert.equal((await reserve()).status,200);assert.ok(counts.create_public_reservation);
  for(const code of ["CAPACITY","PARKING"]) {rpcMode=code;assert.equal((await reserve()).status,409);}rpcMode="success";
  assert.equal((await reserve({p_start_time:"18:00"})).status,400);
  assert.equal((await reserve({p_reservation_date:"2030-01-07"})).status,400);
  assert.equal(counts.business_schedule,scheduleReads+5,"every reservation must freshly check business schedule");
  console.log("PASS: production build, metadata dedupe, cross-visitor cache, optimized image URLs, anonymous admin redirect/action denial, failed save keeps cache, authenticated save invalidation, reservation success/capacity/parking/hours/closed-day with fresh checks. Original + optimized uploads, failed variant fallback, original re-selection. Mock upstream only.");
} finally {app?.kill();mock.close();}
