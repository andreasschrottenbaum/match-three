import { GridPosition } from "../types";
import { GameConfig } from "../config/GameConfig";
import { Input } from "phaser";

/**
 * Handles all user input interactions for the grid, including clicks and swipes.
 * Decouples raw Phaser input events from the game logic.
 */
export class GridInputHandler {
  private firstSelection: GridPosition | null = null;
  private isDragging = false;
  private dragStartPos: { x: number; y: number } | null = null;
  private readonly SWIPE_THRESHOLD = 30;

  /**
   * @param scene - The active Phaser scene.
   * @param container - The container holding the grid (used for coordinate transformation).
   * @param getMetrics - A callback to retrieve the current grid layout metrics (offsets/cell size).
   */
  constructor(
    private scene: Phaser.Scene,
    private container: Phaser.GameObjects.Container,
    private getMetrics: () => {
      offsetX: number;
      offsetY: number;
      cellSize: number;
    },
  ) {}

  /**
   * Registers pointer events and maps them to grid selection and swap actions.
   */
  public attach(
    onSelect: (pos: GridPosition | null) => void,
    onSwap: (a: GridPosition, b: GridPosition) => void,
  ): void {
    this.scene.input.on(
      Input.Events.POINTER_DOWN,
      (p: Phaser.Input.Pointer) => {
        const pos = this.getGridPos(p);
        if (!pos) return;

        this.isDragging = true;
        this.dragStartPos = { x: p.x, y: p.y };

        if (!this.firstSelection) {
          this.firstSelection = pos;
          onSelect(pos);
        } else if (this.areNeighbors(this.firstSelection, pos)) {
          onSwap(this.firstSelection, pos);
          this.resetSelection(onSelect);
        } else {
          // Change selection to the new tile
          this.firstSelection = pos;
          onSelect(pos);
        }
      },
    );

    this.scene.input.on(
      Input.Events.POINTER_MOVE,
      (p: Phaser.Input.Pointer) => {
        if (!this.isDragging || !this.dragStartPos || !this.firstSelection)
          return;

        const dx = p.x - this.dragStartPos.x;
        const dy = p.y - this.dragStartPos.y;

        // Check if the drag distance exceeds the threshold for a swipe
        if (
          Math.abs(dx) > this.SWIPE_THRESHOLD ||
          Math.abs(dy) > this.SWIPE_THRESHOLD
        ) {
          this.handleSwipe(dx, dy, onSwap, onSelect);
          this.isDragging = false;
        }
      },
    );

    this.scene.input.on(Input.Events.POINTER_UP, () => {
      this.isDragging = false;
    });
  }

  /**
   * Determines swipe direction and triggers a swap if within bounds.
   */
  private handleSwipe(
    dx: number,
    dy: number,
    onSwap: (a: GridPosition, b: GridPosition) => void,
    onSelect: (pos: GridPosition | null) => void,
  ): void {
    if (!this.firstSelection) return;
    const target = { ...this.firstSelection };

    // Determine primary axis of movement
    if (Math.abs(dx) > Math.abs(dy)) {
      target.col += dx > 0 ? 1 : -1;
    } else {
      target.row += dy > 0 ? 1 : -1;
    }

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
   * Clears the current selection state.
   */
  public resetSelection(onSelect: (pos: GridPosition | null) => void): void {
    this.firstSelection = null;
    onSelect(null);
  }

  /**
   * Calculates the grid coordinates (row/col) from a world-space pointer position.
   */
  public getGridPos(p: Phaser.Input.Pointer): GridPosition | null {
    const localPoint = new Phaser.Math.Vector2();
    // Convert world pointer coordinates to the local space of the grid container
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
   * Checks if two grid positions are immediately adjacent (not diagonal).
   */
  public areNeighbors(posA: GridPosition, posB: GridPosition): boolean {
    return Math.abs(posA.row - posB.row) + Math.abs(posA.col - posB.col) === 1;
  }
}
