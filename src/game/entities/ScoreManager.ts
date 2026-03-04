import { Scene, GameObjects } from "phaser";
import { UIUtils } from "../ui/UIUtils";
import { Manager } from "../types";

/**
 * Handles scoring logic and visual UI feedback.
 * Implements the Manager interface for lifecycle safety.
 */
export class ScoreManager implements Manager {
  private score: number = 0;
  private scoreText!: GameObjects.Text;

  constructor(private scene: Scene) {
    this.setupUI();
  }

  /**
   * The Element which displays "Score: <points>"
   */
  public get element(): GameObjects.Text {
    return this.scoreText;
  }

  /**
   * Initializes the score display using UIUtils.
   */
  private setupUI(): void {
    this.scoreText = UIUtils.addText(this.scene, 20, 20, "Score: 0", "32px")
      .setOrigin(0) // Align to top-left
      .setScrollFactor(0);
  }

  /**
   * Adds points and triggers a popup effect via UIUtils.
   */
  public addPoints(points: number, x: number, y: number): void {
    this.score += points;
    this.scoreText.setText(`Score: ${this.score}`);

    // Create a juicy floating text
    const popup = UIUtils.addText(this.scene, x, y, `+${points}`, "40px")
      .setColor("#ffcc00")
      .setStroke("#000000", 6);

    this.scene.tweens.add({
      targets: popup,
      y: y - 120,
      alpha: 0,
      duration: 1000,
      ease: "Cubic.easeOut",
      onComplete: () => popup.destroy(),
    });

    // Main label bounce
    this.scene.tweens.add({
      targets: this.scoreText,
      scale: 1.1,
      duration: 100,
      yoyo: true,
    });
  }

  /**
   * Cleans up references when the scene shuts down.
   */
  public destroy(): void {
    this.scoreText?.destroy();
  }

  public get currentScore(): number {
    return this.score;
  }
}
