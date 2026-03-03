import { GameTile } from "../entities/GameTile";
import { GridUtils } from "../logic/GridUtils";

import type { MatchThree } from "../scenes/MatchThree";

export type SwipeData = {
  tile: GameTile;
  direction: { row: number; col: number };
};

export class InputManager {
  private selectedTile: GameTile | null = null;
  private isEnabled: boolean = true;
  private readonly threshold = 30;

  constructor(
    private scene: MatchThree,
    private gridConfig: {
      gridSize: number;
      tileSize: number;
      offsetX: number;
      offsetY: number;
    },
    private onSwipe: (data: SwipeData) => void,
  ) {
    this.setupEvents();
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  private setupEvents(): void {
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.isEnabled) return;

      const { row, col } = GridUtils.worldToGrid(
        pointer.x,
        pointer.y,
        this.gridConfig.tileSize,
        this.gridConfig.offsetX,
        this.gridConfig.offsetY,
      );

      const tile = this.scene.getTileAt(row, col);
      if (tile) {
        this.selectedTile = tile;
        this.selectedTile.setSelected(true);
      }
    });

    this.scene.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (!this.selectedTile || !this.isEnabled) return;

      this.selectedTile.setSelected(false);

      const diffX = pointer.x - this.selectedTile.x;
      const diffY = pointer.y - this.selectedTile.y;

      if (
        Math.abs(diffX) > this.threshold ||
        Math.abs(diffY) > this.threshold
      ) {
        let dr = 0;
        let dc = 0;

        if (Math.abs(diffX) > Math.abs(diffY)) {
          dc = diffX > 0 ? 1 : -1;
        } else {
          dr = diffY > 0 ? 1 : -1;
        }

        this.onSwipe({
          tile: this.selectedTile,
          direction: { row: dr, col: dc },
        });
      }

      this.selectedTile = null;
    });
  }
}
