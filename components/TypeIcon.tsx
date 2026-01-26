import { TYPE_SPRITE } from "@/lib/typeSprite";

type TypeIconProps = {
  type: string;
  size?: number;
  className?: string;
};

export default function TypeIcon({ type, size = 20, className = "" }: TypeIconProps) {
  const p = (TYPE_SPRITE.pos as any)[type.toLowerCase()];
  if (!p) return null;

  const scale = size / TYPE_SPRITE.iconW;

  return (
    <span
      aria-label={type}
      title={type}
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        backgroundImage: `url(${TYPE_SPRITE.sheet})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${TYPE_SPRITE.sheetW * scale}px ${TYPE_SPRITE.sheetH * scale}px`,
        backgroundPosition: `${-p.x * scale}px ${-p.y * scale}px`,
        imageRendering: "pixelated",
      }}
    />
  );
}
