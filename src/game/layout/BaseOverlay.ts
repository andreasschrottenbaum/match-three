import { GameObjects, Scene, Geom } from "phaser";
import { BaseLayoutArea } from "./BaseLayoutArea";

/**
 * Base class for all full-screen overlays.
 * It automatically blocks input to layers below.
 */
export abstract class BaseOverlay extends BaseLayoutArea {
  protected background: GameObjects.Graphics;
  protected isShown: boolean = false;

  constructor(scene: Scene) {
    super(scene);

    // 1. Full-screen background dimmer
    this.background = scene.add.graphics();
    this.add(this.background);

    // 2. Hide by default
    this.setVisible(false);
    this.setAlpha(0);
    this.setDepth(1000); // Always stay on top

    scene.add.existing(this);
  }

  /**
   * Opens the overlay with a fade-in effect.
   */
  public show(rect: Geom.Rectangle): void {
    this.isShown = true;
    this.setVisible(true);

    // Draw background and make interactive to block underlying input
    this.drawDimmer(rect);
    this.setInteractive(rect, Geom.Rectangle.Contains);

    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 200,
      ease: "Power2",
    });

    this.onShow();
  }

  /**
   * Closes the overlay with a fade-out effect.
   */
  public hide(): void {
    this.isShown = false;
    this.disableInteractive();

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 200,
      ease: "Power2",
      onComplete: () => {
        this.setVisible(false);
        this.onHide();
      },
    });
  }

  protected drawDimmer(rect: Geom.Rectangle): void {
    this.background.clear();
    this.background.fillStyle(0x000000, 0.7); // Dark semi-transparent
    this.background.fillRect(0, 0, rect.width, rect.height);
  }

  /**
   * Called by the LayoutManager during screen resize.
   */
  public abstract resize(rect: Geom.Rectangle): void;

  // Optional Hooks for subclasses
  protected onShow(): void {}
  protected onHide(): void {}
}
