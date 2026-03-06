import { GameObjects, Scene } from "phaser";
import { Button } from "./Button";
import { COLORS } from "../config/Theme";

export type StepperConfig = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (newValue: number) => void;
};

export class Stepper extends GameObjects.Container {
  private valueText: GameObjects.Text;
  private labelText: GameObjects.Text;
  private config: StepperConfig;

  constructor(scene: Scene, x: number, y: number, config: StepperConfig) {
    super(scene, x, y);
    this.config = config;

    // 1. Label (e.g., "Grid Size")
    this.labelText = scene.add
      .text(0, -30, config.label, {
        fontSize: "18px",
        color: COLORS.WHITE,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // 2. Minus Button
    const btnMinus = new Button(scene, -60, 10, {
      text: "-",
      width: 40,
      height: 40,
      callback: () => this.updateValue(-1),
    });

    // 3. Plus Button
    const btnPlus = new Button(scene, 60, 10, {
      text: "+",
      width: 40,
      height: 40,
      callback: () => this.updateValue(1),
    });

    // 4. Current Value Display
    this.valueText = scene.add
      .text(0, 10, config.value.toString(), {
        fontSize: "22px",
        color: COLORS.SECONDARY,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add([this.labelText, btnMinus, btnPlus, this.valueText]);
    scene.add.existing(this);
  }

  private updateValue(delta: number): void {
    const newValue = Phaser.Math.Clamp(
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
   * Optional: Update value from outside
   */
  public setValue(val: number): void {
    this.config.value = val;
    this.valueText.setText(val.toString());
  }

  public setText(text: string): void {
    this.labelText.setText(text);
  }
}
