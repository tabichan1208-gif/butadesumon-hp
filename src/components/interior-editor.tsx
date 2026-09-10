"use client";

import Image from "next/image";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveInteriorPhoto, removeInteriorPhoto } from "@/app/admin/actions";
import type { InteriorPhoto } from "@/lib/interior";
import type { AdminMedia } from "./admin-dashboard";
import { publicImageUrl } from "@/lib/site-content";

export function InteriorEditor({photos,media,loadError}:{photos:InteriorPhoto[];media:AdminMedia[];loadError:boolean}) {
  const [notice,setNotice]=useState("");
  const [pending,startTransition]=useTransition();
  const [resetKey,setResetKey]=useState(0);
  const router=useRouter();
  function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const data=new FormData(event.currentTarget);
    startTransition(async()=>{try{
      const result=await saveInteriorPhoto(data);setNotice(result.message);
      if(result.ok){if(!data.get("id"))setResetKey(key=>key+1);router.refresh();}
    }catch{setNotice("保存できませんでした。入力内容を残していますので、再度お試しください。");}});
  }
  function remove(id:string){
    if(!window.confirm("この店内写真の掲載を解除しますか？画像ライブラリの元写真は残ります。"))return;
    startTransition(async()=>{try{const result=await removeInteriorPhoto(id);setNotice(result.message);if(result.ok)router.refresh();}catch{setNotice("掲載を解除できませんでした。");}});
  }
  return <section className="admin-panel interior-editor">
    <div className="panel-head"><div><h2>店内のようす</h2><p>枚数は自由。公開写真が0枚の場合はコーナーを表示しません。</p><p>写真の目安：横長4:3・1600×1200px。表示順の数字が小さい順に並びます。</p></div></div>
    {notice&&<p role="status" className="admin-notice">{notice}</p>}
    {loadError?<p role="alert">店内写真を読み込めませんでした。店内写真用のSQLを適用して画面を更新してください。</p>:<div className="cms-stack">
      <PhotoForm key={resetKey} media={media} pending={pending} onSubmit={save} nextOrder={Math.max(0,...photos.map(p=>p.sort_order))+10}/>
      {photos.map(photo=><PhotoForm key={photo.id} photo={photo} media={media} pending={pending} onSubmit={save} onRemove={()=>remove(photo.id)}/>)}
    </div>}
  </section>;
}

function PhotoForm({photo,media,pending,onSubmit,onRemove,nextOrder=0}:{photo?:InteriorPhoto;media:AdminMedia[];pending:boolean;onSubmit:(e:FormEvent<HTMLFormElement>)=>void;onRemove?:()=>void;nextOrder?:number}){
  const [path,setPath]=useState(photo?.image_path??"");
  const [choosing,setChoosing]=useState(false);
  return <form className="interior-edit-card" onSubmit={onSubmit}>
    <h3>{photo?"掲載写真を編集":"写真を追加"}</h3>
    <input type="hidden" name="id" value={photo?.id??""}/><input type="hidden" name="image_path" value={path}/>
    {path&&<div className="interior-edit-preview"><Image src={publicImageUrl(path)} alt="選択中の店内写真" fill unoptimized sizes="300px"/></div>}
    <button type="button" className="library-select" disabled={pending} onClick={()=>setChoosing(!choosing)} aria-expanded={choosing}>{choosing?"写真選択を閉じる":"画像ライブラリから選ぶ"}</button>
    {choosing&&<div className="picker-grid interior-picker">{media.length?media.map(item=><button type="button" className="picker-button" key={item.id} disabled={pending} onClick={()=>{setPath(item.storage_path);setChoosing(false);}}><span style={{backgroundImage:`url(${publicImageUrl(item.storage_path)})`}}/><small>{item.alt_text||"登録画像"}</small></button>):<p>先に画像ライブラリへ写真を追加してください。</p>}</div>}
    <label>写真の説明（任意・改行可）<textarea name="caption" rows={2} maxLength={500} defaultValue={photo?.caption??""}/></label>
    <label>表示順<input name="sort_order" type="number" step={1} min={-1000000} max={1000000} defaultValue={photo?.sort_order??nextOrder} required/></label>
    <label><input name="published" type="checkbox" defaultChecked={photo?.published??true}/> 公開する</label>
    <div className="interior-edit-actions"><button className="button" disabled={pending||!path}>{pending?"処理中…":photo?"変更を保存":"追加して保存"}</button>{onRemove&&<button type="button" className="media-delete" disabled={pending} onClick={onRemove}>掲載を解除</button>}</div>
  </form>;
}
