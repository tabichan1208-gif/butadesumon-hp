"use client";

import { useState } from "react";
import Link from "next/link";
import { mockReservations } from "@/lib/mock-data";

const menu = ["予約管理","サイト編集","こぶた紹介","よくある質問","画像ライブラリ","SEO設定"];

export function AdminDashboard() {
  const [active, setActive] = useState("予約管理");
  const totalGuests = mockReservations.reduce((sum,r)=>sum+r.guests,0);
  return <div className="admin-shell"><aside><div className="admin-brand"><span>MICRO PIG CAFE</span>豚ですもん。<small>管理画面</small></div><nav>{menu.map((m,i)=><button className={active===m?"active":""} onClick={()=>setActive(m)} key={m}><span>{["▦","✎","♡","?","▧","⌕"][i]}</span>{m}</button>)}</nav><Link href="/">← 公開サイトを見る</Link></aside><section className="admin-main"><header><div><p>2026年9月3日 木曜日</p><h1>{active}</h1></div><div className="admin-user"><span>豚</span><div><b>店舗管理者</b><small>admin@example.jp</small></div></div></header>{active==="予約管理"?<ReservationPanel totalGuests={totalGuests}/>:<EditorPlaceholder title={active}/>}</section></div>;
}

function ReservationPanel({totalGuests}:{totalGuests:number}) { return <><div className="admin-cards"><article><span>本日の予約</span><b>{mockReservations.length}<small>件</small></b><em>予約一覧を表示中</em></article><article><span>ご来店予定</span><b>{totalGuests}<small>名</small></b><em>定員は同時8名まで</em></article><article><span>駐車場予約</span><b>{mockReservations.filter(r=>r.parking).length}<small>件</small></b><em>重複なし</em></article><article><span>現在の店内人数</span><b>0<small>/ 8名</small></b><em>空きあり</em></article></div><div className="admin-panel"><div className="panel-head"><div><h2>9月3日の予約</h2><p>予約時間の重なりと店内人数を確認できます</p></div><button className="button">＋ 予約を追加</button></div><div className="date-strip">{[1,2,3,4,5,6,7].map((n)=><button className={n===3?"selected":""} key={n}><small>{["火","水","木","金","土","日","月"][n-1]}</small>{n}</button>)}</div><div className="reservation-list">{mockReservations.map(r=><article key={r.time}><time>{r.time}<small>{r.minutes}分</small></time><div className="res-main"><div><span className="source">{r.source}</span><h3>{r.name} 様</h3></div><p>ご来店人数 <b>{r.guests}名</b></p><p>駐車場 <b>{r.parking?"利用あり":"なし"}</b></p><button aria-label="メニュー">•••</button></div></article>)}</div></div></> }

function EditorPlaceholder({title}:{title:string}) { return <div className="admin-panel editor"><div><span className="editor-icon">✎</span><h2>{title}</h2><p>Supabase接続後、ここからコードを触らずに内容を編集できます。</p></div><div className="settings-preview"><label>ページ見出し<input defaultValue={title}/></label><label>表示設定<select><option>公開</option><option>非公開</option></select></label><label>説明文<textarea defaultValue="店舗の情報をここから編集できます。" rows={5}/></label><div><button className="button secondary">プレビュー</button><button className="button">変更を保存</button></div></div></div> }
