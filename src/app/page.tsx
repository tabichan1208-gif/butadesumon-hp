import { AnimalRegistration } from "@/components/animal-registration";
import { InteriorGallery } from "@/components/interior-gallery";
import type { CSSProperties } from "react";
import { ReservationForm } from "@/components/reservation-form";
import { SiteHeader } from "@/components/site-header";
import { faqs as fallbackFaqs } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import { defaultCopy, defaultSettings, publicImageUrl } from "@/lib/site-content";

const fontMap={gothic:'"Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif',serif:'"Yu Mincho","Hiragino Mincho ProN",serif',rounded:'"Hiragino Maru Gothic ProN","Yu Gothic",sans-serif'};

export default async function Home(){
  const supabase=await createClient();
  const[{data:settingsData},{data:contentData},{data:pigData},{data:faqData},{data:interiorData}]=await Promise.all([
    supabase.from("site_settings").select("*").eq("id",true).maybeSingle(),
    supabase.from("site_content").select("section_key,heading,body").eq("published",true),
    supabase.from("pigs").select("id,name,breed,bio,image_path").eq("published",true).order("sort_order"),
    supabase.from("faqs").select("id,question,answer").eq("published",true).order("sort_order"),
    supabase.from("interior_photos").select("*").eq("published",true).order("sort_order").order("created_at").order("id")
  ]);
  const settings={...defaultSettings,...settingsData,phone:settingsData?.phone??"",hero_image_path:settingsData?.hero_image_path??"",hero_mobile_image_path:settingsData?.hero_mobile_image_path??"",about_image_path:settingsData?.about_image_path??"",map_url:settingsData?.map_url??""};
  const copy={...defaultCopy};for(const row of contentData??[])copy[row.section_key]={heading:normalizeBreaks(row.heading??""),body:normalizeBreaks(row.body??"")};
  const [reservationIntro,...reservationNotes]=copy.reservation.body.trimStart().split(/\r?\n/);
  const reservationNotice=reservationNotes.join("\n").trim();
  const pigs=pigData??[];
  const faqs=faqData?.length?faqData.map(item=>[item.question,item.answer] as const):fallbackFaqs;
  const heroImage=publicImageUrl(settings.hero_image_path),heroMobileImage=publicImageUrl(settings.hero_mobile_image_path),aboutImage=publicImageUrl(settings.about_image_path);
  const style={"--rose":settings.primary_color,"--cream":settings.background_color,"--site-font":fontMap[settings.font_family as keyof typeof fontMap]??fontMap.gothic,"--heading-font":fontMap[settings.heading_font_family as keyof typeof fontMap]??fontMap.serif,"--base-size":`${settings.base_font_size}px`,"--heading-size":`${settings.heading_font_size}px`,"--eyebrow-size":`${settings.eyebrow_font_size}px`,"--hero-desktop-image":heroImage?`var(--hero-shade),url(${heroImage})`:"none","--hero-mobile-image":heroMobileImage?`var(--hero-shade),url(${heroMobileImage})`:heroImage?`var(--hero-shade),url(${heroImage})`:"none"} as CSSProperties;
  return <main className="public-site" style={style}>
    <SiteHeader storeName={settings.store_name}/>
    <section className={`hero reference-hero${heroImage||heroMobileImage?" has-photo":""}`}><div className="hero-copy"><p className="eyebrow">愛知県安城市のマイクロブタカフェ</p><h1>{lines(copy.hero.heading)}</h1><p>{copy.hero.body}</p><div className="hero-actions"><a className="button" href="#reservation">ご予約はこちら</a><a className="text-link" href="#pigs">みんなを見てみる</a></div></div>{!heroImage&&!heroMobileImage&&<div className="hero-art" aria-label="メイン写真の設定場所"><div className="pig-shape"><span className="ear left"/><span className="ear right"/><span className="eye e1"/><span className="eye e2"/><span className="snout">•　•</span></div></div>}<div className="hours-card"><span>営業時間<strong>{settings.business_hours}</strong></span><span>定休日<strong>{settings.closed_days}</strong></span></div></section>
    <section id="about" className="section about reference-about"><div><p className="eyebrow">ABOUT US</p><h2>{lines(copy.about.heading)}</h2></div><div><div className="multiline">{copy.about.body}</div>{aboutImage&&<div className="about-photo" style={{backgroundImage:`url(${aboutImage})`}}/>}</div></section>
    <section id="pigs" className="section tinted reference-friends"><div className="section-heading"><p className="eyebrow">OUR LITTLE FRIENDS</p><h2>{copy.friends.heading}</h2><p>{copy.friends.body}</p></div><div className="friend-grid">{pigs.map((pig,index)=><article key={pig.id}><div className="friend-photo" style={pig.image_path?{backgroundImage:`url(${publicImageUrl(pig.image_path)})`}:{backgroundColor:["#ead4cb","#d7c9bf","#e7c7ba"][index%3]}}>{pig.image_path?null:"🐽"}</div><div className="friend-info"><div><h3>{pig.name}</h3><p>{pig.breed}</p></div><span>♡</span>{pig.bio&&<p className="friend-bio">{pig.bio}</p>}</div></article>)}</div></section>
    <section id="guide" className="section dark-guide"><div className="section-heading"><p className="eyebrow">VISIT GUIDE</p><h2>ご来店について</h2><p>安心して楽しんでいただくためのご案内です。</p></div><div className="guide-grid">{["guide_reservation","guide_parking","guide_access"].map((key,index)=><article key={key}><b>0{index+1}</b><h3>{copy[key].heading}</h3><p>{copy[key].body}</p></article>)}</div></section>
    <section id="reservation" className="section reservation reference-reservation"><div className="section-heading"><p className="eyebrow">ONLINE RESERVATION</p><h2>{copy.reservation.heading}</h2><p className="reservation-intro">{reservationIntro}</p>{reservationNotice&&<p className="reservation-notice">{reservationNotice}</p>}</div><ReservationForm/></section>
    <InteriorGallery photos={interiorData??[]}/>
    <section id="faq" className="section faq"><div className="section-heading"><p className="eyebrow">FAQ</p><h2>よくある質問</h2></div><div>{faqs.map(([q,a],i)=><details key={q} open={i===0}><summary><span>Q.</span>{q}<b>＋</b></summary><p>{a}</p></details>)}</div></section>
    <section className="section access"><div><p className="eyebrow">SHOP INFORMATION</p><h2>店舗情報</h2><dl><dt>店名</dt><dd>{settings.store_name}</dd><dt>営業時間</dt><dd>{settings.business_hours}</dd><dt>定休日</dt><dd>{settings.closed_days}</dd><dt>駐車場</dt><dd>専用駐車場 {settings.parking_capacity}台（要予約）</dd><dt>住所</dt><dd>{settings.address}</dd>{settings.phone&&<><dt>電話</dt><dd>{settings.phone}</dd></>}</dl></div><a className="map" href={settings.map_url||undefined} target={settings.map_url?"_blank":undefined} rel="noreferrer"><span>MAP</span><p>{settings.map_url?"Googleマップを開く":"管理画面からGoogleマップURLを設定できます"}</p></a></section>
    <AnimalRegistration settings={settings}/>
    <footer><div className="logo"><span>MICRO PIG CAFE</span>{copy.footer.heading||settings.store_name}</div><p>{copy.footer.body}</p><small>© {new Date().getFullYear()} {settings.store_name}</small></footer>
  </main>;
}

function lines(value:string){const parts=value.split("\n");return parts.map((line,index)=><span key={`${line}-${index}`}>{line}{index<parts.length-1&&<br/>}</span>)}
function normalizeBreaks(value:string){return value.replace(/\\n/g,"\n")}
