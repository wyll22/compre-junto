import logoHeader from "@assets/logo-header-final.png";
import logoLight from "@assets/logo-light-final.png";

interface BrandLogoProps {
  size?: "header" | "large";
  className?: string;
}

export function BrandLogo({ size = "header", className = "" }: BrandLogoProps) {
  if (size === "large") {
    return (
      <div className={`flex justify-center ${className}`}>
        <img
          src={logoLight}
          alt="Compra Junto Formosa"
          decoding="async"
          className="w-[160px] md:w-[200px] h-auto object-contain"
        />
      </div>
    );
  }

  return (
    <img
      src={logoHeader}
      alt="Compra Junto Formosa"
      decoding="async"
      className={`w-[100px] md:w-[130px] h-auto object-contain flex-shrink-0 ${className}`}
    />
  );
}
