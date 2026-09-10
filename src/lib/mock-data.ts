export type Pig = { id: string; name: string; breed: string; bio: string; color: string };

export const pigs: Pig[] = [
  { id: "1", name: "つむぎ", breed: "マイクロブタ", bio: "好奇心いっぱい。なでなでが大好きな甘えんぼです。", color: "#d7a28f" },
  { id: "2", name: "こむぎ", breed: "マイクロブタ", bio: "のんびり屋さん。お気に入りの毛布でお昼寝しています。", color: "#a56d5f" },
  { id: "3", name: "あずき", breed: "マイクロブタ", bio: "食いしんぼうで元気いっぱい。みんなのムードメーカー。", color: "#dfb8a5" },
];

export const faqs = [
  ["予約なしでも入れますか？", "空きがあればご案内できますが、8名定員のため事前予約がおすすめです。"],
  ["小さな子どもも入れますか？", "はい。2歳以下のお子さまも一緒にお楽しみいただけます。"],
  ["駐車場はありますか？", "専用駐車場は1台です。予約時に空き状況をご確認いただけます。"],
];

export const mockReservations = [
  { time: "10:00", minutes: 60, name: "安城 太郎", guests: 4, parking: true, source: "WEB" },
  { time: "11:30", minutes: 30, name: "岡崎 花子", guests: 2, parking: false, source: "電話" },
  { time: "14:00", minutes: 45, name: "刈谷 一郎", guests: 3, parking: false, source: "店頭" },
];
