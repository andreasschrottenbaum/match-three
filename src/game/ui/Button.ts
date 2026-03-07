import { GameObjects, Scene, Input, Geom } from "phaser";
import { COLORS, getNumColor } from "../config/Theme";
import { GameText } from "./GameText";

/**
 * Configuration for the responsive Button component.
 */
export type ButtonConfig = {
  /** The string to display inside the button */
  text?: string;
  /** The texture key for the icon image */
  icon?: string;
  /** Optional notification badge text */
  badge?: string;
  /** Fixed width of the button */
  width?: number;
  /** Fixed height of the button */
  height?: number;
  /** Execution logic triggered on pointer down */
  callback: () => void;
};

/** Internal configuration with mandatory dimensions */
type InternalButtonConfig = Required<ButtonConfig>;

/**
 * A responsive button component supporting icons, labels, and badges.
 * Dynamically scales its content via the LayoutManager system.
 */
export class Button extends GameObjects.Container {
  /** Visual background of the button */
  private background: GameObjects.Graphics;
  /** Optional text label centered in the button */
  private label?: GameText;
  /** Optional icon image centered in the button */
  private icon?: GameObjects.Image;
  /** Optional notification text in the corner */
  private badge?: GameText;
  /** Circular background for the badge text */
  private badgeBg?: GameObjects.Graphics;
  /** Cached dimensions and settings */
  private config: InternalButtonConfig;
  /** Current interactivity state */
  private isEnabled: boolean = true;

  /**
   * @param scene - The active Phaser Scene.
   * @param x - Initial horizontal position.
   * @param y - Initial vertical position.
   * @param config - Button setup configuration.
   */
  constructor(scene: Scene, x: number, y: number, config: ButtonConfig) {
    super(scene, x, y);

    this.config = {
      width: config.width || 64,
      height: config.height || 64,
      text: "",
      icon: "",
      badge: "",
      ...config,
    };

    // 1. Initialize core visual layers
    this.background = scene.add.graphics();
    this.add(this.background);

    // 2. Setup conditional components
    if (config.text) {
      this.label = new GameText(scene, config.text, {
        fontSizeFactor: 0.025,
      }).setOrigin(0.5);
      this.label.setShadow(2, 2, "#000000", 2, true, true);
      this.add(this.label);
    }

    if (config.icon) {
      this.icon = new GameObjects.Image(scene, 0, 0, config.icon).setOrigin(
        0.5,
      );
      this.add(this.icon);
    }

    if (config.badge) {
      this.badgeBg = scene.add.graphics();
      this.badge = new GameText(scene, config.badge, {
        fontSizeFactor: 0.02,
      }).setOrigin(0.5);
      this.add([this.badgeBg, this.badge]);
    }

    // 3. Define interactive hit area
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
    this.updateVisualState();
    scene.add.existing(this);
  }

  /**
   * Updates the text label content.
   * @param text - New string to display.
   */
  public setText(text: string): void {
    this.label?.setText(text);
  }

  /**
   * Updates badge content and adjusts its visibility/layout.
   * @param text - New string for the badge (hidden if "0" or empty).
   */
  public setBadge(text: string): void {
    if (this.badge && this.badgeBg) {
      this.badge.setText(text);
      this.updateComponentLayout();
    }
  }

  /**
   * Toggles button interactivity and updates visual theme.
   * @param disabled - True to disable clicks and desaturate visuals.
   */
  public setDisabled(disabled: boolean): void {
    this.isEnabled = !disabled;
    this.setAlpha(disabled ? 0.6 : 1.0);

    if (disabled) {
      this.disableInteractive();
    } else {
      this.setInteractive();
    }
    this.updateVisualState();
  }

  /**
   * Centralized method to update background and badge colors based on state.
   */
  private updateVisualState(isHovered: boolean = false): void {
    const bgColor = isHovered
      ? getNumColor(COLORS.SECONDARY)
      : getNumColor(this.isEnabled ? COLORS.UI_BG_LIGHT : "#666666");

    this.drawState(bgColor, 1);
    this.drawBadgeBackground();
  }

  /**
   * Configures input listeners for tactile and visual feedback.
   */
  private setupEvents(): void {
    this.on(
      Input.Events.POINTER_OVER,
      () => this.isEnabled && this.updateVisualState(true),
    );

    this.on(Input.Events.POINTER_OUT, () => {
      this.updateVisualState(false);
      this.setScale(1);
    });

    this.on(
      Input.Events.POINTER_DOWN,
      (_p: any, _lx: any, _ly: any, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        if (this.isEnabled) {
          this.setScale(0.92);
          this.config.callback();
        }
      },
    );

    this.on(Input.Events.POINTER_UP, () => this.setScale(1));
  }

  /**
   * Internal layout logic to position sub-components based on container size.
   */
  private updateComponentLayout(): void {
    const { width, height } = this.config;
    const minDim = Math.min(width, height);

    if (this.icon) {
      const padding = 0.7;
      const targetSize = minDim * padding;
      const scale =
        (targetSize / Math.max(this.icon.width, this.icon.height)) * 0.8;
      this.icon.setScale(scale);
    }

    if (this.badge) {
      this.badge.setPosition(width * 0.4, -height * 0.4);
      this.badge.resize();
      this.drawBadgeBackground();
    }

    this.label?.resize();
  }

  /**
   * Renders the notification badge circle background.
   */
  private drawBadgeBackground(): void {
    if (!this.badgeBg || !this.badge?.visible) return;

    const { width, height } = this.config;
    const radius = Math.min(width, height) * 0.25;
    const bx = width * 0.4;
    const by = -height * 0.4;
    const color = this.isEnabled ? 0xaa0000 : 0x444444;

    this.badgeBg.clear();
    this.badgeBg.fillStyle(color, 1);
    this.badgeBg.fillCircle(bx, by, radius);
    this.badgeBg.lineStyle(2, 0xffffff, 1);
    this.badgeBg.strokeCircle(bx, by, radius);
  }

  /**
   * Renders the main button background.
   * @param color - Hexadecimal fill color.
   * @param alpha - Opacity value.
   */
  private drawState(color: number, alpha: number): void {
    const { width, height } = this.config;
    this.background.clear();
    this.background.fillStyle(color, alpha);
    this.background.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
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
   * External resize hook for the LayoutManager.
   * @param width - New width in pixels.
   * @param height - New height in pixels.
   */
  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;

    this.updateComponentLayout();
    this.updateVisualState();

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
