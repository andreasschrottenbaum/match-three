export abstract class BaseLayoutArea extends Phaser.GameObjects.Container {
  protected background: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    super(scene);
    this.background = scene.add.graphics();
    this.add(this.background);
    scene.add.existing(this);
  }

  /**
   * Each area must define, how it reacts to size changes.
   * @param rect The size calculated by the LayoutManager
   */
  abstract resize(rect: Phaser.Geom.Rectangle): void;

  // Helper Method for all Areas
  protected drawBackground(
    rect: Phaser.Geom.Rectangle,
    color: number,
    alpha: number = 1,
  ): void {
    this.background.clear();
    this.background.fillStyle(color, alpha);
    this.background.fillRect(0, 0, rect.width, rect.height);
  }
}
