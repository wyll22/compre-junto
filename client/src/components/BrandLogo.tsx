import logoImg from "@assets/49ECF8D6-8EFD-4DE3-B65C-335066A661D2_1771050625940.png";

interface BrandLogoProps {
  size?: "header" | "large";
  className?: string;
}

export function BrandLogo({ size = "header", className = "" }: BrandLogoProps) {
  if (size === "large") {
    return (
      <div className={`flex justify-center ${className}`}>
        <div className="bg-white rounded-xl p-3 inline-block">
          <img
            src={logoImg}
            alt="Compra Junto Formosa"
            decoding="async"
            className="w-[140px] md:w-[180px] h-auto object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-block bg-white rounded-lg p-1.5 flex-shrink-0 ${className}`}>
      <img
        src={logoImg}
        alt="Compra Junto Formosa"
        decoding="async"
        className="w-[80px] md:w-[110px] h-auto object-contain"
      />
    </div>
  );
}
