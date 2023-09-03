/**
 * Inside this file you will use the classes and functions from rx.js
 * to add visuals to the svg element in index.html, animate them, and make them interactive.
 *
 * Study and complete the tasks in observable exercises first to get ideas.
 *
 * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
 *
 * You will be marked on your functional programming style
 * as well as the functionality that you implement.
 *
 * Document your code!
 */

import "./style.css";

import { BehaviorSubject, fromEvent, interval, merge } from "rxjs";
import { map, filter, scan, switchMap } from "rxjs/operators";

/** Constants */

const Viewport = {
  CANVAS_WIDTH: 200,
  CANVAS_HEIGHT: 400,
  PREVIEW_WIDTH: 160,
  PREVIEW_HEIGHT: 80,
} as const;

const Constants = {
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
} as const;

const Tick_Rate = {
  TICK_RATE_MS: 500,
}

const Block = {
  WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
  HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
};

/** User input */

type Key = "KeyS" | "KeyA" | "KeyD" | "KeyZ" | "KeyX" | "KeyR" | "Space" ;

/** Tetromino blocks */

const tetrominos = [
  { index: 0, blocks: [{ x: 4, y: 0 }, { x: 3, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }], color: '#E0D7FF' },
  // J Tetromino
  { index: 1, blocks: [{ x: 3, y: 1 }, { x: 3, y: 0 }, { x: 4, y: 1 }, { x: 5, y: 1 }], color: '#FFCACB' },
  // L Tetromino
  { index: 2, blocks: [{ x: 5, y: 0 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }], color: '#B4E5FF' },
  // O Tetromino
  { index: 3, blocks: [{ x: 3, y: 0 }, { x: 4, y: 0 }, { x: 3, y: 1 }, { x: 4, y: 1 }], color: '#9CAAF2' },
  // T Tetromino
  { index: 4, blocks: [{ x: 4, y: 0 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }], color: '#C5E8B4' },
  // Z Tetromino
  { index: 5, blocks: [{ x: 4, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 1 }, { x: 5, y: 1 }], color: '#F4F0D9' },
  // S Tetromino
  { index: 6, blocks: [{ x: 5, y: 0 }, { x: 4, y: 1 }, { x: 4, y: 0 }, { x: 3, y: 1 }], color: '#88C9C8' },
];

/**
 * Random number generator class that generates pseudorandom integers within a specified range
 * 
 * This follows most of the implementation from tutorial 04, with some modifications
 */
class RNG {
  private static m = 0x80000000; // 2**31
  private static a = 1103515245;
  private static c = 12345;

  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  public randomInt(min:number, max: number): number {
    const range = max - min + 1;
    this.seed = (RNG.a * this.seed + RNG.c) % RNG.m;
    return min + (this.seed % range);
  }
}

/** Utility functions */

/**
 * Creates an SVG element with the given properties.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/SVG/Element for valid
 * element names and properties.
 *
 * @param namespace Namespace of the SVG element
 * @param name SVGElement name
 * @param props Properties to set on the SVG element
 * @returns SVG element
 */
const createSvgElement = (
  namespace: string | null,
  name: string,
  props: Record<string, string> = {}
) => {
  const elem = document.createElementNS(namespace, name) as SVGElement;
  Object.entries(props).map(([k, v]) => elem.setAttribute(k, v));
  return elem;
};

const RNGGenerator = new RNG(987654321);

/**
 * Creates a new set of SVG elements representing a block from the tetromino collection
 *
 * @returns An array of SVG elements representing the individual parts of the new block
 */
const createNewBlock = (): SVGElement[] => {

  // Randomly select a tetromino
  const block = tetrominos[RNGGenerator.randomInt(0, tetrominos.length - 1)];

  const newBlock: SVGElement[] = [];
  const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
    HTMLElement;

  // Create the SVG elements for the block
  block.blocks.map(element => {
    const cube = createSvgElement(svg.namespaceURI, "rect", {
      height: `${Block.HEIGHT}`,
      width: `${Block.WIDTH}`,
      x: `${Block.WIDTH * element.x}`,
      y: `${Block.HEIGHT * element.y}`,
      style: `fill: ${block.color}`,
    });
    newBlock.push(cube);
  })
  return newBlock;
}

/**
 * Function to check if the game has ended
 * 
 * @param s The state
 * @returns If the game has ended
 */
const checkGameEnd = (s: State) => {

  // Check if the current block is at the top of the canvas
  return s.currentBlock.some(element => {
    const y = Number(element.getAttribute('y'));
    return y === 0;
  });
}

/** State processing */

type State = Readonly<{
  gameEnd: boolean;
  currentBlock: SVGElement[];
  nextBlock: SVGElement[];
  score: number;
  level: number;
  highScore: number;
  currentTick: number;
}>;

const initialState: State = {
  gameEnd: false,
  currentBlock: createNewBlock(),
  nextBlock: createNewBlock(),
  score: 0,
  level: 0,
  highScore: 0,
  currentTick: Tick_Rate.TICK_RATE_MS,
} as const;


/** Rendering (side effects) */

/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * 
 * @param elem SVG element to display
 */
const show = (elem: SVGGraphicsElement) => {
  elem.setAttribute("visibility", "visible");
  elem.parentNode!.appendChild(elem);
};

/**
 * Hides a SVG element on the canvas.
 * 
 * @param elem SVG element to hide
 */
const hide = (elem: SVGGraphicsElement) =>
  elem.setAttribute("visibility", "hidden");

/**
 * This is the function called on page load. Your main game loop
 * should be called here.
 */
export function main() {
  // Canvas elements
  const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
    HTMLElement;
  const preview = document.querySelector("#svgPreview") as SVGGraphicsElement &
    HTMLElement;
  const gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
    HTMLElement; 
  const restartGame = document.querySelector("#restart") as SVGGraphicsElement &
    HTMLElement;
  const container = document.querySelector("#main") as HTMLElement;

  // Set the canvas sizes
  svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
  svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);
  preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);
  preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);

  // Text fields
  const levelText = document.querySelector("#levelText") as HTMLElement;
  const scoreText = document.querySelector("#scoreText") as HTMLElement;
  const highScoreText = document.querySelector("#highScoreText") as HTMLElement;

  // List of existing blocks in the canvas
  const existingBlocks: SVGElement[] = [];

  /** User input */

  // Function to create an observable from a key press
  const fromKey = (keyCode: Key, movement: string) =>
      key$.pipe(filter(({ code }) => code === keyCode), map(_ => movement));

  /** Operation functions */

  /**
   * Function to check if the block can move horizontally, and if it will collide with an existing block
   * 
   * @param currentBlock The current block
   * @param xOffset Number added to the x coordinate of the block to check if it can move horizontally
   * @param existingBlocks List containing all the existing blocks in the canvas
   * @returns Boolean that shows if the block can move horizontally
   */
  const canMoveHorizontally = (currentBlock: SVGElement[], xOffset: number, existingBlocks: SVGElement[]): boolean => {

    // Go through each and every element in the current block
    return currentBlock.every(element => {
      const newX = Number(element.getAttribute('x')) + xOffset;

      // Check if the new x coordinate is within the canvas, and if it will collide with an existing block
      return newX >= 0 && newX + Block.WIDTH <= Viewport.CANVAS_WIDTH && !existingBlocks.some(block => {
        const existingX = Number(block.getAttribute('x'));
        const existingY = Number(block.getAttribute('y'));

        return newX === existingX && existingY === Number(element.getAttribute('y'));
      });
    });
  }

  /**
   * Function to check if the block can move vertically, and not past the bottom of the canvas
   * 
   * @param currentBlock The current block
   * @param yOffset Number added to the y coordinate of the block to check if it can move vertically
   * @returns Boolean that shows if the block can move vertically
   */
  const canMoveVertically = (currentBlock: SVGElement[], yOffset: number): boolean => {

    // Go through each and every element in the current block
    return currentBlock.every(element => {
      const newY = Number(element.getAttribute('y')) + yOffset;

      // Check if the new y coordinate is within the canvas
      return newY >= 0 && newY + Block.HEIGHT <= Viewport.CANVAS_HEIGHT;
    });
  }

  /**
   * Function to check if the current block collides with an existing block
   * 
   * @param currentBlock The current block
   * @param existingBlocks List containing all the existing blocks in the canvas
   * @returns Boolean that shows if the current block collide with an existing block
   */
  const checkCollision = (currentBlock: SVGElement[], existingBlocks: SVGElement[]): boolean => {

    // Check if any of the elements in the current block collide with an existing block
    return currentBlock.some(element => {
      const newX = Number(element.getAttribute('x'));
      const newY = Number(element.getAttribute('y'));
      return existingBlocks.some(block => {
        const existingX = Number(block.getAttribute('x'));
        const existingY = Number(block.getAttribute('y'));

        // Returns true if the new x and y coordinates of the current block is the same as the existing block, meaning that they collide
        return newX === existingX && newY + Block.HEIGHT === existingY;
      });
    });
  }

  /**
   * Removes filled rows from the game grid, updates game scores and levels, and manages the high score
   * Modifies the game state by removing rows of fully occupied blocks and adjusting the game metrics
   * 
   * @param s The state
   * @returns A list containing the new score, level and high score
   */
  const removeFilledRows = (s: State): [number, number, number] => {
    const rows: number[] = [];

    // Maps through existing blocks to gather unique y-coordinates
    existingBlocks.map(element => {
      const y = Number(element.getAttribute('y'));

      // Check if y-coordinate is not already collected, then add to the list
      if (!rows.includes(y)) {
        rows.push(y);
      }
    });

    // Identify and filter out the rows with fully occupied blocks
    const clearedRows: number[] = rows.filter(row => {

      // Filter out the blocks that are in the current row
      const rowBlocks = existingBlocks.filter(element => {
        const y = Number(element.getAttribute('y'));
        return y === row;
      });

      // Check if the current row has all blocks filled
      return rowBlocks.length === Constants.GRID_WIDTH;
    });
  
    // Calculate new score, level, and high score
    const newScore = s.score + calculateScore(clearedRows.length);
    const newLevel = calculateLevel(newScore);
    const highScore = newScore > s.highScore ? newScore : s.highScore;
  
    // Update the game grid after removing filled rows
    rows.sort((a, b) => a - b);
    rows.map(row => {

      // Find blocks in the cleared row
      const rowBlocks = existingBlocks.filter(element => {
        const y = Number(element.getAttribute('y'));
        return y === row;
      });

      // Remove blocks and update existingBlocks array
      if (rowBlocks.length === Constants.GRID_WIDTH) {
        rowBlocks.map(element => {
          element.remove();

          // Remove from the existingBlocks array
          existingBlocks.splice(existingBlocks.indexOf(element), 1);
        });

        // Shift blocks above the cleared row downwards 
        existingBlocks.map(element => {
          const y = Number(element.getAttribute('y'));
          if (y < row) {
            const newY = y + Block.HEIGHT;
            element.setAttribute('y', `${newY}`);
          }
        });
      }
    });
  
    return [newScore, newLevel, highScore];
  }

  /**
   * Function to calculate the current level by dividing the score
   * 
   * @param score The current score
   * @returns Number for the current level
   */
  const calculateLevel = (score: number): number => {
    const level = Math.floor(score / 300);
    return level;
  }

  /**
   * Function to calculate the score for the cleared rows
   * 
   * @param clearedRows The number of rows cleared
   * @returns Score for the cleared rows
   */
  const calculateScore = (clearedRows: number): number => {
    return clearedRows * 100;
  };

  /**
   * Function to move the block through user input
   * First, checks if there is space to move the block, or if there will be a collision. Then, move the block by 1 block width or height
   * based on the user input. 
   * 
   * @param s The state
   * @param movement The movement of the block (left, right, down)
   * @param score The score 
   * @param level The level
   * @param highScore The highscore
   * @returns The state with all the updated values and position of the new block if it can move
   */
  const move = (s: State, movement: number, score: number, level: number, highScore: number): State => {
    const isMovementValid = (dx: number, dy: number): boolean =>

      // Check if the block can move horizontally, vertically, and if there will be a collision
      (
        canMoveHorizontally(s.currentBlock, dx, existingBlocks) &&
        canMoveVertically(s.currentBlock, dy) &&
        !checkCollision(s.currentBlock, existingBlocks)
      );
  
    // Function to move the block by 1 block width or height based on the user input
    const moveElement = (
      element: SVGElement,
      dx: number,
      dy: number
    ): SVGElement => {
      const x = Number(element.getAttribute("x")) + dx;
      const y = Number(element.getAttribute("y")) + dy;
      element.setAttribute("x", `${x}`);
      element.setAttribute("y", `${y}`);
      return element;
    };
  
    // Function to apply the movement to the block
    const applyMovement = (dx: number, dy: number): SVGElement[] =>
      s.currentBlock.map((element) => moveElement(element, dx, dy));
  
    // Check which movement user inputted, and if it is valid, then apply the movement to the block
    const newBlock: SVGElement[] =
      movement === 1 && isMovementValid(Block.WIDTH, 0)
        ? applyMovement(Block.WIDTH, 0)
        : movement === -1 && isMovementValid(-Block.WIDTH, 0)
        ? applyMovement(-Block.WIDTH, 0)
        : movement === 0 && isMovementValid(0, Block.HEIGHT)
        ? applyMovement(0, Block.HEIGHT)
        : s.currentBlock;
  
    return { ...s, currentBlock: newBlock, score: score, level: level, highScore: highScore };
  };

  /**
   * Function to calculate the new x and y coordinates of the block after rotation
   * 
   * @param block The block
   * @param centerPosition The center position of the block
   * @param rotationFactor The rotation factor (1 or -1)
   * @returns Two values for the new x and y coordinates of the block
   */
  const calculateNewBlockPositions = (block: SVGElement[], centerPosition: { x: number, y: number }, rotationFactor: 1 | -1) => {

    // Map through each element in the block, and calculate the new x and y coordinates using the center coordinates
    return block.map(element => {

      // Calculation for displacement of the block element from the center point
      const relativeX = Number(element.getAttribute("x")) - centerPosition.x;
      const relativeY = Number(element.getAttribute("y")) - centerPosition.y;
  
      // Calclation for the new x and y coordinates of the block element after rotation
      const newX = centerPosition.x + rotationFactor * relativeY;
      const newY = centerPosition.y - rotationFactor * relativeX;

      return { x: newX, y: newY };
    });
  };
  
  /**
   * Function to check if the block can rotate
   * 
   * @param newBlockPositions The new block positions after rotation
   * @param existingBlocks The list consisting of all existing blocks in the canvas
   * @param canvasWidth The width of the canvas
   * @param canvasHeight The height of the canvas
   * @returns Boolean that shows if the block can rotate
   */
  const isValidRotation = (newBlockPositions: { x: number, y: number }[], existingBlocks: SVGElement[], canvasWidth: number, canvasHeight: number) => {
    return newBlockPositions.every(({ x, y }) => {

      // Check if the new x and y coordinates are within the canvas
      const checkWithinCanvas = (
        (x >= 0) && 
        (x + Block.WIDTH <= canvasWidth) && 
        (y >= 0) && 
        (y + Block.HEIGHT <= canvasHeight)
      );
  
      // Check if the new x and y coordinates will collide with an existing block
      const checkCollision = existingBlocks.some(block => {
        const existingX = Number(block.getAttribute("x"));
        const existingY = Number(block.getAttribute("y"));
        return Math.abs(x - existingX) < Block.WIDTH && Math.abs(y - existingY) < Block.HEIGHT;
      });

      const canRotate = checkWithinCanvas && !checkCollision;
      return canRotate;
    });
  };
  
  /**
   * Function that applies the new block positions to the block
   * 
   * @param block The block
   * @param newBlockPositions The new block positions after rotation
   * @returns The new state with the updated block positions
   */
  const applyNewBlockPositions = (block: SVGElement[], newBlockPositions: { x: number, y: number }[]) => {
    return block.map((element, index) => {
      element.setAttribute("x", `${newBlockPositions[index].x}`);
      element.setAttribute("y", `${newBlockPositions[index].y}`);
      return element;
    });
  };
  
  /**
   * Main function for rotation, checks if the block can rotate, and if it will collide with an existing block, then does the calculation for
   * the new block positions and applies it to the block
   * 
   * @param s The state
   * @param rotationFactor The rotation factor (1 or -1)
   * @param score The score of the state
   * @param level The level of the state
   * @param highScore The highscore of the state
   * @returns The state with the updated block positions, if the block can rotate
   */
  const rotate = (s: State, rotationFactor: 1 | -1, score: number, level: number, highScore: number) => {

    // Check if the block is an O block, if it is, then don't rotate it
    const oBlockIndex = 3;
    if (s.currentBlock[0].getAttribute('style')!.includes(tetrominos[oBlockIndex].color)) {
      return s;
    }

    // The center block is always placed in array index 2
    const centerBlock = s.currentBlock[2];
    const centerPositionX = Number(centerBlock.getAttribute("x"));
    const centerPositionY = Number(centerBlock.getAttribute("y"));

    const newBlockPositions = calculateNewBlockPositions(s.currentBlock, { x: centerPositionX, y: centerPositionY }, rotationFactor);
  
    const validRotation = isValidRotation(newBlockPositions, existingBlocks, Viewport.CANVAS_WIDTH, Viewport.CANVAS_HEIGHT);
  
    // Return the new state with the updated block positions if the block can rotate
    if (validRotation) {
      const rotatedBlock = applyNewBlockPositions(s.currentBlock, newBlockPositions);
      if (!checkCollision(rotatedBlock, existingBlocks)) {
        return { ...s, currentBlock: rotatedBlock, score: score, level: level, highScore: highScore  };
      }
    }
  
    return s;
  };

  /**
   * This function is used for the dropdown key, and drops the block down until it collides with an existing block or the bottom of the canvas
   * 
   * @param s The state
   * @param score The score of the state
   * @param level The level of the state
   * @param highScore The high score of the state
   * @returns The state with the updated block positions, when the block is dropped down
   */
  const dropdown = (s: State, score: number, level: number, highScore: number) => {
    if (!s.gameEnd) {
      const dropBlock = (distance: number): SVGElement[] => {
        const newBlock = s.currentBlock.map((element) => {
          const newY = Number(element.getAttribute("y")) + Block.HEIGHT;

          if (newY + Block.HEIGHT <= Viewport.CANVAS_HEIGHT) {
            element.setAttribute("y", `${newY}`);
          }

          return element;
        });
  
        // Recursively drop the block while checking for collision and if the block is within the canvas
        if (!checkCollision(newBlock, existingBlocks) && canMoveVertically(newBlock, Block.HEIGHT)) {
          return dropBlock(distance + 1); 
        }
  
        // Store the dropped block into existingBlocks
        existingBlocks.push(...newBlock);
  
        // Stop dropping if collision detected or out of bounds
        return newBlock; 
      };
  
      const newBlock = dropBlock(1); // Start dropping from distance 1
  
      return {
        ...s,
        currentBlock: newBlock,
        gameEnd: checkGameEnd(s),
        score,
        level,
        highScore,
      };
    }
  
    return s;
  };

  /**
   * Function to restart the game
   * 
   * @param s The state
   * @returns The defaulted state when restart is called
   */
  const restart = (s: State) => {

    // Remove all existing blocks from the canvas
    existingBlocks.map(element => {
      element.remove();
    });

    // Reset the existingBlocks array
    existingBlocks.splice(0, existingBlocks.length);
    
    // Reset the current block and next block
    s.currentBlock.map(element => {
      element.remove();
    });
    s.nextBlock.map(element => {
      element.remove();
    });

    return {
      ...s,
      gameEnd: false,
      currentBlock: createNewBlock(),
      nextBlock: createNewBlock(),
      score: 0,
      level: 0,
      currentTick: Tick_Rate.TICK_RATE_MS,
    }
  }

  /**
   * Function to calculate the new tick rate after checking the level
   * 
   * @param s The state
   * @returns The new tick rate for the next tick after checking the level
   */
  const calculateNextTickRate = (s: State) => {
    const baseTickRate = Tick_Rate.TICK_RATE_MS;
    const newTickRate = baseTickRate - s.level * 50;
    if (newTickRate > 200) {
      return newTickRate;
    }

    return 200;
  };

  /**
   * Function that advances the game state by one tick, updating the position of the current block and handling collisions
   * 
   * @param s The state
   * @param score The score highscore of the state
   * @param level The level highscore of the state
   * @param highScore The highscore of the state
   * @returns The updated state with the new tick rate, and the new block if the block can move down, level, high score, and score
   */
  const tick = (s: State, score: number, level: number, highScore: number) => {

    // Update the tick rate
    const newTickRate = calculateNextTickRate(s);
    tickRate$.next(s.currentTick);

    // If the block can still move down, then move the block down by 1 block height
    if (canMoveVertically(s.currentBlock, Block.HEIGHT) && !checkCollision(s.currentBlock, existingBlocks)) {
      const newBlock = s.currentBlock.map(element => {
        const y = Number(element.getAttribute("y")) + Block.HEIGHT;
        element.setAttribute("y", `${y}`);
        return element;
      }, []);

      return { ...s, currentBlock: newBlock, gameEnd: checkGameEnd(s), score: score, level: level, highScore: highScore, currentTick: newTickRate };
    } 

    // Else, add the current block to the existing blocks array, and create a new block
    else {
      existingBlocks.push(...s.currentBlock);
      const newBlock = s.nextBlock; 
      const nextBlock = createNewBlock();

      return { ...s, currentBlock: newBlock, nextBlock: nextBlock, gameEnd: checkGameEnd(s), score: score, level: level, highScore: highScore, currentTick: newTickRate };
    }
  };

  /**
   * Renders the current state to the canvas.
   *
   * In MVC terms, this updates the View using the Model.
   *
   * @param s Current state
   */
  const render = (s: State) => {
    s.currentBlock.map(element => {
      svg.appendChild(element);
    });
  
    scoreText.textContent = `${s.score}`;
    levelText.textContent = `${s.level}`;
    highScoreText.textContent = `${s.highScore}`;

    preview.innerHTML = '';
    
    // Add the next block to the preview canvas
    s.nextBlock.map(element => {
      preview.appendChild(element);
    } 
    );
  };

  // Initial render
  render(initialState);

  /** Observables */

  const key$ = fromEvent<KeyboardEvent>(document, "keypress");

  // Movement keys
  const left$ = fromKey("KeyA", 'left');
  const right$ = fromKey("KeyD", 'right');
  const down$ = fromKey("KeyS", 'down');

  // Rotation keys
  const rotateLeft$ = fromKey("KeyZ", 'rotateLeft');
  const rotateRight$ = fromKey("KeyX", 'rotateRight');

  // Dropdown key
  const dropDown$ = fromKey("Space", 'dropDown');

  // Restart key
  const restart$ = fromKey("KeyR", 'restart');

  // Tick rate
  const tickRate$ = new BehaviorSubject(Tick_Rate.TICK_RATE_MS);

  // Tick stream
  const tick$ = tickRate$.pipe(
    switchMap((tickRate) => interval(tickRate))
  );

  /**
   * Main game loop
   * 
   * Manages the core logic for a Tetris game using RxJS observables.
   * This module handles the game state, user input, and rendering.
   * It responds to various user actions and updates the game state
   * accordingly, including tetromino movement, rotation, and restarts.
   * The rendered state is reflected in the game interface, and UI
   * elements are displayed based on game over or restart conditions.
   *
   * @param tick$ Stream for game ticks
   * @param left$ Stream for left movement
   * @param right$ Stream for right movement
   * @param down$ Stream for downward movement
   * @param rotateLeft$ Stream for left rotation
   * @param rotateRight$ Stream for right rotation
   * @param restart$ Stream for restart action
   */
  const source$ = merge(
    tick$,
    left$,
    right$,
    down$,
    rotateLeft$,
    rotateRight$,
    dropDown$,
    restart$
  ).pipe(
    scan((s: State, action: string | number) => {
      // From the updated list of existing blocks, remove filled rows and update the score, level, and high score
      const update = removeFilledRows(s);
      const newScore = update[0];
      const newLevel = update[1];
      const highScore = update[2];
  
      switch (action) {
        case "right":
          return move(s, 1, newScore, newLevel, highScore);
        case "left":
          return move(s, -1, newScore, newLevel, highScore);
        case "down":
          return move(s, 0, newScore, newLevel, highScore);
        case "rotateLeft":
          return rotate(s, 1, newScore, newLevel, highScore);
        case "rotateRight":
          return rotate(s, -1, newScore, newLevel, highScore);
        case "dropDown":
          if (!s.gameEnd) {
            const droppedState = dropdown(s, newScore, newLevel, highScore);
            
            const currentBlock = s.nextBlock
            const nextBlock = createNewBlock();

            const newBlockState = {
              ...droppedState,
              currentBlock: currentBlock, 
              nextBlock: nextBlock, 
            };
            return newBlockState;
          }
          return s;
        case "restart":
          if (s.gameEnd == true) {
            hide(restartGame)
            return restart(s);
          }
        default:
          if (s.gameEnd == false) {
            const currentTickRate = calculateNextTickRate(s);
            tickRate$.next(currentTickRate);
            return tick(s, newScore, newLevel, highScore);
          }

          else {
            return s;
          }
      }
    }, initialState)
  )
  .subscribe((s: State) => {
    render(s);
  
    if (s.gameEnd) {
      show(restartGame);
    }
    else {
      hide(gameover);
    }
  });
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}