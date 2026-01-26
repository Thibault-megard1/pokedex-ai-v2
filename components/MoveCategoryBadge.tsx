/**
 * MoveCategoryBadge - Move damage category badge
 * Use for: move details, battle UI, educational displays
 * Path: /icons/moves-badges/{physical|special|status}.png
 * Categories: physical, special, status
 */

type MoveCategoryBadgeProps = {
  category: "physical" | "special" | "status";
  width?: number;
  className?: string;
};

export default function MoveCategoryBadge({
  category,
  width = 110,
  className = ""
}: MoveCategoryBadgeProps) {
  const categoryNormalized = category.toLowerCase();
  
  // Move category badges have a 2.5:1 aspect ratio (width:height)
  const height = Math.round(width / 2.5);

  return (
    <img
      src={`/icons/moves-badges/${categoryNormalized}.png`}
      alt={category}
      title={category}
      className={`inline-block ${className}`}
      style={{
        width,
        height,
        objectFit: "contain"
      }}
    />
  );
}
