import Image from "next/image";

const logoFiles = {
  brown: "/brand/logo-brown.png",
  white: "/brand/logo-white.png",
  pink: "/brand/logo-pink.png"
} as const;

export function BrandLogo({variant="brown",label="豚ですもん。"}:{variant?:keyof typeof logoFiles;label?:string}) {
  return <span className={`brand-logo brand-logo-${variant}`} role="img" aria-label={label}>
    <Image src={logoFiles[variant]} alt="" width={595} height={842} priority={variant==="brown"}/>
  </span>;
}
