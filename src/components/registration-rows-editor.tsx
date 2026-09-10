"use client";

import { useState } from "react";
import { registrationEntries, type RegistrationEntry } from "@/lib/animal-registrations";
import type { SiteSettings } from "@/lib/site-content";

export function RegistrationRowsEditor({settings}:{settings:SiteSettings}) {
  const [entries,setEntries] = useState<RegistrationEntry[]>(()=> {
    const saved=registrationEntries(settings);
    return saved.length ? saved : [{type:"",number:""}];
  });
  function change(index:number, field:keyof RegistrationEntry, value:string) {
    setEntries(rows=>rows.map((row,i)=>i===index?{...row,[field]:value}:row));
  }
  return <fieldset className="registration-rows wide">
    <legend>種別ごとの登録番号</legend>
    <p>「展示」と「販売」は別々の行に入力してください。登録日・有効期間・責任者は下の共通欄を使用します。</p>
    <input type="hidden" name="animal_registrations" value={JSON.stringify(entries)}/>
    {entries.map((entry,index)=><div className="registration-edit-row" key={index}>
      <label>種別（{index+1}）<input value={entry.type} maxLength={100} placeholder="例：展示" onChange={event=>change(index,"type",event.target.value)}/></label>
      <label>登録番号（{index+1}）<input value={entry.number} maxLength={200} placeholder="登録証どおりに入力" onChange={event=>change(index,"number",event.target.value)}/></label>
      <button type="button" className="media-delete" aria-label={`登録番号の${index+1}行目を削除`} onClick={()=>{
        if((entry.type||entry.number)&&!window.confirm("この登録番号の行を削除しますか？変更を保存するまで公開内容は変わりません。"))return;
        setEntries(rows=>rows.filter((_,i)=>i!==index));
      }}>行を削除</button>
    </div>)}
    <button type="button" className="library-select" disabled={entries.length>=20} onClick={()=>setEntries(rows=>[...rows,{type:"",number:""}])}>＋ 種別を追加</button>
  </fieldset>;
}
