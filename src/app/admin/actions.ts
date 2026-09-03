"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: boolean; message: string };

async function getStaffClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: isStaff } = await supabase.rpc("is_staff");
  return isStaff ? supabase : null;
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function messageFor(error: string) {
  if (error.includes("CAPACITY_EXCEEDED")) return "同じ時間帯の店内人数が8名を超えるため保存できません。";
  if (error.includes("PARKING_UNAVAILABLE")) return "同じ時間帯に駐車場を利用する予約があります。";
  if (error.includes("INVALID_RESERVATION")) return "入力内容を確認してください。";
  if (error.includes("permission denied")) return "予約機能の権限設定を確認してください。";
  return "予約を保存できませんでした。もう一度お試しください。";
}

export async function saveReservation(formData: FormData): Promise<ActionResult> {
  const supabase = await getStaffClient();
  if (!supabase) return { ok: false, message: "ログインが切れました。再度ログインしてください。" };
  const { error } = await supabase.rpc("upsert_staff_reservation", {
    p_id: text(formData, "id") || null,
    p_reservation_date: text(formData, "reservation_date"), p_start_time: text(formData, "start_time"),
    p_duration_minutes: Number(formData.get("duration_minutes")), p_adults: Number(formData.get("adults")),
    p_children: Number(formData.get("children")), p_infants: Number(formData.get("infants")),
    p_parking: formData.get("parking") === "on", p_customer_name: text(formData, "customer_name"),
    p_phone: text(formData, "phone"), p_email: text(formData, "email") || null,
    p_note: text(formData, "note") || null, p_source: text(formData, "source"),
  });
  if (error) return { ok: false, message: messageFor(error.message) };
  revalidatePath("/admin");
  return { ok: true, message: "予約を保存しました。" };
}

export async function cancelReservation(id: string): Promise<ActionResult> {
  const supabase = await getStaffClient();
  if (!supabase) return { ok: false, message: "ログインが切れました。再度ログインしてください。" };
  const { error } = await supabase.from("reservations").update({ status: "CANCELLED" }).eq("id", id);
  if (error) return { ok: false, message: "予約をキャンセルできませんでした。" };
  revalidatePath("/admin");
  return { ok: true, message: "予約をキャンセルしました。" };
}

export async function saveSiteSettings(formData:FormData):Promise<ActionResult>{
  const supabase=await getStaffClient();
  if(!supabase)return{ok:false,message:"ログインが切れました。再度ログインしてください。"};
  const payload={
    store_name:text(formData,"store_name"),tagline:text(formData,"tagline"),business_hours:text(formData,"business_hours"),
    closed_days:text(formData,"closed_days"),address:text(formData,"address"),phone:text(formData,"phone")||null,
    map_url:text(formData,"map_url")||null,primary_color:text(formData,"primary_color"),background_color:text(formData,"background_color"),
    font_family:text(formData,"font_family"),base_font_size:Number(formData.get("base_font_size")),
    heading_font_family:text(formData,"heading_font_family"),heading_font_size:Number(formData.get("heading_font_size")),
    eyebrow_font_size:Number(formData.get("eyebrow_font_size")),
  };
  const{error}=await supabase.from("site_settings").update(payload).eq("id",true);
  if(error)return{ok:false,message:"店舗・デザイン設定を保存できませんでした。"};
  revalidatePath("/");revalidatePath("/admin");
  return{ok:true,message:"店舗・デザイン設定を保存しました。"};
}

export async function saveSiteCopy(formData:FormData):Promise<ActionResult>{
  const supabase=await getStaffClient();
  if(!supabase)return{ok:false,message:"ログインが切れました。再度ログインしてください。"};
  const keys=["hero","about","friends","guide_reservation","guide_parking","guide_access","reservation","footer"];
  const rows=keys.map((section_key,index)=>({section_key,heading:text(formData,`${section_key}_heading`),body:text(formData,`${section_key}_body`),sort_order:(index+1)*10,published:true}));
  const{error}=await supabase.from("site_content").upsert(rows,{onConflict:"section_key"});
  if(error)return{ok:false,message:"文章を保存できませんでした。"};
  revalidatePath("/");revalidatePath("/admin");
  return{ok:true,message:"サイトの文章を保存しました。"};
}

export async function uploadSiteImage(formData:FormData):Promise<ActionResult>{
  const supabase=await getStaffClient();
  if(!supabase)return{ok:false,message:"ログインが切れました。再度ログインしてください。"};
  const slot=text(formData,"slot");
  if(!["hero","about"].includes(slot))return{ok:false,message:"写真の場所を確認してください。"};
  const file=formData.get("image");
  if(!(file instanceof File)||file.size===0)return{ok:false,message:"写真を選択してください。"};
  if(!file.type.startsWith("image/")||file.size>8*1024*1024)return{ok:false,message:"8MB以下の画像を選択してください。"};
  const extension=(file.name.split(".").pop()||"jpg").replace(/[^a-zA-Z0-9]/g,"");
  const path=`${slot}/${Date.now()}.${extension}`;
  const{error:uploadError}=await supabase.storage.from("site-media").upload(path,file,{contentType:file.type,upsert:false});
  if(uploadError)return{ok:false,message:"写真をアップロードできませんでした。"};
  await supabase.from("media_assets").insert({storage_path:path,alt_text:file.name,mime_type:file.type,size_bytes:file.size});
  const column=slot==="hero"?"hero_image_path":"about_image_path";
  const{error}=await supabase.from("site_settings").update({[column]:path}).eq("id",true);
  if(error)return{ok:false,message:"写真の設定を保存できませんでした。"};
  revalidatePath("/");revalidatePath("/admin");
  return{ok:true,message:"写真を変更しました。"};
}

async function storeImage(supabase:Awaited<ReturnType<typeof createClient>>,file:File,folder:string){
  if(!file.type.startsWith("image/")||file.size>8*1024*1024)return{path:"",message:"8MB以下の画像を選択してください。"};
  const extension=(file.name.split(".").pop()||"jpg").replace(/[^a-zA-Z0-9]/g,"");
  const path=`${folder}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${extension}`;
  const{error}=await supabase.storage.from("site-media").upload(path,file,{contentType:file.type,upsert:false});
  if(error)return{path:"",message:"写真をアップロードできませんでした。"};
  await supabase.from("media_assets").insert({storage_path:path,alt_text:file.name,mime_type:file.type,size_bytes:file.size});
  return{path,message:""};
}

export async function savePig(formData:FormData):Promise<ActionResult>{
  const supabase=await getStaffClient();if(!supabase)return{ok:false,message:"ログインが切れました。再度ログインしてください。"};
  const id=text(formData,"id");let imagePath=text(formData,"image_path");const file=formData.get("image");
  if(file instanceof File&&file.size>0){const stored=await storeImage(supabase,file,"pigs");if(!stored.path)return{ok:false,message:stored.message};imagePath=stored.path}
  const payload={name:text(formData,"name"),breed:text(formData,"breed")||"マイクロブタ",bio:text(formData,"bio")||null,image_path:imagePath||null,sort_order:Number(formData.get("sort_order"))||0,published:formData.get("published")==="on"};
  const{error}=id?await supabase.from("pigs").update(payload).eq("id",id):await supabase.from("pigs").insert(payload);
  if(error)return{ok:false,message:"こぶた情報を保存できませんでした。"};revalidatePath("/");revalidatePath("/admin");return{ok:true,message:"こぶた情報を保存しました。"};
}

export async function saveFaq(formData:FormData):Promise<ActionResult>{
  const supabase=await getStaffClient();if(!supabase)return{ok:false,message:"ログインが切れました。再度ログインしてください。"};
  const id=text(formData,"id");const payload={question:text(formData,"question"),answer:text(formData,"answer"),sort_order:Number(formData.get("sort_order"))||0,published:formData.get("published")==="on"};
  const{error}=id?await supabase.from("faqs").update(payload).eq("id",id):await supabase.from("faqs").insert(payload);
  if(error)return{ok:false,message:"よくある質問を保存できませんでした。"};revalidatePath("/");revalidatePath("/admin");return{ok:true,message:"よくある質問を保存しました。"};
}

export async function uploadLibraryImage(formData:FormData):Promise<ActionResult>{
  const supabase=await getStaffClient();if(!supabase)return{ok:false,message:"ログインが切れました。再度ログインしてください。"};
  const files=formData.getAll("images").filter((item):item is File=>item instanceof File&&item.size>0);
  if(files.length===0)return{ok:false,message:"写真を選択してください。"};
  if(files.length>20)return{ok:false,message:"一度に追加できる写真は20枚までです。"};
  if(files.some(file=>!file.type.startsWith("image/")||file.size>8*1024*1024))return{ok:false,message:"1枚あたり8MB以下の画像を選択してください。"};
  const stored=await Promise.all(files.map(file=>storeImage(supabase,file,"library")));
  const failed=stored.find(item=>!item.path);if(failed)return{ok:false,message:failed.message};
  revalidatePath("/admin");return{ok:true,message:`${files.length}枚の画像をライブラリへ追加しました。`};
}

export async function chooseSiteImage(formData:FormData):Promise<ActionResult>{
  const supabase=await getStaffClient();if(!supabase)return{ok:false,message:"ログインが切れました。再度ログインしてください。"};
  const slot=text(formData,"slot"),path=text(formData,"path");if(!["hero","about"].includes(slot)||!path)return{ok:false,message:"写真と表示場所を選択してください。"};
  const column=slot==="hero"?"hero_image_path":"about_image_path";const{error}=await supabase.from("site_settings").update({[column]:path}).eq("id",true);
  if(error)return{ok:false,message:"写真を設定できませんでした。"};revalidatePath("/");revalidatePath("/admin");return{ok:true,message:"公開サイトの写真を変更しました。"};
}
