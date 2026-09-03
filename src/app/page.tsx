import { ReservationForm } from "@/components/reservation-form";
import { SiteHeader } from "@/components/site-header";
import { faqs, pigs } from "@/lib/mock-data";

export default function Home() {
  return <main>
    <SiteHeader />
    <section className="hero"><div className="hero-copy"><p className="eyebrow">MICRO PIG CAFE · AICHI</p><h1>こぶたと過ごす、<br/><em>やさしい時間。</em></h1><p>小さな鼻と、あたたかな体温。<br/>日常をちょっと忘れて、のんびりしませんか。</p><div className="hero-actions"><a className="button" href="#reservation">ご予約はこちら</a><a className="text-link" href="#about">お店のことを知る →</a></div></div><div className="hero-art" aria-label="マイクロブタのイメージ"><div className="sun"/><div className="pig-shape"><span className="ear left"/><span className="ear right"/><span className="eye e1"/><span className="eye e2"/><span className="snout">•　•</span></div><p>のんびり、すやすや。</p></div><div className="scroll">SCROLL ↓</div></section>

    <section id="about" className="section about"><div><p className="eyebrow">ABOUT US</p><h2>ここは、こぶたが主役の<br/>小さなふれあいカフェ。</h2></div><div><p>「豚ですもん。」では、個性豊かなマイクロブタさんたちがのびのびと暮らしています。床に座って、同じ目線で、気ままな時間をお過ごしください。</p><div className="values"><span>01<small>少人数制</small></span><span>02<small>ゆったり予約</small></span><span>03<small>清潔な空間</small></span></div></div></section>

    <section id="pigs" className="section tinted"><div className="section-heading"><p className="eyebrow">OUR PIGS</p><h2>会える、こぶたたち</h2><p>性格も好きなことも、みんなそれぞれ。</p></div><div className="pig-grid">{pigs.map((pig,i) => <article className="pig-card" key={pig.id}><div className="pig-photo" style={{backgroundColor:pig.color}}><div className="mini-pig">🐽</div><span>0{i+1}</span></div><div><p>{pig.breed}</p><h3>{pig.name}</h3><p>{pig.bio}</p></div></article>)}</div></section>

    <section id="guide" className="section"><div className="section-heading"><p className="eyebrow">VISIT GUIDE</p><h2>ご利用案内</h2></div><div className="guide-grid"><article><b>01</b><h3>予約する</h3><p>日時・人数・利用時間を選んでご予約ください。</p></article><article><b>02</b><h3>お店へ</h3><p>ご予約時間の5分前を目安にお越しください。</p></article><article><b>03</b><h3>こぶたと過ごす</h3><p>スタッフの案内後、やさしく触れ合いましょう。</p></article></div><div className="price"><div><p className="eyebrow">PRICE</p><h3>料金のご案内</h3><p>料金は当日、店舗にてお支払いください。</p></div><table><thead><tr><th>年齢</th><th>15分</th><th>30分</th><th>45分</th><th>60分</th></tr></thead><tbody><tr><th>13歳以上</th><td>¥1,500</td><td>¥2,000</td><td>¥2,400</td><td>¥2,800</td></tr><tr><th>3〜12歳</th><td>¥1,000</td><td>¥1,500</td><td>¥1,800</td><td>¥2,200</td></tr><tr><th>2歳以下</th><td colSpan={4}>無料</td></tr></tbody></table></div></section>

    <section id="reservation" className="section reservation"><div className="section-heading"><p className="eyebrow">ONLINE RESERVATION</p><h2>オンライン予約</h2><p>同時入店は最大8名。空き状況は予約時間の重なりを含めて確認します。</p></div><ReservationForm /></section>

    <section id="faq" className="section faq"><div className="section-heading"><p className="eyebrow">FAQ</p><h2>よくある質問</h2></div><div>{faqs.map(([q,a],i) => <details key={q} open={i===0}><summary><span>Q.</span>{q}<b>＋</b></summary><p>{a}</p></details>)}</div></section>
    <section className="section access"><div><p className="eyebrow">ACCESS</p><h2>店舗情報</h2><dl><dt>店名</dt><dd>マイクロブタカフェ 豚ですもん。</dd><dt>営業時間</dt><dd>10:00–17:00（最終受付 16:00）</dd><dt>定休日</dt><dd>火曜日・水曜日</dd><dt>駐車場</dt><dd>専用駐車場 1台（要予約）</dd><dt>住所</dt><dd>愛知県（正式住所は公開前に設定）</dd></dl></div><div className="map"><span>MAP</span><p>正式な住所を設定すると<br/>Google Mapを表示できます</p></div></section>
    <footer><div className="logo"><span>MICRO PIG CAFE</span>豚ですもん。</div><p>こぶたと過ごす、やさしい時間。</p><small>© {new Date().getFullYear()} 豚ですもん。 All rights reserved.</small></footer>
  </main>;
}
