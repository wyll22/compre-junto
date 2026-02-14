import logoImg from "@assets/49ECF8D6-8EFD-4DE3-B65C-335066A661D2_1771050625940.png";

interface BrandLogoProps {
  size?: "header" | "large";
  className?: string;
}

export function BrandLogo({ size = "header", className = "" }: BrandLogoProps) {
  const sizeClass = size === "large"
    ? "w-[160px] md:w-[200px] h-auto mx-auto"
    : "w-[120px] md:w-[160px] h-auto";

  return (
    <img
      src={logoImg}
      alt="Compra Junto Formosa"
      decoding="async"
      className={`object-contain flex-shrink-0 ${sizeClass} ${className}`}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
