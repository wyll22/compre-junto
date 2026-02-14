import logoImg from "@assets/logo-transparent.png";

type LogoVariant = "header" | "auth";

interface BrandLogoProps {
  variant?: LogoVariant;
  className?: string;
}

export function BrandLogo({ variant = "header", className = "" }: BrandLogoProps) {
  const variantClass = variant === "auth" ? "brand-logo brand-logo--auth" : "brand-logo brand-logo--header";

  return (
    <img
      src={logoImg}
      alt="Compra Junto Formosa"
      decoding="async"
      className={`${variantClass} ${className}`}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
