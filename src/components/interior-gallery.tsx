import Image from "next/image";
import type { CSSProperties } from "react";
import type { InteriorPhoto } from "@/lib/interior";
import { publicImageUrl } from "@/lib/site-content";

export function InteriorGallery({ photos }: { photos: InteriorPhoto[] }) {
  const visible = photos.filter(photo => photo.published && photo.image_path);
  if (!visible.length) return null;
  return <section className="section interior-section" aria-labelledby="interior-heading">
    <div className="section-heading"><p className="eyebrow">INSIDE OUR CAFE</p><h2 id="interior-heading">店内のようす</h2><p>ご来店前に、お店の雰囲気をご覧ください。</p></div>
    <div className="interior-gallery" tabIndex={0} role="region" aria-label="店内写真。スマホでは横にスクロールできます" style={{"--gallery-columns": Math.min(visible.length, 3)} as CSSProperties}>
      {visible.map((photo,index) => <figure key={photo.id}>
        <div className="interior-photo"><Image src={publicImageUrl(photo.image_path)} alt={photo.caption || `店内のようす ${index+1}`} fill unoptimized sizes="(max-width: 600px) 82vw, 50vw"/></div>
        {photo.caption && <figcaption>{photo.caption}</figcaption>}
      </figure>)}
    </div>
    {visible.length>1 && <p className="interior-swipe-hint">横にスワイプしてほかの写真を見る →</p>}
  </section>;
}
