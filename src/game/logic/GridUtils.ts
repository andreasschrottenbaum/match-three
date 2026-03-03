export class GridUtils {
  /**
   * Calculates the start coordinates (left top) of the grid
   * and centers it in the viewport
   */
  public static getGridOffsets(
    width: number,
    height: number,
    gridSize: number,
    tileSize: number,
  ) {
    return {
      x: (width - gridSize * tileSize) / 2,
      y: (height - gridSize * tileSize) / 2,
    };
  }

  /**
   * Converts grid coords (row,col) to pixel coords (x,y)
   */
  public static gridToWorld(
    row: number,
    col: number,
    tileSize: number,
    offsetX: number,
    offsetY: number,
  ) {
    return {
      x: offsetX + col * tileSize + tileSize / 2,
      y: offsetY + row * tileSize + tileSize / 2,
    };
  }

  /**
   * Converts pixel coords (x, y) to grid coords (row, col)
   */
  public static worldToGrid(
    x: number,
    y: number,
    tileSize: number,
    offsetX: number,
    offsetY: number,
  ) {
    const col = Math.floor((x - offsetX) / tileSize);
    const row = Math.floor((y - offsetY) / tileSize);

    return { row, col };
  }
}
