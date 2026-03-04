/**
 * Represents the unique identifier for a tile type.
 * Usually maps to an index in the TILE_TYPES array.
 */
type TileID = number;

/**
 * Coordinates of a tile within the logical grid.
 */
interface GridPosition {
  row: number;
  col: number;
}

/**
 * A generic movement from one grid cell to another.
 * Used for swaps and complex animations.
 */
interface GridMove {
  from: GridPosition;
  to: GridPosition;
}

/**
 * Specifically for vertical gravity displacement.
 * Since the column never changes when falling, we only need the row delta.
 */
interface GravityMove {
  col: number;
  fromRow: number;
  toRow: number;
}

/**
 * Represents a slot in the grid that needs a newly spawned tile
 * after matches have been cleared and gravity has settled.
 */
interface EmptySlot {
  row: number;
  col: number;
}

/**
 * Result of a gravity calculation, providing instructions
 * on how to update the visual board.
 */
interface GravityResult {
  moves: GravityMove[];
  newTiles: EmptySlot[];
}

/**
 * Interface for manager classes that require manual cleanup
 * when a scene is destroyed or restarted to prevent memory leaks.
 */
interface Manager {
  /**
   * Cleans up event listeners, timers, and references.
   */
  destroy(): void;
}

export type {
  TileID,
  GridPosition,
  GridMove,
  GravityMove,
  EmptySlot,
  GravityResult,
  Manager,
};
