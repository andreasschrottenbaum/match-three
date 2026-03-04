import { Scene, GameObjects } from "phaser";
import Constants from "../config/Constants";
import { UIUtils } from "./UIUtils";

/**
 * A responsive full-screen UI overlay displayed when no moves are left.
 * Refactored to use UIUtils for consistent styling and interactions.
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

    // 1. Background Dimmer
    this.bg = scene.add
      .rectangle(0, 0, width, height, 0x000000, 0.75)
      .setOrigin(0)
      .setInteractive();

    // 2. Center Content Setup
    const title = UIUtils.addText(this.scene, 0, -120, "NO MORE MOVES", "64px")
      .setFontStyle("bold")
      .setColor("#ffffff");

    const scoreText = UIUtils.addText(
      this.scene,
      0,
      -20,
      `Score: ${finalScore}`,
      "48px",
    ).setColor("#00ff00");

    // 3. Restart Button via UIUtils
    const restartBtn = UIUtils.createButton(
      this.scene,
      0,
      110,
      "RESTART",
      () => {
        this.scene.scale.off("resize", this.reposition, this);
        this.hide(onRestart);
      },
    );

    // Grouping
    this.contentContainer = scene.add.container(width / 2, height / 2, [
      title,
      scoreText,
      restartBtn,
    ]);

    this.container = scene.add.container(0, 0, [
      this.bg,
      this.contentContainer,
    ]);

    this.container.setAlpha(0).setDepth(Constants.DEPTH_LAYERS.OVERLAY);

    // Listen for Resize to keep it centered
    this.scene.scale.on("resize", this.reposition, this);

    // Initial check for scaling
    this.reposition();
    this.show();
  }

  /**
   * Adjusts UI positions and scales text if the screen is too narrow.
   */
  private reposition(): void {
    const { width, height } = this.scene.cameras.main;

    this.bg.setSize(width, height);
    this.contentContainer.setPosition(width / 2, height / 2);

    const title = this.contentContainer.list[0] as GameObjects.Text;
    const scoreText = this.contentContainer.list[1] as GameObjects.Text;
    const maxWidth = width * 0.85;

    // Auto-Scale text for small mobile screens
    [title, scoreText].forEach((text) => {
      if (text.width > maxWidth) {
        text.setScale(maxWidth / text.width);
      } else {
        text.setScale(1);
      }
    });
  }

  private show(): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 500,
      ease: "Back.easeOut",
    });
  }

  private hide(onComplete: () => void): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 250,
      onComplete: () => {
        this.container.destroy();
        onComplete();
      },
    });
  }
}
