import { Scene, GameObjects } from "phaser";
import { GameConfig } from "../config/GameConfig";
import { UIUtils } from "./UIUtils";
import Constants from "../config/Constants";

/**
 * An Overlay where the User can define Grid Size and Tile Variety.
 * Uses UIUtils for a consistent look and feel and handles responsiveness.
 */
export class SettingsOverlay {
  private container: GameObjects.Container;
  private bg: GameObjects.Rectangle;
  private panel: GameObjects.Rectangle;
  private title: GameObjects.Text;
  private saveBtn: GameObjects.Container;

  private varietyText!: GameObjects.Text;
  private gridSizeText!: GameObjects.Text;

  private selectorGroups: {
    label: GameObjects.Text;
    minus: GameObjects.Container;
    val: GameObjects.Text;
    plus: GameObjects.Container;
  }[] = [];

  constructor(private scene: Scene) {
    const { width, height } = scene.cameras.main;

    this.container = scene.add
      .container(0, 0)
      .setDepth(Constants.DEPTH_LAYERS.OVERLAY);

    this.bg = scene.add
      .rectangle(0, 0, width, height, 0x000000, 0.8)
      .setOrigin(0)
      .setInteractive(); // Blocks input to board

    this.panel = scene.add
      .rectangle(width / 2, height / 2, 450, 500, 0x222222)
      .setStrokeStyle(4, 0xffcc00);

    this.title = UIUtils.addText(
      this.scene,
      width / 2,
      height / 2 - 180,
      "SETTINGS",
      "42px",
    ).setColor("#ffcc00");

    this.container.add([this.bg, this.panel, this.title]);

    // Create Grid Size Selector
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
      (obj) => (this.gridSizeText = obj),
    );

    // Create Variety Selector
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
      (obj) => (this.varietyText = obj),
    );

    this.saveBtn = UIUtils.createButton(
      this.scene,
      width / 2,
      height / 2 + 160,
      "SAVE & RESTART",
      () => {
        this.scene.scale.off("resize", this.reposition, this);
        this.scene.scene.restart();
      },
    );

    this.container.add(this.saveBtn);

    this.scene.scale.on("resize", this.reposition, this);
    this.reposition();
  }

  /**
   * Adjusts the UI positions to keep elements centered on screen resize.
   */
  private reposition(): void {
    const { width, height } = this.scene.cameras.main;

    // Resize background to cover the whole screen

    // Re-center all primary UI elements
    const centerX = width / 2;
    const centerY = height / 2;

    this.bg.setSize(width, height);
    this.panel.setPosition(centerX, centerY);
    this.title.setPosition(centerX, centerY - 180);
    this.saveBtn.setPosition(centerX, centerY + 160);

    // We update the relative positions of the groups
    // Note: In a production environment, we would use relative offsets
    // from the centerY instead of hardcoded recalculations here.
    const yOffsets = [-60, 40];
    this.selectorGroups.forEach((group, i) => {
      const y = centerY + yOffsets[i];
      const spacing = 110;
      group.label.setPosition(centerX, y - 45);
      group.minus.setPosition(centerX - spacing, y);
      group.val.setPosition(centerX, y);
      group.plus.setPosition(centerX + spacing, y);
    });
  }

  /**
   * Create a Control Group for Adjusting Numeric Values.
   */
  private createValueSelector(
    label: string,
    y: number,
    getVal: () => number,
    updateFn: (d: number) => void,
    ref: (obj: GameObjects.Text) => void,
  ): void {
    const centerX = this.scene.cameras.main.width / 2;
    const spacing = 110;

    const labelText = UIUtils.addText(
      this.scene,
      centerX,
      y - 45,
      label,
      "24px",
    ).setColor("#aaaaaa");
    const minusBtn = UIUtils.createButton(
      this.scene,
      centerX - spacing,
      y,
      " - ",
      () => updateFn(-1),
    );
    const plusBtn = UIUtils.createButton(
      this.scene,
      centerX + spacing,
      y,
      " + ",
      () => updateFn(1),
    );
    const valText = UIUtils.addText(
      this.scene,
      centerX,
      y,
      getVal().toString(),
      "36px",
    ).setFontStyle("bold");

    ref(valText);
    this.container.add([labelText, minusBtn, valText, plusBtn]);

    // Store references for the reposition method
    this.selectorGroups.push({
      label: labelText,
      minus: minusBtn,
      val: valText,
      plus: plusBtn,
    });
  }
}
