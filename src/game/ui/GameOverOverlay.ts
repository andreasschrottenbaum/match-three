import { Scene, GameObjects } from "phaser";

/**
 * A responsive full-screen UI overlay displayed when no moves are left.
 */
export class GameOverOverlay {
  private container: GameObjects.Container;
  private bg: GameObjects.Rectangle;
  private contentContainer: GameObjects.Container;

  constructor(
    private scene: Scene,
    finalScore: number,
    onRestart: () => void,
  ) {
    const { width, height } = scene.cameras.main;

    // 1. Background Dimmer (Full screen)
    this.bg = scene.add
      .rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0)
      .setInteractive(); // Block input

    // 2. Content Container (Centered elements)
    const title = scene.add
      .text(0, -100, "NO MORE MOVES", {
        fontSize: "64px",
        fontStyle: "bold",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    const scoreText = scene.add
      .text(0, 0, `Score: ${finalScore}`, {
        fontSize: "42px",
        color: "#00ff00",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    // 3. Restart Button
    const btnBg = scene.add
      .rectangle(0, 100, 250, 80, 0xffffff, 1)
      .setInteractive({ useHandCursor: true });

    const btnText = scene.add
      .text(0, 100, "RESTART", {
        fontSize: "32px",
        color: "#000000",
        fontStyle: "bold",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    // Grouping central UI elements
    this.contentContainer = scene.add.container(width / 2, height / 2, [
      title,
      scoreText,
      btnBg,
      btnText,
    ]);

    // 4. Interactions
    btnBg.on("pointerover", () => btnBg.setFillStyle(0xdddddd));
    btnBg.on("pointerout", () => btnBg.setFillStyle(0xffffff));
    btnBg.on("pointerdown", () => {
      this.scene.scale.off("resize", this.reposition, this); // Clean up listener
      this.hide(onRestart);
    });

    // Main Container
    this.container = scene.add.container(0, 0, [
      this.bg,
      this.contentContainer,
    ]);
    this.container.setAlpha(0).setDepth(2000);

    // 5. Listen for Resize
    this.scene.scale.on("resize", this.reposition, this);

    this.show();
  }

  /**
   * Adjusts UI positions when the screen size changes.
   */
  private reposition(): void {
    const { width, height } = this.scene.cameras.main;

    // Resize background to cover new screen dimensions
    this.bg.setSize(width, height);

    // Re-center the content group
    this.contentContainer.setPosition(width / 2, height / 2);
  }

  private show(): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 500,
      ease: "Power2",
    });
  }

  private hide(onComplete: () => void): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 300,
      ease: "Power2",
      onComplete: () => {
        this.container.destroy();
        onComplete();
      },
    });
  }
}
