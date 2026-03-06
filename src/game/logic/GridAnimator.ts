import { Scene } from "phaser";
import { Tile } from "../entities/Tile";

/**
 * Handles all visual transitions and animations for the grid tiles.
 * Acts as a bridge between the logical grid state and the visual representation.
 */
export class GridAnimator {
  /**
   * @param scene - The Phaser Scene instance used to create tweens.
   */
  constructor(private scene: Scene) {}

  /**
   * Animates a swap between two tile GameObjects.
   * If the swap is determined to be invalid by the logic controller,
   * it performs a 'return' animation to the original positions.
   *
   * @param tileA - The first tile involved in the swap.
   * @param tileB - The second tile involved in the swap.
   * @param isValid - Whether the move resulted in a match.
   * @param onComplete - Callback triggered after all animations finish.
   */
  public swap(
    tileA: Tile,
    tileB: Tile,
    isValid: boolean,
    onComplete: () => void,
  ): void {
    // Store original positions for a potential return animation
    const posA = { x: tileA.x, y: tileA.y };
    const posB = { x: tileB.x, y: tileB.y };

    // Move Tile A to B's position
    this.scene.tweens.add({
      targets: tileA,
      x: posB.x,
      y: posB.y,
      duration: 300,
      ease: "Back.easeOut",
    });

    // Move Tile B to A's position
    this.scene.tweens.add({
      targets: tileB,
      x: posA.x,
      y: posA.y,
      duration: 300,
      ease: "Back.easeOut",
      onComplete: () => {
        if (!isValid) {
          // If invalid, animate both tiles back to their starting coordinates
          this.scene.tweens.add({
            targets: [tileA, tileB],
            x: (target: Tile) => (target === tileA ? posA.x : posB.x),
            y: (target: Tile) => (target === tileA ? posA.y : posB.y),
            duration: 250,
            delay: 50,
            ease: "Quad.easeInOut",
            onComplete,
          });
        } else {
          onComplete();
        }
      },
    });
  }

  /**
   * Animates a tile dropping down due to gravity or spawning from the top.
   *
   * @param tile - The tile GameObject to animate.
   * @param targetY - The final vertical coordinate.
   * @param delay - Optional delay before the drop begins (useful for staggered column effects).
   * @param onComplete - Optional callback triggered after the bounce.
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
      duration: 450,
      delay,
      ease: "Bounce.easeOut",
      onComplete,
    });
  }

  /**
   * Performs a shrink and fade-out animation when a tile is matched and removed.
   *
   * @param tile - The tile to be destroyed.
   * @param onComplete - Callback to trigger removal from logic and memory.
   */
  public destroy(tile: Tile, onComplete: () => void): void {
    this.scene.tweens.add({
      targets: tile,
      scale: 0,
      alpha: 0,
      duration: 250,
      ease: "Back.easeIn",
      onComplete,
    });
  }
}
