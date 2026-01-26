// lib/typeSprite.ts
export const TYPE_SPRITE = {
  sheet: "/backgrounds/type.png",
  sheetW: 1030,
  sheetH: 500,
  iconW: 128,
  iconH: 128,
  pos: {
    normal:   { x: 6,   y: 8 },
    fighting: { x: 184, y: 8 },
    flying:   { x: 362, y: 8 },
    poison:   { x: 540, y: 8 },
    ground:   { x: 718, y: 8 },
    rock:     { x: 896, y: 8 },

    bug:      { x: 6,   y: 186 },
    ghost:    { x: 184, y: 186 },
    steel:    { x: 362, y: 186 },
    fire:     { x: 540, y: 186 },
    water:    { x: 718, y: 186 },
    grass:    { x: 896, y: 186 },

    electric: { x: 6,   y: 364 },
    psychic:  { x: 184, y: 364 },
    ice:      { x: 362, y: 364 },
    dragon:   { x: 540, y: 364 },
    dark:     { x: 718, y: 364 },
    fairy:    { x: 896, y: 364 },
  } as const
} as const;
