[![Bun Tests](https://github.com/andreasschrottenbaum/match-three/actions/workflows/test.yml/badge.svg)](https://github.com/andreasschrottenbaum/match-three/actions/workflows/test.yml) [![Deploy to GH Pages](https://github.com/andreasschrottenbaum/match-three/actions/workflows/deploy.yml/badge.svg)](https://github.com/andreasschrottenbaum/match-three/actions/workflows/deploy.yml)

# 💎 Zen Match-3 Prototype

A relaxing Match-3 experience built with **Phaser 3**, **TypeScript**, and **Bun**. This project focuses on high-quality code architecture, featuring a strict separation between game logic and the rendering engine to ensure 100% testability of core mechanics.

---

## 🚀 Features

- **Zen Mode**: No timers, no pressure. Designed for a relaxing flow-state experience.
- **Combo System**: Increasing score multipliers for chain reactions.
- **Smart Grid Logic**: Advanced match detection for horizontal and vertical lines (including 4-way and 5-way bonuses).
- **Auto-Shuffle**: Intelligent "Deadlock Detection" that automatically reshuffles the board when no valid moves are left, ensuring the game never gets stuck.
- **Solid Foundation**: Decoupled architecture where the game state lives independently from the visual representation.

## 🛠 Tech Stack

- **Game Engine**: [Phaser 3](https://phaser.io/)
- **Runtime**: [Bun](https://bun.sh/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Testing**: [Vitest](https://vitest.dev/)
- **CI/CD**: GitHub Actions

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
