import { Scene } from "phaser";
import { Tile } from "../entities/Tile";

/**
 * Handles all visual transitions and animations for the grid tiles.
 */
export class GridAnimator {
  constructor(private scene: Scene) {}

  /**
   * Animates a swap between two tile GameObjects.
   * If the swap is invalid, it performs a 'shake' or 'return' animation.
   */
  public swap(
    tileA: Tile,
    tileB: Tile,
    isValid: boolean,
    onComplete: () => void,
  ): void {
    // Primary swap move
    this.scene.tweens.add({
      targets: tileA,
      x: tileB.x,
      y: tileB.y,
      duration: 300,
      ease: "Back.easeOut",
    });

    this.scene.tweens.add({
      targets: tileB,
      x: tileA.x,
      y: tileA.y,
      duration: 300,
      ease: "Back.easeOut",
      onComplete: () => {
        if (!isValid) {
          // Return to original positions if move was illegal
          this.scene.tweens.add({
            targets: [tileA, tileB],
            x: (target: any) => (target === tileA ? tileB.x : tileA.x),
            y: (target: any) => (target === tileA ? tileB.y : tileA.y),
            duration: 200,
            delay: 100,
            onComplete,
          });
        } else {
          onComplete();
        }
      },
    });
  }

  /**
   * Animates a tile dropping down (gravity) or spawning into the grid.
   */
  public drop(
    tile: Tile,
    targetY: number,
    delay: number = 0,
    onComplete?: () => void,
  ): void {
    this.scene.tweens.add({
      targets: tile,
      y: targetY,
      duration: 400,
      delay,
      ease: "Bounce.easeOut",
      onComplete,
    });
  }

  /**
   * Performs a shrink and fade-out animation when a tile is matched.
   */
  public destroy(tile: Tile, onComplete: () => void): void {
    this.scene.tweens.add({
      targets: tile,
      scale: 0,
      alpha: 0,
      duration: 200,
      onComplete,
    });
  }
}
