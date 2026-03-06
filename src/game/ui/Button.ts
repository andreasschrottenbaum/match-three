import { GameObjects, Scene, Input, Geom } from "phaser";
import { COLORS, getNumColor } from "../config/Theme";
import { GameText } from "./GameText";

/**
 * Configuration for the LayoutButton component.
 */
export type ButtonConfig = {
  /** The string to display inside the button */
  text: string;
  /** Fixed width of the button; if omitted, resize() should be called by the layout area */
  width?: number;
  /** Fixed height of the button */
  height?: number;
  /** Execution logic triggered on pointer down/click */
  callback: () => void;
};

/** Internal configuration ensuring width/height are present */
type InternalButtonConfig = Required<ButtonConfig>;

/**
 * A responsive button component that handles its own interaction states,
 * visual feedback, and supports dynamic resizing within the LayoutManager system.
 */
export class Button extends GameObjects.Container {
  /** The background graphics object providing the shape and color */
  private background: GameObjects.Graphics;
  /** The specialized GameText instance for the button label */
  private label: GameText;
  /** Internal copy of config for size tracking */
  private config: InternalButtonConfig;
  /** Track whether the button is currently clickable */
  private isEnabled: boolean = true;

  /**
   * @param scene - The active Phaser scene.
   * @param x - Initial horizontal position.
   * @param y - Initial vertical position.
   * @param config - Button initialization settings.
   */
  constructor(scene: Scene, x: number, y: number, config: ButtonConfig) {
    super(scene, x, y);

    this.config = {
      width: config.width || 0,
      height: config.height || 0,
      ...config,
    } as InternalButtonConfig;

    // 1. Initialize background graphics
    this.background = scene.add.graphics();
    this.drawState(getNumColor(COLORS.UI_BG_LIGHT), 1);

    // 2. Initialize text label using the GameText class for responsive scaling
    this.label = new GameText(scene, config.text, {
      fontSizeFactor: 0.025,
    }).setOrigin(0.5);

    // Add components to the container
    this.add([this.background, this.label]);

    // 3. Define the hit area (centered around the container's 0,0)
    this.setInteractive(
      new Geom.Rectangle(
        -this.config.width / 2,
        -this.config.height / 2,
        this.config.width,
        this.config.height,
      ),
      Geom.Rectangle.Contains,
    );

    this.setupEvents();

    // Register with scene display list
    scene.add.existing(this);
  }

  /**
   * Updates the button's label text.
   * @param text - The new string to display.
   */
  public setText(text: string): void {
    this.label.setText(text);
  }

  /**
   * Toggles the button's interactivity and visual state.
   * @param disabled - If true, the button becomes unclickable and desaturated.
   */
  public setDisabled(disabled: boolean): void {
    this.isEnabled = !disabled;

    if (disabled) {
      this.disableInteractive();
      this.setAlpha(0.5); // Visual feedback: Grayed out
      this.drawState(0x666666, 1);
    } else {
      this.setInteractive();
      this.setAlpha(1.0);
      this.drawState(getNumColor(COLORS.UI_BG_LIGHT), 1);
    }
  }

  /**
   * Attaches pointer events to handle hover, click, and release states.
   */
  private setupEvents(): void {
    // Hover visuals
    this.on(Input.Events.POINTER_OVER, () => {
      if (!this.isEnabled) return;
      this.drawState(getNumColor(COLORS.SECONDARY), 1);
    });

    this.on(Input.Events.POINTER_OUT, () => {
      this.drawState(getNumColor(COLORS.UI_BG_LIGHT), 1);
      this.setScale(1); // Ensure scale resets if pointer leaves while down
    });

    // Interaction logic
    this.on(
      Input.Events.POINTER_DOWN,
      (
        _pointer: Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
        this.setScale(0.95); // Small "tactile push" effect
        this.config.callback();
      },
    );

    // Reset feedback scale on release
    this.on(Input.Events.POINTER_UP, () => this.setScale(1));
  }

  /**
   * Redraws the background graphics using the current dimensions and color.
   * @param color - The hexadecimal fill color.
   * @param alpha - Fill transparency.
   */
  private drawState(color: number, alpha: number): void {
    const { width, height } = this.config;
    this.background.clear();

    // Main Fill
    this.background.fillStyle(color, alpha);
    this.background.fillRoundedRect(-width / 2, -height / 2, width, height, 8);

    // Subtle Outline
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
   * Resizes the button components and updates the interactive hit area.
   * Should be called by the parent LayoutArea during resize events.
   *
   * @param width - New width in pixels.
   * @param height - New height in pixels.
   */
  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;

    // Delegate font scaling and text wrapping update to GameText
    this.label.resize();

    // Redraw geometry to match new dimensions
    this.drawState(getNumColor(COLORS.UI_BG_LIGHT), 1);

    // Recalculate hit area to prevent dead zones or oversized triggers
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
