[![Bun Tests](https://github.com/andreasschrottenbaum/match-three/actions/workflows/test.yml/badge.svg)](https://github.com/andreasschrottenbaum/match-three/actions/workflows/test.yml) [![Deploy to GH Pages](https://github.com/andreasschrottenbaum/match-three/actions/workflows/deploy.yml/badge.svg)](https://github.com/andreasschrottenbaum/match-three/actions/workflows/deploy.yml)

# 💎 Match-3

A relaxing Match-3 experience built with **Phaser 3**, **TypeScript**, and **Bun**. This project focuses on high-quality code architecture, featuring a strict separation between game logic and the rendering engine to ensure 100% testability of core mechanics.

---

## 🚀 Features

- **Zen Mode**: No timers, no pressure. Designed for a relaxing flow-state experience.
- **Smart Grid Logic**: Advanced match detection for horizontal and vertical lines (including 4-way and 5-way bonuses).
- **Auto-Shuffle**: Intelligent "Deadlock Detection" that automatically reshuffles the board when no valid moves are left, ensuring the game never gets stuck.
- **Solid Foundation**: Decoupled architecture where the game state lives independently from the visual representation.

## 🛠 Tech Stack

- **Game Engine**: [Phaser 3](https://phaser.io/)
- **Runtime**: [Bun](https://bun.sh/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Testing**: [Vitest](https://vitest.dev/)
- **CI/CD**: GitHub Actions

For a deep dive into the class hierarchy and method signatures, refer to the [API Documentation](https://andreasschrottenbaum.github.io/match-three/docs/)

---

## 📦 Getting Started

### Prerequisites

Ensure you have [Bun](https://bun.sh/) installed on your machine.

### Installation

```bash
# Clone the repository
git clone [https://github.com/your-username/match-three.git](https://github.com/your-username/match-three.git)

# Install dependencies
bun install
```

### Development

Start the local dev server with Hot Module Replacement (HMR):

```bash
bun dev
```

## 🧪 Testing

This project follows a logic-first testing approach. The core grid mathematics are isolated in `BoardLogic.ts` and covered by unit tests.

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch
```

## 📚 Documentation

The project uses **TypeDoc** to generate a comprehensive API reference directly from the source code comments.

```bash
# Generate HTML documentation
bun run docs
```

The documentation will be generated in the /docs folder. It includes detailed information about the Layout System, UI Components, and the Core Logic.

## 🏗 Architecture

The project implements a Model-View-Controller (MVC) inspired pattern:

1. Logic (The Model): Located in src/logic/BoardLogic.ts. It is a "pure" TypeScript class with no dependencies on Phaser or the DOM. It handles match detection, gravity calculations, and scoring.

2. Scene (The View/Controller): Located in src/scenes/MatchThree.ts. It manages the Phaser lifecycle, handles user input (tweens/swaps), and reflects the state provided by the BoardLogic.

This decoupling allows for lightning-fast unit testing without the overhead of a headless browser.

## 📈 Roadmap

- [x] Add LocalStorage for Highscores
- [x] Implement Particle Effects for matches
- [x] Re-Implement Combo Multiplier
- [ ] Add sound effects and ambient music
- [ ] Integration/E2E tests with Playwright
