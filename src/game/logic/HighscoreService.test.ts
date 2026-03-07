import { HighscoreService } from "./HighscoreService";

/**
 * Unit tests for HighscoreService.
 * Mocks localStorage to ensure environment independence.
 */
describe("HighscoreService", () => {
  const mockGridSize = 8;
  const mockVariety = 5;

  beforeEach(() => {
    // Clear localStorage before each test to ensure a clean state
    localStorage.clear();
  });

  describe("getHighscore", () => {
    it("should return 0 if no highscore is stored for the configuration", () => {
      const score = HighscoreService.getHighscore(mockGridSize, mockVariety);
      expect(score).toBe(0);
    });

    it("should return the correctly parsed score if it exists", () => {
      const testScore = 1500;
      // Manually set a value to simulate existing data
      localStorage.setItem("zen_match3_highscore_8x8_v5", testScore.toString());

      const score = HighscoreService.getHighscore(mockGridSize, mockVariety);
      expect(score).toBe(testScore);
    });
  });

  describe("saveScore", () => {
    it("should save and return true if new score is higher than current highscore", () => {
      const initialScore = 500;
      const newScore = 1000;

      HighscoreService.saveScore(mockGridSize, mockVariety, initialScore);
      const result = HighscoreService.saveScore(
        mockGridSize,
        mockVariety,
        newScore,
      );

      expect(result).toBe(true);
      expect(HighscoreService.getHighscore(mockGridSize, mockVariety)).toBe(
        newScore,
      );
    });

    it("should return false and not update if new score is lower or equal", () => {
      const highscore = 2000;
      HighscoreService.saveScore(mockGridSize, mockVariety, highscore);

      const result = HighscoreService.saveScore(
        mockGridSize,
        mockVariety,
        1500,
      );

      expect(result).toBe(false);
      expect(HighscoreService.getHighscore(mockGridSize, mockVariety)).toBe(
        highscore,
      );
    });

    it("should partition scores correctly based on grid size and variety", () => {
      const score8x8 = 1000;
      const score6x6 = 500;

      HighscoreService.saveScore(8, 5, score8x8);
      HighscoreService.saveScore(6, 5, score6x6);

      // Check if scores are kept separate
      expect(HighscoreService.getHighscore(8, 5)).toBe(score8x8);
      expect(HighscoreService.getHighscore(6, 5)).toBe(score6x6);
    });
  });
});
