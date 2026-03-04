import { Scene, GameObjects } from "phaser";
import Constants from "../config/Constants";

/**
 * Handles scoring logic and visual UI feedback.
 * Keeps the main Scene file lean and focused on gameplay.
 */
export class ScoreManager {
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

  public get currentScore(): number {
    return this.score;
  }

  public get element(): GameObjects.Text {
    return this.scoreText;
  }
}
