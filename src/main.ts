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

import { fromEvent, interval, merge } from "rxjs";
import { map, filter, scan } from "rxjs/operators";

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

/** User input */

type Key = "KeyS" | "KeyA" | "KeyD";

type Event = "keydown" | "keyup" | "keypress";

/** Utility functions */

const tetriminos = [
  // // I Tetrimino
  // { blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }], color: 'cyan' },
  // // J Tetrimino
  // { blocks: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], color: 'blue' },
  // // L Tetrimino
  // { blocks: [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], color: 'orange' },
  // O Tetrimino
  { blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], color: 'pink' },
  // T Tetrimino
  { blocks: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], color: 'purple' },
]

/** State processing */

const createSvgElement = (
  namespace: string | null,
  name: string,
  props: Record<string, string> = {}
) => {
  const elem = document.createElementNS(namespace, name) as SVGElement;
  Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
  return elem;
};

function createNewBlock(): SVGElement[] {
  const block = tetriminos[0];
  const hehe: SVGElement[] = [];
  const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
    HTMLElement;
  block.blocks.forEach(element => {
    const cube = createSvgElement(svg.namespaceURI, "rect", {
      height: `${Block.HEIGHT}`,
      width: `${Block.WIDTH}`,
      x: `${Block.WIDTH * element.x}`,
      y: `${Block.HEIGHT * element.y}`,
      style: `fill: ${block.color}`,
    });
    hehe.push(cube);
  })
  return hehe;
}

type State = Readonly<{
  gameEnd: boolean;
  currentBlock: SVGElement[];
  nextBlock: SVGElement[];
  // grid: Grid;
  score: number;
  level: number;
  highScore: number;
}>;

const initialState: State = {
  gameEnd: false,
  currentBlock: createNewBlock(),
  nextBlock: createNewBlock(),
  // grid: createGrid(),
  score: 0,
  level: 0,
  highScore: 0,
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
      key$.pipe(filter(({ code }) => code === keyCode), map(_ => movement));

    const left$ = fromKey("KeyA", 'left');
    const right$ = fromKey("KeyD", 'right');
    const down$ = fromKey("KeyS", 'down');


  /** Observables */

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

  function removeFilledRows() {
    const rows: number[] = [];
    existingBlocks.forEach(element => {
      const y = Number(element.getAttribute('y'));
      if (!rows.includes(y)) {
        rows.push(y);
      }
    });
    rows.sort((a, b) => a - b);
    rows.forEach(row => {
      const rowBlocks = existingBlocks.filter(element => {
        const y = Number(element.getAttribute('y'));
        return y === row;
      });
      if (rowBlocks.length === Constants.GRID_WIDTH) {
        rowBlocks.forEach(element => {
          element.remove();
        });
        existingBlocks.forEach(element => {
          const y = Number(element.getAttribute('y'));
          if (y < row) {
            const newY = y + Block.HEIGHT;
            element.setAttribute('y', `${newY}`);
          }
        });
        existingBlocks.splice(existingBlocks.indexOf(rowBlocks[0]), Constants.GRID_WIDTH);
        existingBlocks.forEach(element => {
          const y = Number(element.getAttribute('y'));
          if (y < row) {
            const newY = y + Block.HEIGHT;
            element.setAttribute('y', `${newY}`);
          }
        });
      }
    });
  }

  const move = (s: State, movement: number) => {
    let newBlock;
    
    if (movement === 1 && canMoveHorizontally(s.currentBlock, Block.WIDTH, existingBlocks) && !checkCollision(s.currentBlock, existingBlocks)) {
      newBlock = s.currentBlock.map(element => {
        const x = Number(element.getAttribute("x")) + Block.WIDTH;
        element.setAttribute("x", `${x}`);
        return element;
      });
    } else if (movement === -1 && canMoveHorizontally(s.currentBlock, -Block.WIDTH, existingBlocks) && !checkCollision(s.currentBlock, existingBlocks)) {
      newBlock = s.currentBlock.map(element => {
        const x = Number(element.getAttribute("x")) - Block.WIDTH;
        element.setAttribute("x", `${x}`);
        return element;
      });
    } else if (movement === 0 && canMoveVertically(s.currentBlock, Block.HEIGHT) && !checkCollision(s.currentBlock, existingBlocks)) {
      newBlock = s.currentBlock.map(element => {
        const y = Number(element.getAttribute("y")) + Block.HEIGHT;
        element.setAttribute("y", `${y}`);
        return element;
      });
    } else {
      newBlock = s.currentBlock; // No valid movement, keep the block unchanged
    }
  
    return { ...s, currentBlock: newBlock };
  };

  /** Determines the rate of time steps */
  const tick$ = interval(Constants.TICK_RATE_MS);

  const tick = (s: State) => {
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
      const newBlock = createNewBlock(); // No valid movement, keep the block unchanged
      return { ...s, currentBlock: newBlock, gameEnd: checkGameEnd(s) };
    }

    // return { ...s, currentBlock: newBlock };
  }

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
    }
    );

    // Add a block to the preview canvas
    const cubePreview = createSvgElement(preview.namespaceURI, "rect", {
      height: `${Block.HEIGHT}`,
      width: `${Block.WIDTH}`,
      x: `${Block.WIDTH * 2}`,
      y: `${Block.HEIGHT}`,
      style: "fill: pink",
    });
    preview.appendChild(cubePreview);
  };

  render(initialState);

  const source$ = merge(tick$, left$, right$, down$)
    .pipe(scan((s: State, action: string | number) => {
      console.log(action);
      switch (action) {
        case('right'):
          return move(s, 1)
        case('left'):
          return move(s, -1)
        case('down'):
          return move(s, 0)
        default:
          return tick(s)
      }
      }, initialState)).subscribe((s: State) => {
      removeFilledRows();
      render(s);

      if (s.gameEnd) {
        show(gameover);
      } else {
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
