/**
 * Jump links target each card's heading; this offset clears the header, the jump bar and the card padding.
 * `!`: the global `h2[id]` scroll margin (6rem) is unlayered, so it would beat a plain utility.
 */
export const jumpTarget = "[&_h2]:scroll-mt-36!";
