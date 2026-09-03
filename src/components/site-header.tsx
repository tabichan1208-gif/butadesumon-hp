import Link from "next/link";

export function SiteHeader() {
  return <header className="header"><Link className="logo" href="/"><span>MICRO PIG CAFE</span>豚ですもん。</Link><nav><a href="#about">お店について</a><a href="#pigs">こぶた紹介</a><a href="#guide">ご利用案内</a><a href="#faq">よくある質問</a></nav><a className="header-cta" href="#reservation">オンライン予約</a></header>;
}
