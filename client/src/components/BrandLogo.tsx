import logoImg from "@assets/logo-cropped.png";

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
          className="w-[160px] md:w-[200px] h-auto object-contain"
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center bg-white rounded-xl overflow-hidden flex-shrink-0 ${className}`}>
      <img
        src={logoImg}
        alt="Compra Junto Formosa"
        decoding="async"
        className="w-[70px] md:w-[90px] h-auto object-contain"
      />
    </div>
  );
}
