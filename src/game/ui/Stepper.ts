import { GameObjects, Scene, Math as PhaserMath } from "phaser";
import { Button } from "./Button";
import { COLORS } from "../config/Theme";
import { GameText } from "./GameText";

/**
 * Configuration for the Stepper component.
 */
export type StepperConfig = {
  /** The descriptive label shown above the controls */
  label: string;
  /** The starting numeric value */
  value: number;
  /** Minimum boundary for the value */
  min: number;
  /** Maximum boundary for the value */
  max: number;
  /** Callback triggered whenever the value changes successfully */
  onChange: (newValue: number) => void;
};

/**
 * A UI component that now uses a horizontal layout to prevent vertical
 * overlapping on small screens (especially in Landscape mode).
 */
export class Stepper extends GameObjects.Container {
  /** Text object displaying the current numeric value */
  private valueText: GameText;
  /** Text object displaying the descriptive label */
  private labelText: GameText;
  /** The increment button (+) */
  private btnPlus: Button;
  /** The decrement button (-) */
  private btnMinus: Button;
  /** Local reference to the configuration and current state */
  private config: StepperConfig;

  /**
   * @param scene - The active Phaser Scene.
   * @param x - Initial horizontal position.
   * @param y - Initial vertical position.
   * @param config - Initialization settings for the stepper.
   */
  constructor(scene: Scene, x: number, y: number, config: StepperConfig) {
    super(scene, x, y);
    this.config = config;

    // 1. Label positioned to the left
    this.labelText = new GameText(scene, config.label, {
      x: -80, // Offset to the left
      fontSizeFactor: 0.025,
    }).setOrigin(1, 0.5); // Align right-to-center

    // 2. Decrement Button
    this.btnMinus = new Button(scene, 20, 0, {
      text: "-",
      width: 40,
      height: 40,
      callback: () => this.updateValue(-1),
    });

    // 3. Value Display (centered between buttons)
    this.valueText = new GameText(scene, config.value.toString(), {
      x: 70,
      color: COLORS.SECONDARY,
    }).setOrigin(0.5);

    // 4. Increment Button
    this.btnPlus = new Button(scene, 120, 0, {
      text: "+",
      width: 40,
      height: 40,
      callback: () => this.updateValue(1),
    });

    this.add([this.labelText, this.btnMinus, this.btnPlus, this.valueText]);
    scene.add.existing(this);
  }

  /**
   * Internal logic to shift the value and trigger callbacks.
   * @param delta - The amount to change the value by (usually 1 or -1).
   */
  private updateValue(delta: number): void {
    const newValue = PhaserMath.Clamp(
      this.config.value + delta,
      this.config.min,
      this.config.max,
    );

    if (newValue !== this.config.value) {
      this.config.value = newValue;
      this.valueText.setText(newValue.toString());
      this.config.onChange(newValue);
    }
  }

  /**
   * Externally updates the current value of the stepper.
   * @param val - The new numeric value to display.
   */
  public setValue(val: number): void {
    this.config.value = val;
    this.valueText.setText(val.toString());
  }

  /**
   * Updates the descriptive label of the stepper.
   * @param text - The new label string.
   */
  public setLabelText(text: string): void {
    this.labelText.setText(text);
  }

  /**
   * Propagates the resize event to all child components.
   * Ensures text scaling and button hit areas are recalculated.
   */
  public resize(): void {
    this.labelText.resize();
    // Prevent the label from getting too wide and overlapping buttons
    this.labelText.setMaxWidth(150);

    this.valueText.resize();
    this.btnMinus.resize(40, 40);
    this.btnPlus.resize(40, 40);
  }
}
