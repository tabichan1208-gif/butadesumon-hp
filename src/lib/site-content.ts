export type SiteSettings = {
  store_name:string; tagline:string; business_hours:string; closed_days:string; address:string; phone:string;
  parking_capacity:number; primary_color:string; background_color:string; font_family:string; base_font_size:number;
  heading_font_family:string; heading_font_size:number; eyebrow_font_size:number;
  hero_image_path:string; hero_mobile_image_path:string; about_image_path:string; map_url:string;
};

export type SiteCopy = Record<string,{heading:string;body:string}>;

export const defaultSettings:SiteSettings={
  store_name:"豚ですもん。",tagline:"こぶたと過ごす、やさしい時間。",business_hours:"11:00〜18:00",closed_days:"毎週月曜日",
  address:"愛知県安城市",phone:"",parking_capacity:1,primary_color:"#87533f",background_color:"#fbf7f1",font_family:"gothic",base_font_size:16,
  heading_font_family:"serif",heading_font_size:48,eyebrow_font_size:11,hero_image_path:"",hero_mobile_image_path:"",about_image_path:"",map_url:""
};

export const defaultCopy:SiteCopy={
  hero:{heading:"ちいさな幸せに、\n会いにきてね。",body:"個性豊かなこぶたちゃんたちと、のんびり過ごす特別な時間。"},
  about:{heading:"こぶたちゃんと過ごす、\nやさしいひととき。",body:"「豚ですもん。」は、かわいいマイクロブタたちと触れ合える小さなカフェです。木の温もりを感じる落ち着いた空間で、それぞれの個性をゆっくりお楽しみください。\n\n初めての方も、おひとりさまも、お子さま連れも大歓迎。"},
  friends:{heading:"豚ですもん。の仲間たち",body:"みんな性格も模様もそれぞれ。お気に入りの子を見つけてね。"},
  guide_reservation:{heading:"ご予約",body:"完全予約制ではありませんが、ご予約がおすすめです。"},
  guide_parking:{heading:"駐車場",body:"店舗前に予約のお客様専用の駐車場が1台ございます。"},
  guide_access:{heading:"アクセス",body:"愛知県安城市。詳しい場所はご予約時にご案内します。"},
  reservation:{heading:"オンライン予約",body:"空き状況を確認して、そのままご予約いただけます。"},
  footer:{heading:"豚ですもん。",body:"こぶたちゃん達と一緒に、皆さまのご来店をお待ちしております。"}
};

export function publicImageUrl(path:string){
  if(!path)return "";
  if(path.startsWith("http"))return path;
  const base=process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base?`${base}/storage/v1/object/public/site-media/${path}`:"";
}
