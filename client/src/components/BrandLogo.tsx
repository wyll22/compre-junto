import logoImg from "@assets/B1F561C7-9F2D-436B-AA02-765E9A65D95E_1771051711250.png";

interface BrandLogoProps {
  size?: "header" | "large";
  className?: string;
}

export function BrandLogo({ size = "header", className = "" }: BrandLogoProps) {
  if (size === "large") {
    return (
      <div className={`flex justify-center ${className}`}>
        <img
          src={logoImg}
          alt="Compra Junto Formosa"
          decoding="async"
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
      className={`w-[80px] md:w-[110px] h-auto object-contain flex-shrink-0 ${className}`}
    />
  );
}
