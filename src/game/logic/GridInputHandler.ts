import { GridPosition } from "../types";
import { GameConfig } from "../config/GameConfig";
import { Input, Math as PhaserMath, GameObjects } from "phaser";

/**
 * Handles all user input interactions for the grid, including clicks and swipes.
 * Decouples raw Phaser input events from the game logic by providing high-level callbacks.
 */
export class GridInputHandler {
  /** The currently selected grid position, if any */
  private firstSelection: GridPosition | null = null;
  /** State flag to track if the user is currently performing a drag/swipe gesture */
  private isDragging = false;
  /** The world coordinates where the current drag gesture started */
  private dragStartPos: { x: number; y: number } | null = null;
  /** Minimum pixel distance to travel before a movement is considered a 'swipe' */
  private readonly SWIPE_THRESHOLD = 30;

  /**
   * @param scene - The active Phaser scene instance.
   * @param container - The container holding the grid (used for coordinate transformation).
   * @param getMetrics - Callback to retrieve current layout data (offsets/cell size) for accurate hit-testing.
   */
  constructor(
    private scene: Phaser.Scene,
    private container: GameObjects.Container,
    private getMetrics: () => {
      offsetX: number;
      offsetY: number;
      cellSize: number;
    },
  ) {}

  /**
   * Registers pointer events and maps them to grid selection and swap actions.
   *
   * @param onSelect - Triggered when a tile is highlighted or selection is cleared.
   * @param onSwap - Triggered when two tiles are successfully identified as swap candidates.
   */
  public attach(
    onSelect: (pos: GridPosition | null) => void,
    onSwap: (a: GridPosition, b: GridPosition) => void,
  ): void {
    // Primary interaction: Tap/Click
    this.scene.input.on(Input.Events.POINTER_DOWN, (p: Input.Pointer) => {
      const pos = this.getGridPos(p);
      if (!pos) return;

      this.isDragging = true;
      this.dragStartPos = { x: p.x, y: p.y };

      if (!this.firstSelection) {
        // Initial selection
        this.firstSelection = pos;
        onSelect(pos);
      } else if (this.areNeighbors(this.firstSelection, pos)) {
        // Direct tap on a neighbor triggers a swap
        onSwap(this.firstSelection, pos);
        this.resetSelection(onSelect);
      } else {
        // Tap on a non-neighbor tile changes the selection focus
        this.firstSelection = pos;
        onSelect(pos);
      }
    });

    // Gesture detection: Swipe
    this.scene.input.on(Input.Events.POINTER_MOVE, (p: Input.Pointer) => {
      if (!this.isDragging || !this.dragStartPos || !this.firstSelection)
        return;

      const dx = p.x - this.dragStartPos.x;
      const dy = p.y - this.dragStartPos.y;

      // Determine if movement is significant enough to be a swipe
      if (
        Math.abs(dx) > this.SWIPE_THRESHOLD ||
        Math.abs(dy) > this.SWIPE_THRESHOLD
      ) {
        this.handleSwipe(dx, dy, onSwap, onSelect);
        this.isDragging = false; // Prevents multiple swaps from a single gesture
      }
    });

    this.scene.input.on(Input.Events.POINTER_UP, () => {
      this.isDragging = false;
    });
  }

  /**
   * Logic for determining swipe direction (Up, Down, Left, Right).
   *
   * @param dx - Horizontal delta of the pointer move.
   * @param dy - Vertical delta of the pointer move.
   * @param onSwap - Callback for valid swaps.
   * @param onSelect - Callback for resetting selection state.
   */
  private handleSwipe(
    dx: number,
    dy: number,
    onSwap: (a: GridPosition, b: GridPosition) => void,
    onSelect: (pos: GridPosition | null) => void,
  ): void {
    if (!this.firstSelection) return;
    const target = { ...this.firstSelection };

    // Compare deltas to find the primary axis of movement
    if (Math.abs(dx) > Math.abs(dy)) {
      target.col += dx > 0 ? 1 : -1;
    } else {
      target.row += dy > 0 ? 1 : -1;
    }

    // Verify target is within grid boundaries
    const size = GameConfig.grid.size;
    if (
      target.col >= 0 &&
      target.col < size &&
      target.row >= 0 &&
      target.row < size
    ) {
      onSwap(this.firstSelection, target);
    }

    this.resetSelection(onSelect);
  }

  /**
   * Clears the current selection state internally and via the callback.
   *
   * @param onSelect - The selection update callback.
   */
  public resetSelection(onSelect: (pos: GridPosition | null) => void): void {
    this.firstSelection = null;
    onSelect(null);
  }

  /**
   * Calculates logic grid coordinates (row/col) from world-space screen position.
   * Takes container transformations (scaling/positioning) into account.
   *
   * @param p - The active pointer.
   * @returns The corresponding GridPosition or null if pointer is out of bounds.
   */
  public getGridPos(p: Input.Pointer): GridPosition | null {
    const localPoint = new PhaserMath.Vector2();

    // Apply inverse transformation to map screen-space to grid-local-space
    this.container.getWorldTransformMatrix().applyInverse(p.x, p.y, localPoint);

    const { offsetX, offsetY, cellSize } = this.getMetrics();
    const col = Math.floor((localPoint.x - offsetX) / cellSize);
    const row = Math.floor((localPoint.y - offsetY) / cellSize);

    const size = GameConfig.grid.size;
    return col >= 0 && col < size && row >= 0 && row < size
      ? { row, col }
      : null;
  }

  /**
   * Checks if two grid positions are immediately adjacent (Up, Down, Left, Right).
   * Uses Manhattan distance logic where the sum of deltas must equal exactly 1.
   *
   * @param posA - First position.
   * @param posB - Second position.
   * @returns True if neighbors, false otherwise.
   */
  public areNeighbors(posA: GridPosition, posB: GridPosition): boolean {
    return Math.abs(posA.row - posB.row) + Math.abs(posA.col - posB.col) === 1;
  }
}
