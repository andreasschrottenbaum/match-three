import { Scene } from "phaser";
import { GameConfig } from "../config/GameConfig";
import Constants from "../config/Constants";

/**
 * An Overlay where the User can define
 * Grid Size and Tile Variety
 */
export class SettingsOverlay {
  private container: Phaser.GameObjects.Container;
  private varietyText!: Phaser.GameObjects.Text;
  private gridSizeText!: Phaser.GameObjects.Text;

  constructor(private scene: Scene) {
    const { width, height } = scene.cameras.main;

    this.container = scene.add
      .container(0, 0)
      .setDepth(Constants.DEPTH_LAYERS.OVERLAY);

    const bg = scene.add
      .rectangle(0, 0, width, height, 0x000000, 0.8)
      .setOrigin(0)
      .setInteractive();

    const panel = scene.add
      .rectangle(width / 2, height / 2, 450, 500, 0x222222)
      .setStrokeStyle(4, 0xffcc00);

    const title = scene.add
      .text(width / 2, height / 2 - 180, "SETTINGS", {
        fontSize: "42px",
        fontStyle: "bold",
        color: "#ffcc00",
      })
      .setOrigin(0.5);

    this.container.add([bg, panel, title]);

    this.createValueSelector(
      "Grid Size",
      height / 2 - 60,
      () => GameConfig.grid.size,
      (val) => {
        GameConfig.grid.size = Phaser.Math.Clamp(
          GameConfig.grid.size + val,
          4,
          10,
        );
        this.gridSizeText.setText(GameConfig.grid.size.toString());
      },
      (textObj) => (this.gridSizeText = textObj),
    );

    this.createValueSelector(
      "Tile Variety",
      height / 2 + 40,
      () => GameConfig.grid.variety,
      (val) => {
        GameConfig.grid.variety = Phaser.Math.Clamp(
          GameConfig.grid.variety + val,
          3,
          12,
        );
        this.varietyText.setText(GameConfig.grid.variety.toString());
      },
      (textObj) => (this.varietyText = textObj),
    );

    const saveBtnBg = scene.add
      .rectangle(width / 2, height / 2 + 160, 300, 60, 0xffcc00)
      .setInteractive({ useHandCursor: true });
    const saveBtnText = scene.add
      .text(width / 2, height / 2 + 160, "SAVE & RESTART", {
        fontSize: "24px",
        color: "#000000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    saveBtnBg.on("pointerdown", () => {
      this.scene.scene.restart();
    });

    this.container.add([saveBtnBg, saveBtnText]);
  }

  /**
   * Create a Control Group for
   * Adjusting Numeric Values
   * @param label Text to display
   * @param y Y position
   * @param getVal Initial Value
   * @param updateFn Callback function
   * @param ref Parent element
   */
  private createValueSelector(
    label: string,
    y: number,
    getVal: () => number,
    updateFn: (delta: number) => void,
    ref: (obj: Phaser.GameObjects.Text) => void,
  ): void {
    const { width } = this.scene.cameras.main;

    const labelText = this.scene.add
      .text(width / 2, y - 45, label, {
        fontSize: "20px",
        color: "#aaaaaa",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const btnStyle = {
      fontSize: "32px",
      color: "#ffcc00",
      backgroundColor: "#333333",
      padding: { x: 15, y: 5 },
    };

    const minusBtn = this.scene.add
      .text(width / 2 - 100, y, " - ", btnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => updateFn(-1));

    const valText = this.scene.add
      .text(width / 2, y, getVal().toString(), {
        fontSize: "36px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    ref(valText);

    const plusBtn = this.scene.add
      .text(width / 2 + 100, y, " + ", btnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => updateFn(1));

    this.container.add([labelText, minusBtn, valText, plusBtn]);
  }
}
