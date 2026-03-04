import { Scene, GameObjects } from "phaser";
import type { TileID, GridPosition } from "../types";
import Constants from "../config/Constants";

/**
 * Visual representation of a single tile.
 * Uses a Container to group the sprite and selection effects.
 */
export class GameTile extends GameObjects.Container {
  public tileID: TileID;
  /** The internal sprite showing the tile texture */
  private sprite: GameObjects.Sprite;
  /** Track current responsive scale */
  private baseScale: number = 1;
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
    this.sprite.setOrigin(0.5);
    this.add(this.sprite);

    const shadow = scene.add.sprite(4, 4, "tiles", id); // 4px Versatz
    shadow.setTint(0xffffff);
    shadow.setAlpha(0.3);
    this.addAt(shadow, 0);

    this.baseScale = size / Constants.SPRITE_SIZE;
    this.setScale(this.baseScale);

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
   * Updates the base scale after a resize.
   */
  public setBaseScale(s: number): void {
    this.baseScale = s;
    // If not currently selected, apply immediately
    this.setScale(s);
  }

  /**
   * Toggles the selection state (scale up and outline).
   */
  public setSelected(selected: boolean): void {
    if (selected) {
      this.scene.children.bringToTop(this);
      this.scene.tweens.add({
        targets: this,
        scale: this.baseScale * 1.2, // Scale relative to current base
        duration: 100,
        ease: "Back.easeOut",
      });
      this.sprite.setTint(0xdddddd);
    } else {
      this.scene.tweens.add({
        targets: this,
        scale: this.baseScale, // Return to base
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
