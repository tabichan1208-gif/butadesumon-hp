"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

const durations = [15, 30, 45, 60];
const localDateString = (date=new Date()) => new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,10);

export function ReservationForm() {
  const [people, setPeople] = useState({ adults: 1, children: 0, infants: 0 });
  const [reservationDate, setReservationDate] = useState("");
  const [duration, setDuration] = useState(30);
  const [startTime, setStartTime] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);
  const total = useMemo(() => people.adults + people.children + people.infants, [people]);
  const timeOptions = useMemo(() => {
    const options=[];
    const now=new Date();
    const currentMinutes=now.getHours()*60+now.getMinutes();
    const earliest=reservationDate===localDateString(now)?Math.floor(currentMinutes/15)*15+15:11*60;
    for(let minute=Math.max(11*60,earliest);minute+duration<=18*60;minute+=15)options.push(`${String(Math.floor(minute/60)).padStart(2,"0")}:${String(minute%60).padStart(2,"0")}`);
    return options;
  },[duration,reservationDate]);
  const update = (key: keyof typeof people, value: number) => setPeople((p) => ({ ...p, [key]: Math.max(0, value) }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true); setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/reservations", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        p_reservation_date: data.get("date"), p_start_time: data.get("time"),
        p_duration_minutes: Number(data.get("duration")), p_adults: people.adults,
        p_children: people.children, p_infants: people.infants,
        p_parking: data.get("parking") === "yes", p_customer_name: data.get("name"),
        p_phone: data.get("phone"), p_email: data.get("email"), p_note: data.get("note"),
      }),
    }).catch(() => null);
    setSending(false);
    if (!response?.ok) {
      const result = await response?.json().catch(() => ({}));
      const code = String(result?.code ?? "");
      setError(code.includes("CAPACITY") ? "この時間は定員に達しています。開始時間・利用時間・人数のいずれかを変更してください。" : code.includes("PARKING") ? "この時間の駐車場は予約済みです。「利用しない」を選ぶか、開始時間を変更してください。" : code.includes("PAST_DATE") ? "過去の日付は予約できません。" : code.includes("PAST_TIME") ? "過ぎた時間は予約できません。現在時刻より後の時間をお選びください。" : code.includes("BUSINESS_HOURS")||code.includes("business_hours") ? "予約は11:00〜18:00の滞在時間内でお選びください。" : code.includes("INVALID") ? "入力内容に不備があります。来店日・時間・人数・お名前・電話番号をご確認ください。" : "通信エラーのため予約を送信できませんでした。入力内容は残っています。時間をおいて再度お試しください。");
      window.setTimeout(()=>errorRef.current?.scrollIntoView({behavior:"smooth",block:"center"}),0);
      return;
    }
    setSent(true);
  };

  if (sent) return <div className="success"><span>✓</span><h3>予約リクエストを受け付けました</h3><p>現在はデモ表示です。Supabase接続後に予約確定メールが送られます。</p><button className="button secondary" onClick={() => setSent(false)}>入力画面に戻る</button></div>;

  return <form className="booking-form" onSubmit={submit} onChange={()=>error&&setError("")}>
    {error&&<div className="reservation-error" ref={errorRef} role="alert" aria-live="assertive"><strong>予約できませんでした</strong><p>{error}</p></div>}
    <div className="form-grid">
      <label>来店日<input required type="date" name="date" min={localDateString()} value={reservationDate} onChange={event=>{setReservationDate(event.target.value);setStartTime("")}} /></label>
      <label>開始時間<select required name="time" value={startTime} onChange={event=>setStartTime(event.target.value)}><option value="" disabled>時間を選ぶ</option>{timeOptions.map(t => <option value={t} key={t}>{t}</option>)}</select><small>滞在終了が18:00以内の時刻を表示しています</small></label>
      <label>利用時間<select name="duration" value={duration} onChange={event=>{const next=Number(event.target.value);setDuration(next);if(startTime&&Number(startTime.slice(0,2))*60+Number(startTime.slice(3))+next>18*60)setStartTime("")}}>{durations.map(d => <option value={d} key={d}>{d}分</option>)}</select></label>
      <label>駐車場<select name="parking"><option value="no">利用しない</option><option value="yes">利用する（1台）</option></select></label>
    </div>
    <fieldset><legend>人数 <small>（合計 {total}名／最大8名）</small></legend><div className="people-grid">
      {([['adults','13歳以上'],['children','3〜12歳'],['infants','2歳以下']] as const).map(([key,label]) => <label key={key}>{label}<div className="counter"><button type="button" onClick={() => update(key, people[key]-1)}>−</button><b>{people[key]}</b><button type="button" onClick={() => update(key, people[key]+1)} disabled={total >= 8}>＋</button></div></label>)}
    </div></fieldset>
    <div className="form-grid">
      <label>お名前<input required name="name" placeholder="例：安城 太郎" /></label>
      <label>電話番号<input required name="phone" type="tel" placeholder="090-1234-5678" /></label>
      <label>メール（任意）<input name="email" type="email" placeholder="example@email.com" /></label>
      <label className="wide">備考<textarea name="note" rows={3} placeholder="ご質問や配慮が必要なことがあればご記入ください" /></label>
    </div>
    {total > 8 && <p className="error">同時入店人数は8名までです。</p>}
    <button className="button full" disabled={sending || total < 1 || total > 8}>{sending ? "空き状況を確認中…" : "空き状況を確認して予約する"}</button>
  </form>;
}
