export type GameSettings = {
  grid: {
    size: number;
    variety: number;
  };
  shuffleCharges: number;
};

const getStorageItem = (key: string, defaultValue: number): number => {
  const item = localStorage.getItem(`match3_${key}`);
  return item ? parseInt(item, 10) : defaultValue;
};

/**
 * Global game configuration for runtime adjustments.
 */
export const GameConfig = {
  grid: {
    size: getStorageItem("size", 8), // 4x4 to 12x12
    variety: getStorageItem("variety", 6), // Amount of different Tiles (3-12)
    maxSize: 12,
    minSize: 4,
    maxVariety: 12,
    minVariety: 3,
  },
  shuffleCharges: 3, // Amount of charges for the Shuffle Button
  maxShuffleScharges: 3,
};
