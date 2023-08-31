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

import { fromEvent, interval, merge, noop, Observable } from "rxjs";
import { map, filter, scan, switchMap } from "rxjs/operators";

/** Constants */

const Viewport = {
  CANVAS_WIDTH: 200,
  CANVAS_HEIGHT: 400,
  PREVIEW_WIDTH: 160,
  PREVIEW_HEIGHT: 80,
} as const;

const Constants = {
  TICK_RATE_MS: 500,
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
} as const;

const Block = {
  WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
  HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
};

const { hash, scaleToRange } = (() => {
  // LCG using GCC's constants
  const m = 0x80000000; // 2**31
  const a = 1103515245;
  const c = 12345;

  const hash = (n: number) => (a * n + c) % m;
  /**
   * Takes hash value and scales it to the range [0, 6]
   */
  const scaleToRange = (n: number) => (6 * n) / (m - 1);

  return { hash, scaleToRange };
})();

/**
 * Creates a stream of random numbers in the range [0, 6]
 *
 * @param source$ The source Observable, elements of this are replaced with random numbers
 * @param seed The seed for the random number generator
 */
export function createRngStreamFromSource<T>(source$: Observable<T>) {
  return function createRngStream(
    seed: number = 0
  ): Observable<number> {
    const randomNumberStream = source$.pipe(
      scan((state: number, _: T) => hash(state), seed),  // Accumulate values over time 
      map((hashed: number) => scaleToRange(hashed))  // Scale the values to the range [0, 6]
    );

    return randomNumberStream;
  };
}

const rngStream = createRngStreamFromSource(interval(50));
const randomStream$: Observable<number> = rngStream(42);

/** User input */

type Key = "KeyS" | "KeyA" | "KeyD" | "KeyZ" | "KeyX" | "ArrowRight" | "ArrowLeft" | "ArrowDown";

type Event = "keydown" | "keyup" | "keypress";

/** Utility functions */

const tetriminos = [
  // I Tetrimino
  { index: 0, blocks: [{ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }], color: 'PaleGreen' },
  // J Tetrimino
  { index: 1, blocks: [{ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }], color: 'MediumTurquoise' },
  // L Tetrimino
  { index: 2, blocks: [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], color: 'PeachPuff' },
  // O Tetrimino
  { index: 3, blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], color: 'pink' },
  // T Tetrimino
  { index: 4, blocks: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], color: 'Salmon' },
  // Z Tetrimino
  { index: 5, blocks: [{ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }], color: 'Thistle' },
  // S Tetrimino
  { index: 6, blocks: [{ x: 2, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 0 }, { x: 0, y: 1 }], color: 'Teal' },
];

/** State processing */

const createSvgElement = (
  namespace: string | null,
  name: string,
  props: Record<string, string> = {}
) => {
  const elem = document.createElementNS(namespace, name) as SVGElement;
  Object.entries(props).map(([k, v]) => elem.setAttribute(k, v));
  return elem;
};

function RandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createNewBlock(): SVGElement[] {
  // const block = tetriminos[RandomNumber(0, 6)];
  const block = tetriminos[3];

  const newBlock: SVGElement[] = [];
  const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
    HTMLElement;
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

type State = Readonly<{
  gameEnd: boolean;
  currentBlock: SVGElement[];
  nextBlock: SVGElement[];
  // grid: Grid;
  score: number;
  level: number;
  highScore: number;
  currentTick: number;
}>;

const initialState: State = {
  gameEnd: false,
  currentBlock: createNewBlock(),
  nextBlock: createNewBlock(),
  // grid: createGrid(),
  score: 0,
  level: 0,
  highScore: 0,
  currentTick: Constants.TICK_RATE_MS,
} as const;

const checkGameEnd = (s: State) => {
  return s.currentBlock.some(element => {
    const y = Number(element.getAttribute('y'));
    return y === 0;
  });
}

/**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */

/** Rendering (side effects) */

/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
const show = (elem: SVGGraphicsElement) => {
  elem.setAttribute("visibility", "visible");
  elem.parentNode!.appendChild(elem);
};

/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide
 */
const hide = (elem: SVGGraphicsElement) =>
  elem.setAttribute("visibility", "hidden");

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
  const restartElement = document.querySelector("#restart") as SVGGraphicsElement &
    HTMLElement;
  const container = document.querySelector("#main") as HTMLElement;

  svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
  svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);
  preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);
  preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);

  // Text fields
  const levelText = document.querySelector("#levelText") as HTMLElement;
  const scoreText = document.querySelector("#scoreText") as HTMLElement;
  const highScoreText = document.querySelector("#highScoreText") as HTMLElement;

  /** User input */

  const existingBlocks: SVGElement[] = [];

  const key$ = fromEvent<KeyboardEvent>(document, "keypress");

  const fromKey = (keyCode: Key, movement: string) =>
  merge(
    key$.pipe(
      filter(({ code, type }) => type === "keypress" && (code === keyCode || code === `Arrow${movement}`)),
      map(_ => movement)
    ),
    key$.pipe(
      filter(({ code, type }) => type === "keydown" && (code === keyCode || code === `Arrow${movement}`)),
      map(_ => movement)
    )
  );

  const left$ = fromKey("KeyA", 'left');
  const right$ = fromKey("KeyD", 'right');
  const down$ = fromKey("KeyS", 'down');

  const rotateLeft$ = fromKey("KeyZ", 'rotateLeft');
  const rotateRight$ = fromKey("KeyX", 'rotateRight');

  const arrowLeft$ = fromKey("ArrowLeft", "left");
  const arrowRight$ = fromKey("ArrowRight", "right");
  const arrowDown$ = fromKey("ArrowDown", "down");

  const rngStream = createRngStreamFromSource(interval(50));
  const randomBlockIndexStream$: Observable<number> = rngStream(42); // Use any seed you prefer

  function canMoveHorizontally(currentBlock: SVGElement[], xOffset: number, existingBlocks: SVGElement[]): boolean {
    return currentBlock.every(element => {
      const newX = Number(element.getAttribute('x')) + xOffset;
      return newX >= 0 && newX + Block.WIDTH <= Viewport.CANVAS_WIDTH && !existingBlocks.some(block => {
        const existingX = Number(block.getAttribute('x'));
        const existingY = Number(block.getAttribute('y'));
        return newX === existingX && existingY === Number(element.getAttribute('y'));
      });
    });
  }

  function canMoveVertically(currentBlock: SVGElement[], yOffset: number): boolean {
    return currentBlock.every(element => {
      const newY = Number(element.getAttribute('y')) + yOffset;
      return newY >= 0 && newY + Block.HEIGHT <= Viewport.CANVAS_HEIGHT;
    });
  }

  function checkCollision(currentBlock: SVGElement[], existingBlocks: SVGElement[]): boolean {
    return currentBlock.some(element => {
      const newX = Number(element.getAttribute('x'));
      const newY = Number(element.getAttribute('y'));
      return existingBlocks.some(block => {
        const existingX = Number(block.getAttribute('x'));
        const existingY = Number(block.getAttribute('y'));
        return newX === existingX && newY + Block.HEIGHT === existingY;
      });
    });
  }

  function removeFilledRows(s: State): [number, number, number] {
    const rows: number[] = [];
    existingBlocks.forEach(element => {
      const y = Number(element.getAttribute('y'));
      if (!rows.includes(y)) {
        rows.push(y);
      }
    });
  
    const clearedRows: number[] = rows.filter(row => {
      const rowBlocks = existingBlocks.filter(element => {
        const y = Number(element.getAttribute('y'));
        return y === row;
      });
      return rowBlocks.length === Constants.GRID_WIDTH;
    });
  
    const newScore = s.score + calculateScore(clearedRows.length);
    const newLevel = calculateLevel(newScore);
    const highScore = newScore > s.highScore ? newScore : s.highScore;
  
    rows.sort((a, b) => a - b);
    rows.forEach(row => {
      const rowBlocks = existingBlocks.filter(element => {
        const y = Number(element.getAttribute('y'));
        return y === row;
      });
      if (rowBlocks.length === Constants.GRID_WIDTH) {
        rowBlocks.forEach(element => {
          element.remove();
          existingBlocks.splice(existingBlocks.indexOf(element), 1); // Remove from the existingBlocks array
        });
        existingBlocks.forEach(element => {
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

  const calculateLevel = (score: number): number => {
    const level = Math.floor(score / 400);
    if (score <= 2000) {
      return level;
    }

    else {
      return 6;
    }
  }

  const calculateScore = (clearedRows: number): number => {
  // You can define your scoring logic here
  // For example, you can give more points for clearing more rows
  return clearedRows * 100;
  };

  const move = (s: State, movement: number, score: number, level: number, highScore: number): State => {
    const isMovementValid = (dx: number, dy: number): boolean =>
      (
        canMoveHorizontally(s.currentBlock, dx, existingBlocks) &&
        canMoveVertically(s.currentBlock, dy) &&
        !checkCollision(s.currentBlock, existingBlocks)
      );
  
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
  
    const applyMovement = (dx: number, dy: number): SVGElement[] =>
      s.currentBlock.map((element) => moveElement(element, dx, dy));
  
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

  const calculateNewBlockPositions = (block: SVGElement[], centerPosition: { x: number, y: number }, rotationFactor: 1 | -1) => {
    return block.map(element => {
      const relativeX = Number(element.getAttribute("x")) - centerPosition.x;
      const relativeY = Number(element.getAttribute("y")) - centerPosition.y;
  
      const newX = centerPosition.x + rotationFactor * relativeY;
      const newY = centerPosition.y - rotationFactor * relativeX;
      return { x: newX, y: newY };
    });
  };
  
  const isValidRotation = (newBlockPositions: { x: number, y: number }[], existingBlocks: SVGElement[], canvasWidth: number, canvasHeight: number) => {
    return newBlockPositions.every(({ x, y }) => {
      const checkWithinCanvas = (
        (x >= 0) && 
        (x + Block.WIDTH <= canvasWidth) && 
        (y >= 0) && 
        (y + Block.HEIGHT <= canvasHeight)
      );
  
      const checkCollision = existingBlocks.some(block => {
        const existingX = Number(block.getAttribute("x"));
        const existingY = Number(block.getAttribute("y"));
        return Math.abs(x - existingX) < Block.WIDTH && Math.abs(y - existingY) < Block.HEIGHT;
      });

      const canRotate = checkWithinCanvas && !checkCollision;
  
      return canRotate;
    });
  };
  
  const applyNewBlockPositions = (block: SVGElement[], newBlockPositions: { x: number, y: number }[]) => {
    return block.map((element, index) => {
      element.setAttribute("x", `${newBlockPositions[index].x}`);
      element.setAttribute("y", `${newBlockPositions[index].y}`);
      return element;
    });
  };
  
  const rotate = (s: State, rotationFactor: 1 | -1) => {
    const oBlockIndex = 3;
    if (s.currentBlock[0].getAttribute('style')!.includes(tetriminos[oBlockIndex].color)) {
      return s;
    }

    const centerBlock = s.currentBlock[2];
    const centerPositionX = Number(centerBlock.getAttribute("x"));
    const centerPositionY = Number(centerBlock.getAttribute("y"));

    const newBlockPositions = calculateNewBlockPositions(s.currentBlock, { x: centerPositionX, y: centerPositionY }, rotationFactor);
  
    const validRotation = isValidRotation(newBlockPositions, existingBlocks, Viewport.CANVAS_WIDTH, Viewport.CANVAS_HEIGHT);
  
    if (validRotation) {
      const rotatedBlock = applyNewBlockPositions(s.currentBlock, newBlockPositions);
      if (!checkCollision(rotatedBlock, existingBlocks)) {
        return { ...s, currentBlock: rotatedBlock };
      }
    }
  
    return s;
  };

  const restart = (s: State) => {
    existingBlocks.map(element => {
      element.remove();
    });

    existingBlocks.splice(0, existingBlocks.length);
    
    s.currentBlock.map(element => {
      element.remove();
    });
    s.nextBlock.map(element => {
      element.remove();
    });
    console.log(existingBlocks);


    return {
      ...s,
      gameEnd: false,
      currentBlock: createNewBlock(),
      nextBlock: createNewBlock(),
      score: 0,
      level: 0,
      currentTick: Constants.TICK_RATE_MS,
    }
  }

  // Calculate the tick rate based on the current level
  const calculateTickRate = (currentLevel: number) => {
    const baseTickRate = Constants.TICK_RATE_MS; // The base tick rate
    const levelFactor = 100; // A factor to adjust the tick rate based on level
    const newTickRate = baseTickRate - currentLevel * levelFactor;
    return newTickRate < 100 ? 100 : newTickRate; // Set a minimum tick rate
  };

  /** Determines the rate of time steps */
  const tick$ = interval(Constants.TICK_RATE_MS)

  const tick = (s: State, score: number, level: number, highScore: number) => {
    console.log(existingBlocks);
    if (s.gameEnd == true) {
      return restart(s);
    }

    if (canMoveVertically(s.currentBlock, Block.HEIGHT) && !checkCollision(s.currentBlock, existingBlocks)) {
      const newBlock = s.currentBlock.map(element => {
        const y = Number(element.getAttribute("y")) + Block.HEIGHT;
        element.setAttribute("y", `${y}`);
        return element;
      }, []);

      return { ...s, currentBlock: newBlock, gameEnd: checkGameEnd(s) };
    } 
    else {
      existingBlocks.push(...s.currentBlock);
      const newBlock = s.nextBlock; 
      const nextBlock = createNewBlock();
      return { ...s, currentBlock: newBlock, nextBlock: nextBlock, gameEnd: checkGameEnd(s), score: score, level: level, highScore: highScore };
    }
  }

  // function getXAndYOfBlock(block: SVGElement[]): [number, number, string] {
  //   const x: number = Number(block[0].getAttribute('x'));
  //   const y: number = Number(block[0].getAttribute('y'));
  //   const z: string = block[0].getAttribute('style')!;
  //   return [x, y, z];
  // }

  /**
   * Renders the current state to the canvas.
   *
   * In MVC terms, this updates the View using the Model.
   *
   * @param s Current state
   */
  const render = (s: State) => {
    s.currentBlock.forEach(element => {
      svg.appendChild(element);
    });
  
    scoreText.textContent = `${s.score}`;
    levelText.textContent = `${s.level}`;
    highScoreText.textContent = `${s.highScore}`;
    
    // Add a block to the preview canvas
    s.nextBlock.forEach(element => {
      preview.appendChild(element);
    } 
    );

    // s.nextBlock.forEach(element => {
    //   const [x, y, z] = getXAndYOfBlock(s.nextBlock);
    //   const cubePreview = createSvgElement(preview.namespaceURI, "rect", {
    //     height: `${Block.HEIGHT}`,
    //     width: `${Block.WIDTH}`,
    //     x: `${Block.WIDTH * 2 + x}`,
    //     y: `${Block.HEIGHT + y}`,
    //     style: `${z}`,
    //   });
    //   preview.appendChild(cubePreview);
    // }
    // );

  };

  render(initialState);

  const source$ = merge(
    tick$,
    left$,
    right$,
    down$,
    rotateLeft$,
    rotateRight$,
    arrowLeft$,
    arrowRight$,
    arrowDown$
  ).pipe(
    scan((s: State, action: string | number) => {
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
          return rotate(s, 1);
        case "rotateRight":
          return rotate(s, -1);
        default:
          return tick(s, newScore, newLevel, highScore);
      }
    }, initialState)
  )
  .subscribe((s: State) => {
    render(s);
  
    if (s.gameEnd) {
      // source$.unsubscribe();
      show(gameover);
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

