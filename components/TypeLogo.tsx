/**
 * TypeLogo - Simple type icon (no text)
 * Use for: compact UI, lists, battles, filters
 * Path: /icons/types/{type}.png
 */

type TypeLogoProps = {
  type: string;
  size?: number;
  className?: string;
};

export default function TypeLogo({ 
  type, 
  size = 24, 
  className = "" 
}: TypeLogoProps) {
  const typeNormalized = type.toLowerCase();
  
  return (
    <img
      src={`/icons/types/${typeNormalized}.png`}
      alt={type}
      title={type}
      className={`inline-block ${className}`}
      style={{
        width: size,
        height: size,
        objectFit: "contain"
      }}
    />
  );
}
