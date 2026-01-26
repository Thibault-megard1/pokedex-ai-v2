export const TYPE_BADGES_SPRITE = {
  sheet: "/backgrounds/type-badges.png",
  sheetW: 2048,
  sheetH: 797,
  w: 388,
  h: 138,

  pos: {
    // Row 1
    normal:   { x: 13,   y: 13 },
    grass:    { x: 422,  y: 13 },
    fire:     { x: 830,  y: 13 },
    water:    { x: 1238, y: 13 },
    electric: { x: 1646, y: 13 },

    // Row 2
    rock:     { x: 13,   y: 171 },
    fighting: { x: 422,  y: 171 },
    psychic:  { x: 830,  y: 171 },
    ghost:    { x: 1238, y: 171 },
    poison:   { x: 1646, y: 171 },

    // Row 3
    flying:   { x: 13,   y: 330 },
    ground:   { x: 422,  y: 330 },
    dragon:   { x: 830,  y: 330 },
    ice:      { x: 1238, y: 330 },
    bug:      { x: 1646, y: 330 },

    // Row 4
    steel:    { x: 13,   y: 488 },
    dark:     { x: 422,  y: 488 },
    fairy:    { x: 830,  y: 488 },
    shadow:   { x: 1238, y: 488 },
    unknown:  { x: 1646, y: 488 },

    // Row 5 (catégories d'attaque)
    physical: { x: 422,  y: 646 },
    special:  { x: 830,  y: 646 },
    status:   { x: 1238, y: 646 },
  } as const
} as const;

export type BadgeKey = keyof typeof TYPE_BADGES_SPRITE.pos;
