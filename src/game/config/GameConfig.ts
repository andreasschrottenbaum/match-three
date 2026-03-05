export type GameSettings = {
  grid: {
    size: number;
    variety: number;
  };
  shuffleCharges: number;
};

/**
 * Global game configuration for runtime adjustments.
 */
export const GameConfig = {
  grid: {
    size: 8, // 4x4 to 12x12
    variety: 6, // Amount of different Tiles (3-12)
  },
  shuffleCharges: 3, // Amount of charges for the Shuffle Button
};
