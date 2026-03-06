import { GameObjects, Scene, Geom, Input } from "phaser";
import { BaseLayoutArea } from "./BaseLayoutArea";

/**
 * Base class for all full-screen UI overlays (Modals).
 * It provides a dimmed background, fade animations, and a dedicated
 * input blocker to prevent interaction with the game board underneath.
 */
export abstract class BaseOverlay extends BaseLayoutArea {
  /** Semi-transparent black rectangle to dim the game scene */
  protected background: GameObjects.Graphics;
  /** Tracks the visibility state for logic and transitions */
  protected isShown: boolean = false;
  /** Invisible zone that captures and stops all pointer events from bubbling down */
  private inputBlocker: GameObjects.Zone;

  /**
   * @param scene - The Phaser Scene this overlay belongs to.
   */
  constructor(scene: Scene) {
    super(scene);

    // 1. Initialize the dimmer background
    this.background = scene.add.graphics();
    this.add(this.background);

    // 2. Initialize the input blocker zone
    this.inputBlocker = scene.add.zone(0, 0, 1, 1).setOrigin(0);
    this.inputBlocker.setInteractive();

    // Prevent any clicks on the overlay from reaching the tiles/buttons behind it
    this.inputBlocker.on(
      Input.Events.POINTER_DOWN,
      (
        _pointer: Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
      },
    );

    this.add(this.inputBlocker);

    // Ensure background and blocker stay behind the overlay content (e.g., text, buttons)
    this.sendToBack(this.inputBlocker);
    this.sendToBack(this.background);

    // 3. Set default hidden state
    this.setVisible(false);
    this.setAlpha(0);
    this.setDepth(1000); // High depth to stay above HUD and Game Board

    scene.add.existing(this);
  }

  /**
   * Triggers the fade-in animation and enables the input blocker.
   * * @param rect - The full screen dimensions provided by the LayoutManager.
   */
  public show(rect: Geom.Rectangle): void {
    this.isShown = true;
    this.setVisible(true);

    // Update dimensions for the background dimmer and the input blocker
    this.drawDimmer(rect);

    this.inputBlocker.setSize(rect.width, rect.height);
    this.inputBlocker.setPosition(0, 0);

    // Start fade-in tween
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 200,
      ease: "Power2",
    });

    this.onShow();
  }

  /**
   * Triggers the fade-out animation and disables interactivity.
   */
  public hide(): void {
    this.isShown = false;

    // Stop capturing inputs immediately
    this.inputBlocker.disableInteractive();

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

  /**
   * Draws the semi-transparent black overlay background.
   * * @param rect - The area to cover.
   */
  protected drawDimmer(rect: Geom.Rectangle): void {
    this.background.clear();
    this.background.fillStyle(0x000000, 0.7);
    this.background.fillRect(0, 0, rect.width, rect.height);
  }

  /**
   * To be implemented by subclasses. Handles repositioning of
   * internal elements and font size updates during screen resize.
   * * @param rect - The new bounds.
   */
  public abstract resize(rect: Geom.Rectangle): void;

  /**
   * Lifecycle hook: executed when the show animation starts.
   */
  protected onShow(): void {}

  /**
   * Lifecycle hook: executed after the hide animation completes.
   */
  protected onHide(): void {}
}
