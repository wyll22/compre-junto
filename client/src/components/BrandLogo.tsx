import logoImg from "@assets/logo-clean.png";

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <img
      src={logoImg}
      alt="Compra Junto Formosa"
      decoding="async"
      className={`brand-logo ${className}`}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
