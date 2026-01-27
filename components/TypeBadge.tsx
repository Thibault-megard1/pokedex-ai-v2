/**
 * TypeBadge - Type badge with text label
 * Use for: Pokémon detail pages, move details, quiz explanations, educational displays
 * Path: /icons/types-badges/{type}.png
 */

type TypeBadgeProps = {
  kind: string;
  width?: number;
  className?: string;
};

export default function TypeBadge({
  kind,
  width = 110,
  className = ""
}: TypeBadgeProps) {
  const typeNormalized = kind.toLowerCase();
  
  // Type badges have a 2.5:1 aspect ratio (width:height)
  const height = Math.round(width / 2.5);

  return (
    <img
      src={`/icons/types-badges/${typeNormalized}.png`}
      alt={kind}
      title={kind}
      className={`inline-block icon-light-mode ${className}`}
      style={{
        width,
        height,
        objectFit: "contain"
      }}
    />
  );
}
