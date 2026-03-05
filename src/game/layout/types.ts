export type LayoutAreas = {
  header: Phaser.Geom.Rectangle;
  main: Phaser.Geom.Rectangle;
  sidebar: Phaser.Geom.Rectangle;
  footer: Phaser.Geom.Rectangle;
};

export type AreaName = "content" | "footer" | "header" | "sidebar" | "settings";

export type Bounds = Record<AreaName, Phaser.Geom.Rectangle>;
