/**
 * Service to manage highscores stored in the browser's localStorage.
 * Scores are partitioned by grid size and symbol variety.
 */
export class HighscoreService {
  /** Prefix for localStorage keys to avoid collisions */
  private static readonly STORAGE_PREFIX = "zen_match3_highscore_";

  /**
   * Generates a unique key based on the game settings.
   * @param gridSize - The width/height of the grid.
   * @param variety - The number of different tile types.
   * @returns A unique string key for localStorage.
   */
  private static generateKey(gridSize: number, variety: number): string {
    return `${this.STORAGE_PREFIX}${gridSize}x${gridSize}_v${variety}`;
  }

  /**
   * Retrieves the current highscore for a specific configuration.
   * @param gridSize - Current grid size.
   * @param variety - Current symbol variety.
   * @returns The highscore or 0 if none exists.
   */
  public static getHighscore(gridSize: number, variety: number): number {
    const key = this.generateKey(gridSize, variety);
    const saved = localStorage.getItem(key);
    return saved ? parseInt(saved, 10) : 0;
  }

  /**
   * Updates the highscore if the new score is higher than the existing one.
   * @param gridSize - Current grid size.
   * @param variety - Current symbol variety.
   * @param newScore - The score achieved in the current session.
   * @returns True if a new highscore was set, false otherwise.
   */
  public static saveScore(
    gridSize: number,
    variety: number,
    newScore: number,
  ): boolean {
    const currentHigh = this.getHighscore(gridSize, variety);
    if (newScore > currentHigh) {
      const key = this.generateKey(gridSize, variety);
      localStorage.setItem(key, newScore.toString());
      return true;
    }
    return false;
  }
}
