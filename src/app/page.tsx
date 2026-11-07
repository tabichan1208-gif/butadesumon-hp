import { AnimalRegistration } from "@/components/animal-registration";
import { BrandLogo } from "@/components/brand-logo";
import { InteriorGallery } from "@/components/interior-gallery";
import type { CSSProperties } from "react";
import { ReservationForm } from "@/components/reservation-form";
import { SiteHeader } from "@/components/site-header";
import { faqs as fallbackFaqs } from "@/lib/mock-data";
import { getPublicContent } from "@/lib/public-content";
import { PublicPhoto, optimizedBackground } from "@/components/public-photo";
import { defaultCopy, defaultSettings, publicImageUrl } from "@/lib/site-content";
import type { Metadata } from "next";
import { defaultPricingSettings } from "@/lib/pricing";
import { defaultBusinessSchedule } from "@/lib/business-calendar";

// Render on request; only anonymous public data is persisted, never auth or reservations.
export const dynamic = "force-dynamic";

const fontMap={
  gothic:'"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans JP",sans-serif',
  modern:'Avenir,"Avenir Next","Helvetica Neue","Yu Gothic",sans-serif',
  rounded:'"Hiragino Maru Gothic ProN","Yu Gothic","Noto Sans JP",sans-serif',
  "soft-rounded":'"Tsukushi A Round Gothic","Hiragino Maru Gothic ProN","Yu Gothic",sans-serif',
  serif:'"Yu Mincho","Hiragino Mincho ProN","Noto Serif JP",serif',
  "classic-serif":'"Hiragino Mincho ProN","YuMincho","Yu Mincho",serif',
  handwritten:'Klee,"Klee One",YuKyokasho,"Yu Kyokasho","Hiragino Mincho ProN",serif'
};

export async function generateMetadata():Promise<Metadata>{
  const [{data}]=await getPublicContent();
  const settings={...defaultSettings,...(data??{})};
  const image=publicImageUrl(settings.seo_image_path||settings.hero_image_path);
  const canonical=/^https:\/\//.test(settings.seo_canonical_url)?settings.seo_canonical_url:undefined;
  return{
    title:settings.seo_title,
    description:settings.seo_description,
    keywords:String(settings.seo_keywords).split(/[,、]/).map((value:string)=>value.trim()).filter(Boolean),
    alternates:canonical?{canonical}:undefined,
    robots:{index:settings.seo_indexing_enabled,follow:settings.seo_indexing_enabled},
    openGraph:{type:"website",locale:"ja_JP",title:settings.seo_title,description:settings.seo_description,url:canonical,images:image?[{url:image}]:undefined},
    twitter:{card:image?"summary_large_image":"summary",title:settings.seo_title,description:settings.seo_description,images:image?[image]:undefined}
  };
}

export default async function Home(){
  const[{data:settingsData},{data:contentData},{data:pigData},{data:faqData},{data:interiorData},{data:pricingSettingsData},{data:pricingItemsData},{data:scheduleData},{data:exceptionData}]=await getPublicContent();
  const settings={...defaultSettings,...settingsData,phone:settingsData?.phone??"",instagram_url:settingsData?.instagram_url??"",hero_image_path:settingsData?.hero_image_path??"",hero_mobile_image_path:settingsData?.hero_mobile_image_path??"",about_image_path:settingsData?.about_image_path??"",exterior_image_path:settingsData?.exterior_image_path??"",map_url:settingsData?.map_url??""};
  const copy={...defaultCopy};for(const row of contentData??[])copy[row.section_key]={heading:normalizeBreaks(row.heading??""),body:normalizeBreaks(row.body??"")};
  const [reservationIntro,...reservationNotes]=copy.reservation.body.trimStart().split(/\r?\n/);
  const reservationNotice=reservationNotes.join("\n").trim();
  const pigs=pigData??[];
  const faqs=faqData?.length?faqData.map(item=>[item.question,item.answer] as const):fallbackFaqs;
  const pricing={...defaultPricingSettings,...(pricingSettingsData??{})};
  const heroImage=publicImageUrl(settings.hero_image_path),heroMobileImage=publicImageUrl(settings.hero_mobile_image_path),aboutImage=publicImageUrl(settings.about_image_path),exteriorImage=publicImageUrl(settings.exterior_image_path);
  const style={"--rose":settings.primary_color,"--cream":settings.background_color,"--site-font":fontMap[settings.font_family as keyof typeof fontMap]??fontMap.gothic,"--heading-font":fontMap[settings.heading_font_family as keyof typeof fontMap]??fontMap.serif,"--base-size":`${settings.base_font_size}px`,"--heading-size":`${settings.heading_font_size}px`,"--eyebrow-size":`${settings.eyebrow_font_size}px`,"--hero-desktop-image":heroImage?`var(--hero-shade),${optimizedBackground(heroImage,1920)}`:"none","--hero-mobile-image":heroMobileImage?`var(--hero-shade),${optimizedBackground(heroMobileImage,900)}`:heroImage?`var(--hero-shade),${optimizedBackground(heroImage,1920)}`:"none"} as CSSProperties;
  return <main className="public-site" style={style}>
    <SiteHeader storeName={settings.store_name} showPricing={pricing.published}/>
    <section className={`hero reference-hero${heroImage||heroMobileImage?" has-photo":""}`}><div className="hero-copy"><p className="eyebrow">愛知県安城市のマイクロブタカフェ</p><div className="hero-brand-logo"><BrandLogo variant={heroImage||heroMobileImage?"white":"brown"} label={copy.hero.heading}/></div><p>{copy.hero.body}</p><div className="hero-actions"><a className="button" href="#reservation">ご予約はこちら</a><a className="text-link" href="#pigs">みんなを見てみる</a></div></div>{!heroImage&&!heroMobileImage&&<div className="hero-art" aria-label="メイン写真の設定場所"><div className="pig-shape"><span className="ear left"/><span className="ear right"/><span className="eye e1"/><span className="eye e2"/><span className="snout">•　•</span></div></div>}<div className="hours-card"><span>営業時間<strong>{settings.business_hours}</strong></span><span>定休日<strong>{settings.closed_days}</strong></span></div></section>
    <section id="about" className="section about reference-about"><div><p className="eyebrow">ABOUT US</p><h2>{lines(copy.about.heading)}</h2></div><div><div className="multiline">{copy.about.body}</div>{aboutImage&&<PublicPhoto className="about-photo" src={aboutImage} alt="こぶたと過ごす店内" sizes="(max-width: 900px) 90vw, 45vw"/>}</div></section>
    <section id="pigs" className="section tinted reference-friends"><div className="section-heading"><p className="eyebrow">OUR LITTLE FRIENDS</p><h2>{copy.friends.heading}</h2><p>{copy.friends.body}</p></div><div className="friend-grid">{pigs.map((pig,index)=><article key={pig.id} aria-label={pig.name}><div className="friend-photo" style={pig.image_path?undefined:{backgroundColor:["#ead4cb","#d7c9bf","#e7c7ba"][index%3]}}>{pig.image_path?<PublicPhoto src={publicImageUrl(pig.image_path)} alt={pig.name} sizes="(max-width: 600px) 90vw, (max-width: 900px) 45vw, 30vw"/>:"🐽"}</div></article>)}</div></section>
    <section id="guide" className="section dark-guide"><div className="section-heading"><p className="eyebrow">VISIT GUIDE</p><h2>ご来店について</h2><p>安心して楽しんでいただくためのご案内です。</p></div><div className="guide-grid">{["guide_reservation","guide_parking","guide_access"].map((key,index)=><article key={key}><div className="guide-title"><b>0{index+1}</b><h3>{copy[key].heading}</h3></div><p>{copy[key].body}</p></article>)}</div></section>
    {pricing.published&&<section id="pricing" className="section pricing-section"><div className="section-heading"><p className="eyebrow">PRICE</p><h2>{lines(pricing.heading)}</h2>{pricing.description&&<p className="multiline">{pricing.description}</p>}</div><div className="pricing-legend" aria-label="料金区分の色分け"><span className="child">3〜12歳</span><span className="adult">13歳以上</span></div><div className="pricing-grid">{(pricingItemsData??[]).map(item=><article className={`pricing-card ${pricingTone(item.label)}`} key={item.id}><h3>{item.label}</h3><strong>{item.price}</strong>{item.description&&<p className="multiline">{item.description}</p>}</article>)}</div>{pricing.note&&<p className="pricing-note">{pricing.note}</p>}</section>}
    <section id="reservation" className="section reservation reference-reservation"><div className="section-heading"><p className="eyebrow">ONLINE RESERVATION</p><h2>{copy.reservation.heading}</h2><p className="reservation-intro">{reservationIntro}</p>{reservationNotice&&<p className="reservation-notice">{reservationNotice}</p>}</div><ReservationForm schedule={{...defaultBusinessSchedule,...scheduleData,open_time:scheduleData?.open_time?.slice(0,5)??"11:00",close_time:scheduleData?.close_time?.slice(0,5)??"18:00"}} exceptions={exceptionData??[]}/></section>
    <InteriorGallery photos={interiorData??[]}/>
    <section id="faq" className="section faq"><div className="section-heading"><p className="eyebrow">FAQ</p><h2>よくある質問</h2></div><div>{faqs.map(([q,a],i)=><details key={q} open={i===0}><summary><span>Q.</span>{q}<b>＋</b></summary><p>{a}</p></details>)}</div></section>
    <section className="section access"><div><p className="eyebrow">SHOP INFORMATION</p><h2>店舗情報</h2><dl><dt>店名</dt><dd>{settings.store_name}</dd><dt>営業時間</dt><dd>{settings.business_hours}</dd><dt>定休日</dt><dd>{settings.closed_days}</dd><dt>駐車場</dt><dd>専用駐車場 {settings.parking_capacity}台（要予約）</dd><dt>住所</dt><dd>{settings.address}</dd>{settings.phone&&<><dt>電話</dt><dd>{settings.phone}</dd></>}{settings.instagram_url&&<><dt>Instagram</dt><dd><a className="instagram-link" href={settings.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="豚ですもん。のInstagramを開く">Instagramを見る ↗</a></dd></>}</dl></div><div className="access-visuals">{exteriorImage&&<PublicPhoto className="access-exterior" src={exteriorImage} alt="お店の外観" sizes="(max-width: 900px) 90vw, 45vw"/>}<a className="map" href={settings.map_url||undefined} target={settings.map_url?"_blank":undefined} rel="noreferrer"><span>MAP</span><p>{settings.map_url?"Googleマップを開く":"管理画面からGoogleマップURLを設定できます"}</p></a></div></section>
    <AnimalRegistration settings={settings}/>
    <footer><BrandLogo variant="white" label={copy.footer.heading||settings.store_name}/><p>{copy.footer.body}</p>{settings.instagram_url&&<a className="footer-instagram" href={settings.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="豚ですもん。のInstagramを開く"><span aria-hidden="true">◎</span> Instagram</a>}<small>© {new Date().getFullYear()} {settings.store_name}</small></footer>
  </main>;
}

function lines(value:string){const parts=value.split("\n");return parts.map((line,index)=><span key={`${line}-${index}`}>{line}{index<parts.length-1&&<br/>}</span>)}
function normalizeBreaks(value:string){return value.replace(/\\n/g,"\n")}
function pricingTone(label:string){const normalized=label.replace(/[～〜−ー―]/g,"-");if(normalized.includes("13歳")||normalized.includes("大人"))return"adult";if(normalized.includes("3-12歳")||normalized.includes("子ども"))return"child";return"extra"}
