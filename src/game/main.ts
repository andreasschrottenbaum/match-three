import { MatchThree } from "./scenes/MatchThree";
import { Game, Scale, Types } from "phaser";
import { version } from "../../package.json";

const config: Types.Core.GameConfig = {
  title: "Match Three",
  url: "https://andreasschrottenbaum.github.io/match-three/",
  version,
  transparent: true,
  scale: {
    mode: Scale.RESIZE,
    parent: "game-container",
    width: "100%",
    height: "100%",
  },
  scene: [MatchThree],
  roundPixels: true,
  banner: {
    hidePhaser: true,
    background: ["#292929"],
  },
  disableContextMenu: true,
  // seed: [],
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export default StartGame;
