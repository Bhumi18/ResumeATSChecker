import type { CSSProperties } from "react";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "light";
  markOnly?: boolean;
  className?: string;
  style?: CSSProperties;
  alt?: string;
};

const fullSizeMap: Record<NonNullable<BrandLogoProps["size"]>, CSSProperties> = {
  sm: { width: "130px", height: "30px" },
  md: { width: "158px", height: "36px" },
  lg: { width: "196px", height: "44px" },
};

const markSizeMap: Record<NonNullable<BrandLogoProps["size"]>, CSSProperties> = {
  sm: { width: "30px", height: "30px" },
  md: { width: "36px", height: "36px" },
  lg: { width: "44px", height: "44px" },
};

export default function BrandLogo({
  size = "md",
  variant = "default",
  markOnly = false,
  className,
  style,
  alt = "ATSEngine",
}: BrandLogoProps) {
  const src = markOnly
    ? "/icons/brand-mark.svg"
    : variant === "light"
      ? "/icons/brand-logo-light.svg"
      : "/icons/brand-logo.svg";

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{
        display: "block",
        objectFit: "contain",
        ...(markOnly ? markSizeMap[size] : fullSizeMap[size]),
        ...style,
      }}
    />
  );
}
