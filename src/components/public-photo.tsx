import Image, { getImageProps } from "next/image";

// Only our public bucket is admitted to the optimizer. Preserve legacy external URLs.
export function isOptimizable(src: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return (src.startsWith("/") && !src.startsWith("//")) || (!!base && src.startsWith(`${base}/storage/v1/object/public/site-media/`));
}

export function PublicPhoto({src, alt, className = "", sizes}: {src:string; alt:string; className?:string; sizes:string}) {
  return <div className={`public-photo ${className}`}><Image src={src} alt={alt} fill sizes={sizes} unoptimized={!isOptimizable(src)} style={{objectFit:"cover"}}/></div>;
}

// Keep the existing responsive hero crop/shading while routing its background through Next.
export function optimizedBackground(src: string, width: number) {
  if (!isOptimizable(src)) return `url(${JSON.stringify(src)})`;
  const { props } = getImageProps({src, alt:"", width, height:Math.round(width*2/3)});
  return `image-set(${props.srcSet?.split(", ").map(candidate => {
    const [url, density] = candidate.split(" ");
    return `url(${JSON.stringify(url)}) ${density}`;
  }).join(", ") ?? `url(${JSON.stringify(props.src)}) 1x`})`;
}
