import { GameObjects, Scene, Input, Geom } from "phaser";
import { COLORS, getNumColor } from "../config/Theme";

/**
 * Configuration for the LayoutButton
 */
export type ButtonConfig = {
  text: string;
  width?: number;
  height?: number;
  callback: () => void;
};

type InternalButtonConfig = Required<ButtonConfig>;

/**
 * A responsive button component that handles its own interaction states
 * and supports resizing.
 */
export class Button extends GameObjects.Container {
  private background: GameObjects.Graphics;
  private label: GameObjects.Text;
  private config: InternalButtonConfig;

  constructor(scene: Scene, x: number, y: number, config: ButtonConfig) {
    super(scene, x, y);

    this.config = {
      width: 0,
      height: 0,
      ...config,
    } as InternalButtonConfig;

    // 1. Initialize background graphics
    this.background = scene.add.graphics();
    this.drawState(getNumColor(COLORS.UI_BG_LIGHT), 1);

    // 2. Initialize text label
    this.label = scene.add.text(0, 0, config.text).setOrigin(0.5);

    // Add components to the container
    this.add([this.background, this.label]);

    // 3. Define the hit area (centered around 0,0)
    this.setInteractive(
      new Geom.Rectangle(
        -this.config.width / 2,
        -this.config.height / 2,
        config.width,
        config.height,
      ),
      Geom.Rectangle.Contains,
    );

    this.setupEvents();

    // Add this container to the scene's display list
    scene.add.existing(this);
  }

  /**
   * Set up pointer events for hover and click states
   */
  private setupEvents(): void {
    // Hover state
    this.on(Input.Events.POINTER_OVER, () => {
      this.drawState(getNumColor(COLORS.SECONDARY), 1);
    });

    this.on(Input.Events.POINTER_OUT, () => {
      this.drawState(getNumColor(COLORS.UI_BG_LIGHT), 1);
    });

    // Click state
    this.on(Input.Events.POINTER_DOWN, () => {
      this.setScale(0.95); // Small "push" effect
      this.config.callback();
    });

    // Reset scale on release
    this.on(Input.Events.POINTER_UP, () => this.setScale(1));
    this.on(Input.Events.POINTER_OUT, () => this.setScale(1));
  }

  /**
   * Draws the button background based on current size and color
   */
  private drawState(color: number, alpha: number): void {
    const { width, height } = this.config;
    this.background.clear();

    // Fill
    this.background.fillStyle(color, alpha);
    this.background.fillRoundedRect(-width / 2, -height / 2, width, height, 8);

    // Border
    this.background.lineStyle(2, getNumColor(COLORS.BLACK), 0.2);
    this.background.strokeRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      8,
    );
  }

  /**
   * Public method to resize the button and its hit area during layout updates
   */
  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;

    // Redraw with current background color logic
    this.drawState(getNumColor(COLORS.UI_BG_LIGHT), 1);

    // Update the interactive area to match new dimensions
    if (this.input && this.input.hitArea) {
      (this.input.hitArea as Geom.Rectangle).setTo(
        -width / 2,
        -height / 2,
        width,
        height,
      );
    }
  }
}
