import { Scene } from "phaser";
import { GameConfig } from "../config/GameConfig";

export class SettingsOverlay {
  private container: Phaser.GameObjects.Container;
  private varietyText!: Phaser.GameObjects.Text;
  private gridSizeText!: Phaser.GameObjects.Text;

  constructor(private scene: Scene) {
    const { width, height } = scene.cameras.main;

    // 1. Zuerst den Container erstellen
    this.container = scene.add.container(0, 0).setDepth(5000);

    // 2. Hintergrund (blockiert Input für das Spiel)
    const bg = scene.add
      .rectangle(0, 0, width, height, 0x000000, 0.8)
      .setOrigin(0)
      .setInteractive();

    // 3. Panel
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

    // Jetzt dem Container hinzufügen
    this.container.add([bg, panel, title]);

    // 4. Value Selectors aufrufen (this.container existiert jetzt!)
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

    // 5. Save Button
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
