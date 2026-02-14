import logoImg from "@assets/49ECF8D6-8EFD-4DE3-B65C-335066A661D2_1771050625940.png";

interface BrandLogoProps {
  size?: "header" | "large";
  className?: string;
}

export function BrandLogo({ size = "header", className = "" }: BrandLogoProps) {
  const imgStyle: React.CSSProperties = {
    filter: "drop-shadow(0 0 6px rgba(255,255,255,0.7)) drop-shadow(0 0 14px rgba(255,255,255,0.4))",
  };

  if (size === "large") {
    return (
      <div className={`flex justify-center ${className}`}>
        <img
          src={logoImg}
          alt="Compra Junto Formosa"
          decoding="async"
          style={imgStyle}
          className="w-[140px] md:w-[180px] h-auto object-contain"
        />
      </div>
    );
  }

  return (
    <img
      src={logoImg}
      alt="Compra Junto Formosa"
      decoding="async"
      style={imgStyle}
      className={`w-[80px] md:w-[110px] h-auto object-contain flex-shrink-0 ${className}`}
    />
  );
}
