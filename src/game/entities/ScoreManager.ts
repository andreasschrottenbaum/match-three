import { Scene, GameObjects } from "phaser";
import Constants from "../config/Constants";
import { Manager } from "../types";

/**
 * Handles scoring logic and visual UI feedback.
 * Keeps the main Scene file lean and focused on gameplay.
 */
export class ScoreManager implements Manager {
  private scene: Scene;
  private score: number = 0;
  private scoreText!: GameObjects.Text;

  constructor(scene: Scene) {
    this.scene = scene;
    this.setupUI();
  }

  /**
   * Initializes the static score display.
   */
  private setupUI(): void {
    this.scoreText = this.scene.add.text(20, 20, "Score: 0", {
      ...Constants.DEFAULT_FONT,
      fontSize: "32px",
      fontStyle: "bold",
    });
  }

  /**
   * Adds points and triggers visual feedback.
   * @param points - Points to add.
   * @param x - Horizontal position for floating text.
   * @param y - Vertical position for floating text.
   */
  public addPoints(points: number, x: number, y: number): void {
    this.score += points;
    this.scoreText.setText(`Score: ${this.score}`);

    this.showFloatingText(x, y, `+${points}`);

    // Slight "juice" effect on the main score label
    this.scene.tweens.add({
      targets: this.scoreText,
      scale: 1.1,
      duration: 100,
      yoyo: true,
    });
  }

  /**
   * Creates a rising, fading text effect at the given position.
   */
  private showFloatingText(x: number, y: number, message: string): void {
    const popup = this.scene.add
      .text(x, y, message, {
        ...Constants.DEFAULT_FONT,
        fontSize: "40px",
        color: "#ffcc00",
        fontStyle: "bold",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.scene.tweens.add({
      targets: popup,
      y: y - 120,
      alpha: 0,
      duration: 1000,
      ease: "Cubic.easeOut",
      onComplete: () => popup.destroy(),
    });
  }

  /**
   * Cleans up any active references.
   * Although scoreText is managed by the scene, this provides a hook
   * for stopping persistent effects if added later.
   */
  public destroy(): void {}

  /**
   * Returns the current total score.
   */
  public get currentScore(): number {
    return this.score;
  }

  /**
   * Returns the main text game object for external layout adjustments.
   */
  public get element(): GameObjects.Text {
    return this.scoreText;
  }
}
