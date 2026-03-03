import { Scene, GameObjects } from "phaser";

/**
 * A full-screen UI overlay displayed when no moves are left.
 */
export class GameOverOverlay {
  private container: GameObjects.Container;

  /**
   * @param scene - The parent Phaser scene.
   * @param finalScore - The player's total score.
   * @param onRestart - Callback function when the restart button is clicked.
   */
  constructor(
    private scene: Scene,
    finalScore: number,
    onRestart: () => void,
  ) {
    const { width, height } = scene.cameras.main;

    // 1. Background Dimmer
    const bg = scene.add.rectangle(0, 0, width, height, 0x000000, 0.7);
    bg.setOrigin(0);
    bg.setInteractive(); // Blocks input to the board underneath

    // 2. Title Text
    const title = scene.add
      .text(width / 2, height / 2 - 100, "NO MORE MOVES", {
        fontSize: "64px",
        fontStyle: "bold",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    // 3. Score Text
    const scoreText = scene.add
      .text(width / 2, height / 2, `Score: ${finalScore}`, {
        fontSize: "42px",
        color: "#00ff00",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    // 4. Restart Button
    const buttonBg = scene.add
      .rectangle(0, 80, 250, 80, 0xffffff, 1)
      .setInteractive({ useHandCursor: true });

    const buttonText = scene.add
      .text(0, 80, "RESTART", {
        fontSize: "32px",
        color: "#000000",
        fontStyle: "bold",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    const buttonContainer = scene.add.container(width / 2, height / 2 + 100, [
      buttonBg,
      buttonText,
    ]);

    // 5. Button Interactions
    buttonBg.on("pointerover", () => buttonBg.setFillStyle(0xdddddd));
    buttonBg.on("pointerout", () => buttonBg.setFillStyle(0xffffff));
    buttonBg.on("pointerdown", () => {
      this.hide();
      onRestart();
    });

    // Main Container to manage the whole UI
    this.container = scene.add.container(0, 0, [
      bg,
      title,
      scoreText,
      buttonContainer,
    ]);
    this.container.setAlpha(0);
    this.container.setDepth(1000); // Ensure it's on top of everything

    this.show();
  }

  /**
   * Smoothly fades in the overlay.
   */
  private show(): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 500,
      ease: "Power2",
    });
  }

  /**
   * Smoothly fades out and destroys the overlay.
   */
  private hide(): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 300,
      ease: "Power2",
      onComplete: () => this.container.destroy(),
    });
  }
}
