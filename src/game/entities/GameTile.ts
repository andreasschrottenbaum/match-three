import { Scene, GameObjects } from "phaser";
import type { TileID, GridPosition } from "../types";

/**
 * Visual representation of a single tile.
 * Uses a Container to group the sprite and selection effects.
 */
export class GameTile extends GameObjects.Container {
  public tileID: TileID;
  /** The internal sprite showing the tile texture */
  private sprite: GameObjects.Sprite;
  /** Current logical position on the board */
  public gridPosition: GridPosition;

  /**
   * @param scene - The Phaser Scene
   * @param x - World X position
   * @param y - World Y position
   * @param tileID - The frame ID/Type of the tile
   * @param row - Grid row
   * @param col - Grid column
   * @param size - Display size in pixels
   */
  constructor(
    scene: Scene,
    x: number,
    y: number,
    id: TileID,
    row: number,
    col: number,
    size: number,
  ) {
    super(scene, x, y);

    this.tileID = id;
    this.gridPosition = { row, col };

    this.sprite = scene.add.sprite(0, 0, "tiles", id);
    this.sprite.setDisplaySize(size, size);
    this.add(this.sprite);

    scene.add.existing(this);
  }

  /**
   * Updates the tile's visual ID (frame).
   * Used during initial board clearing.
   */
  public updateVisual(newID: TileID): void {
    this.tileID = newID;
    this.sprite.setFrame(newID);
  }

  /**
   * Toggles the selection state (scale up and outline).
   */
  public setSelected(selected: boolean): void {
    if (selected) {
      this.scene.children.bringToTop(this);

      this.scene.tweens.add({
        targets: this,
        scale: 1.2,
        duration: 100,
        ease: "Back.easeOut",
      });
      this.sprite.setTint(0xdddddd);
    } else {
      this.scene.tweens.add({
        targets: this,
        scale: 1.0,
        duration: 100,
        ease: "Power2",
      });
      this.sprite.clearTint();
    }
  }

  /**
   * Animates the tile to a new world position.
   */
  public animateTo(
    row: number,
    col: number,
    x: number,
    y: number,
    duration: number = 300,
  ): void {
    this.gridPosition = { row, col };
    this.scene.tweens.add({
      targets: this,
      x,
      y,
      duration,
      ease: "Back.easeOut",
    });
  }

  /**
   * Plays a "pop" animation and destroys the tile.
   */
  public popAndDestroy(): void {
    this.scene.tweens.add({
      targets: this,
      scale: 0,
      alpha: 0,
      duration: 200,
      ease: "Back.easeIn",
      onComplete: () => this.destroy(),
    });
  }
}
