// import { Game as MainGame } from "./scenes/Game";
import { MatchThree } from "./scenes/MatchThree";
import { AUTO, Game, Scale, Types } from "phaser";

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Types.Core.GameConfig = {
  type: AUTO,
  width: 640,
  height: 640,
  parent: "game-container",
  scale: {
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH,
  },
  scene: [MatchThree],
  version: "0.0.1",
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export default StartGame;
