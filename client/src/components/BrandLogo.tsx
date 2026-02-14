import logoImg from "@assets/49ECF8D6-8EFD-4DE3-B65C-335066A661D2_1771050625940.png";

interface BrandLogoProps {
  size?: "header" | "large";
  className?: string;
}

export function BrandLogo({ size = "header", className = "" }: BrandLogoProps) {
  const sizeClass = size === "large"
    ? "h-[100px] sm:h-[120px] md:h-[140px]"
    : "h-[60px] sm:h-[70px] md:h-[80px]";

  return (
    <img
      src={logoImg}
      alt="Compra Junto Formosa"
      decoding="async"
      className={`${sizeClass} w-auto object-contain flex-shrink-0 ${className}`}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
