import { TYPE_BADGES_SPRITE, type BadgeKey } from "@/lib/typeBadgesSprite";

export default function TypeBadge({
  kind,
  width = 110
}: {
  kind: BadgeKey;
  width?: number;
}) {
  const p = TYPE_BADGES_SPRITE.pos[kind];
  if (!p) return null;

  // Garde le ratio du badge d'origine
  const scale = width / TYPE_BADGES_SPRITE.w;
  const height = Math.round(TYPE_BADGES_SPRITE.h * scale);

  return (
    <span
      aria-label={kind}
      title={kind}
      className="inline-block"
      style={{
        width,
        height,
        backgroundImage: `url(${TYPE_BADGES_SPRITE.sheet})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${TYPE_BADGES_SPRITE.sheetW * scale}px ${TYPE_BADGES_SPRITE.sheetH * scale}px`,
        backgroundPosition: `${-p.x * scale}px ${-p.y * scale}px`,
        imageRendering: "auto",
      }}
    />
  );
}
