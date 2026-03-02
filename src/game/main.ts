import { MatchThree } from "./scenes/MatchThree";
import { Game, Scale, Types } from "phaser";
import { version } from "../../package.json";

const config: Types.Core.GameConfig = {
  title: "Match Three",
  url: "https://andreasschrottenbaum.github.io/match-three/",
  version,
  parent: "game-container",
  width: 640,
  height: 640,
  transparent: true,
  scale: {
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH,
  },
  scene: [MatchThree],
  pixelArt: true,
  roundPixels: true,
  banner: {
    hidePhaser: true,
    background: ["#292929"],
  },
  disableContextMenu: true,
  seed: [],
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export default StartGame;
