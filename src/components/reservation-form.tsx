"use client";

import { FormEvent, useMemo, useState } from "react";

const durations = [15, 30, 45, 60];

export function ReservationForm() {
  const [people, setPeople] = useState({ adults: 1, children: 0, infants: 0 });
  const [sent, setSent] = useState(false);
  const total = useMemo(() => people.adults + people.children + people.infants, [people]);
  const update = (key: keyof typeof people, value: number) => setPeople((p) => ({ ...p, [key]: Math.max(0, value) }));
  const submit = (event: FormEvent) => { event.preventDefault(); setSent(true); };

  if (sent) return <div className="success"><span>✓</span><h3>予約リクエストを受け付けました</h3><p>現在はデモ表示です。Supabase接続後に予約確定メールが送られます。</p><button className="button secondary" onClick={() => setSent(false)}>入力画面に戻る</button></div>;

  return <form className="booking-form" onSubmit={submit}>
    <div className="form-grid">
      <label>来店日<input required type="date" /></label>
      <label>開始時間<select required defaultValue=""><option value="" disabled>時間を選ぶ</option>{["10:00","10:15","10:30","11:00","13:00","14:00","15:00","16:00"].map(t => <option key={t}>{t}</option>)}</select></label>
      <label>利用時間<select defaultValue="30">{durations.map(d => <option value={d} key={d}>{d}分</option>)}</select></label>
      <label>駐車場<select><option value="no">利用しない</option><option value="yes">利用する（1台）</option></select></label>
    </div>
    <fieldset><legend>人数 <small>（合計 {total}名／最大8名）</small></legend><div className="people-grid">
      {([['adults','13歳以上'],['children','3〜12歳'],['infants','2歳以下']] as const).map(([key,label]) => <label key={key}>{label}<div className="counter"><button type="button" onClick={() => update(key, people[key]-1)}>−</button><b>{people[key]}</b><button type="button" onClick={() => update(key, people[key]+1)} disabled={total >= 8}>＋</button></div></label>)}
    </div></fieldset>
    <div className="form-grid">
      <label>お名前<input required placeholder="例：安城 太郎" /></label>
      <label>電話番号<input required type="tel" placeholder="090-1234-5678" /></label>
      <label>メール（任意）<input type="email" placeholder="example@email.com" /></label>
      <label className="wide">備考<textarea rows={3} placeholder="ご質問や配慮が必要なことがあればご記入ください" /></label>
    </div>
    {total > 8 && <p className="error">同時入店人数は8名までです。</p>}
    <button className="button full" disabled={total < 1 || total > 8}>空き状況を確認して予約する</button>
    <p className="form-note">料金は当日のお会計です。この画面では料金計算を行いません。</p>
  </form>;
}
