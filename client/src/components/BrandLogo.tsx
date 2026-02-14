import logoImg from "@assets/49ECF8D6-8EFD-4DE3-B65C-335066A661D2_1771048499776.png";

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
