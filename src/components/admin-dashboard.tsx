"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cancelReservation, saveReservation } from "@/app/admin/actions";

const menu = ["予約管理","サイト編集","こぶた紹介","よくある質問","画像ライブラリ","SEO設定"];
const sourceLabels: Record<string,string> = { WEB:"WEB", PHONE:"電話", WALK_IN:"店頭", OTHER:"その他" };

export type AdminReservation = {
  id:string; date:string; time:string; minutes:number; name:string; phone:string; email:string; note:string;
  adults:number; children:number; infants:number; guests:number; parking:boolean; source:string; status:string;
};

function localDateString(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0,10);
}

export function AdminDashboard({reservations}:{reservations:AdminReservation[]}) {
  const [active,setActive]=useState("予約管理");
  const logout=async()=>{await createClient().auth.signOut();location.href="/admin/login"};
  return <div className="admin-shell"><aside><div className="admin-brand"><span>MICRO PIG CAFE</span>豚ですもん。<small>管理画面</small></div><nav>{menu.map((m,i)=><button className={active===m?"active":""} onClick={()=>setActive(m)} key={m}><span>{["▦","✎","♡","?","▧","⌕"][i]}</span>{m}</button>)}</nav><Link href="/">← 公開サイトを見る</Link><button className="logout" onClick={logout}>ログアウト</button></aside><section className="admin-main"><header><div><p>店舗運営</p><h1>{active}</h1></div><div className="admin-user"><span>豚</span><div><b>店舗管理者</b><small>ログイン中</small></div></div></header>{active==="予約管理"?<ReservationPanel reservations={reservations}/>:<EditorPlaceholder title={active}/>}</section></div>;
}

function ReservationPanel({reservations}:{reservations:AdminReservation[]}) {
  const router=useRouter();
  const [selectedDate,setSelectedDate]=useState(localDateString());
  const [editing,setEditing]=useState<AdminReservation|null|"new">(null);
  const [notice,setNotice]=useState("");
  const [pending,startTransition]=useTransition();
  const dayReservations=useMemo(()=>reservations.filter(r=>r.date===selectedDate),[reservations,selectedDate]);
  const activeReservations=useMemo(()=>dayReservations.filter(r=>r.status!=="CANCELLED"),[dayReservations]);
  const totalGuests=activeReservations.reduce((sum,r)=>sum+r.guests,0);
  const peak=useMemo(()=>Math.max(0,...timeline(activeReservations).map(slot=>slot.guests)),[activeReservations]);

  function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const data=new FormData(e.currentTarget);startTransition(async()=>{const result=await saveReservation(data);setNotice(result.message);if(result.ok){setEditing(null);router.refresh()}})}
  function cancel(id:string){if(!confirm("この予約をキャンセルしますか？"))return;startTransition(async()=>{const result=await cancelReservation(id);setNotice(result.message);if(result.ok){setEditing(null);router.refresh()}})}

  return <>
    <div className="reservation-toolbar"><label>表示する日<input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/></label><button className="button" onClick={()=>setEditing("new")}>＋ 予約を追加</button></div>
    {notice&&<p className="admin-notice">{notice}</p>}
    <div className="admin-cards"><article><span>予約</span><b>{activeReservations.length}<small>件</small></b><em>選択日の有効な予約</em></article><article><span>ご来店予定</span><b>{totalGuests}<small>名</small></b><em>延べ人数</em></article><article><span>最大同時人数</span><b>{peak}<small>/ 8名</small></b><em>{peak<8?"空きあり":"満員時間あり"}</em></article><article><span>駐車場予約</span><b>{activeReservations.filter(r=>r.parking).length}<small>件</small></b><em>時間の重複を自動防止</em></article></div>
    <div className="admin-reservation-layout"><div className="admin-panel"><div className="panel-head"><div><h2>{formatDate(selectedDate)}の予約</h2><p>キャンセル済みも履歴として残ります</p></div></div><div className="reservation-list">{dayReservations.length===0?<p className="empty-state">この日の予約はありません。</p>:dayReservations.map(r=><button className={`reservation-row${r.status==="CANCELLED"?" cancelled":""}`} key={r.id} onClick={()=>r.status!=="CANCELLED"&&setEditing(r)} disabled={r.status==="CANCELLED"}><time>{r.time}<small>{r.minutes}分</small></time><div className="res-main"><div><span className="source">{sourceLabels[r.source]??r.source}</span>{r.status==="CANCELLED"&&<span className="cancelled-label">キャンセル済み</span>}<h3>{r.name} 様</h3><small>{r.phone}</small></div><p>人数 <b>{r.guests}名</b></p><p>駐車場 <b>{r.parking?"あり":"なし"}</b></p><span>{r.status==="CANCELLED"?"":"›"}</span></div></button>)}</div></div><Timeline reservations={activeReservations}/></div>
    {editing&&<ReservationEditor reservation={editing==="new"?null:editing} date={selectedDate} pending={pending} onClose={()=>setEditing(null)} onSubmit={submit} onCancel={cancel}/>} 
  </>;
}

function ReservationEditor({reservation,date,pending,onClose,onSubmit,onCancel}:{reservation:AdminReservation|null;date:string;pending:boolean;onClose:()=>void;onSubmit:(e:FormEvent<HTMLFormElement>)=>void;onCancel:(id:string)=>void}) {
  return <div className="admin-modal" role="dialog" aria-modal="true" aria-label={reservation?"予約を編集":"予約を追加"}><form className="reservation-editor" onSubmit={onSubmit}><div className="editor-title"><div><p>{reservation?"予約内容の変更":"電話・店頭予約の登録"}</p><h2>{reservation?"予約を編集":"予約を追加"}</h2></div><button type="button" onClick={onClose} aria-label="閉じる">×</button></div><input type="hidden" name="id" value={reservation?.id??""}/><div className="editor-form-grid"><label>来店日<input name="reservation_date" type="date" defaultValue={reservation?.date??date} required/></label><label>開始時間<input name="start_time" type="time" step="900" defaultValue={reservation?.time??"10:00"} required/></label><label>利用時間<select name="duration_minutes" defaultValue={reservation?.minutes??30}>{[15,30,45,60].map(v=><option key={v} value={v}>{v}分</option>)}</select></label><label>受付経路<select name="source" defaultValue={reservation?.source??"PHONE"}><option value="WEB">WEB</option><option value="PHONE">電話</option><option value="WALK_IN">店頭</option><option value="OTHER">その他</option></select></label><label>13歳以上<input name="adults" type="number" min="0" max="8" defaultValue={reservation?.adults??1} required/></label><label>3〜12歳<input name="children" type="number" min="0" max="8" defaultValue={reservation?.children??0} required/></label><label>2歳以下<input name="infants" type="number" min="0" max="8" defaultValue={reservation?.infants??0} required/></label><label className="parking-check"><input name="parking" type="checkbox" defaultChecked={reservation?.parking??false}/> 駐車場を利用</label><label className="wide">お名前<input name="customer_name" defaultValue={reservation?.name??""} placeholder="例：安城 太郎" required/></label><label>電話番号<input name="phone" type="tel" defaultValue={reservation?.phone??""} required/></label><label>メール（任意）<input name="email" type="email" defaultValue={reservation?.email??""}/></label><label className="wide">備考<textarea name="note" rows={3} defaultValue={reservation?.note??""}/></label></div><div className="editor-actions">{reservation&&<button className="danger-button" type="button" disabled={pending} onClick={()=>onCancel(reservation.id)}>予約をキャンセル</button>}<button className="button secondary" type="button" onClick={onClose}>閉じる</button><button className="button" disabled={pending}>{pending?"保存中…":"保存する"}</button></div></form></div>;
}

function Timeline({reservations}:{reservations:AdminReservation[]}) { const slots=timeline(reservations);return <div className="admin-panel timeline-panel"><div className="panel-head"><div><h2>店内タイムライン</h2><p>15分ごとの同時人数と駐車場</p></div></div>{slots.length===0?<p className="empty-state">予約が入ると表示されます。</p>:<div className="timeline-list">{slots.map(s=><div key={s.time}><time>{s.time}</time><span className="occupancy"><i style={{width:`${Math.min(100,s.guests/8*100)}%`}}/></span><b>{s.guests}/8名</b><small>{s.parking?"🚗 使用中":"駐車場 空き"}</small></div>)}</div>}</div> }

function timeline(reservations:AdminReservation[]){if(!reservations.length)return[];const toMinutes=(t:string)=>{const[h,m]=t.split(":").map(Number);return h*60+m};const start=Math.min(...reservations.map(r=>toMinutes(r.time)));const end=Math.max(...reservations.map(r=>toMinutes(r.time)+r.minutes));const slots=[];for(let minute=Math.floor(start/15)*15;minute<end;minute+=15){const current=reservations.filter(r=>{const s=toMinutes(r.time);return s<=minute&&s+r.minutes>minute});slots.push({time:`${String(Math.floor(minute/60)).padStart(2,"0")}:${String(minute%60).padStart(2,"0")}`,guests:current.reduce((n,r)=>n+r.guests,0),parking:current.some(r=>r.parking)})}return slots}
function formatDate(value:string){const[y,m,d]=value.split("-");return `${y}年${Number(m)}月${Number(d)}日`}
function EditorPlaceholder({title}:{title:string}) { return <div className="admin-panel editor"><div><span className="editor-icon">✎</span><h2>{title}</h2><p>次の開発段階で、ここからコードを触らずに内容を編集できるようにします。</p></div><div className="settings-preview"><label>ページ見出し<input defaultValue={title}/></label><label>表示設定<select><option>公開</option><option>非公開</option></select></label><label>説明文<textarea defaultValue="店舗の情報をここから編集できます。" rows={5}/></label><div><button className="button secondary">プレビュー</button><button className="button">変更を保存</button></div></div></div> }
