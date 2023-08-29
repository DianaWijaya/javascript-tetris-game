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

const tetriminos = [
  // // I Tetrimino
  // { blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }], color: 'cyan' },
  // // J Tetrimino
  // { blocks: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], color: 'blue' },
  // // L Tetrimino
  // { blocks: [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], color: 'orange' },
  // O Tetrimino
  { blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], color: 'yellow' },
  // T Tetrimino
  { blocks: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], color: 'purple' },
//   // Z Tetrimino
//   { blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }], color: 'red' },
//   // S Tetrimino
//   { blocks: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], color: 'green' },
];

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

/** State processing */

type State = Readonly<{
  gameEnd: boolean;
  currentBlock: SVGElement[];
  nextBlock: SVGElement[];
  score: number;
  highScore: number;
  level: number;
}>;


/**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */
const tick = (s: State) => s;

/** Rendering (side effects) */

/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */


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
    // svg.appendChild(cube);
  })
  return hehe;
}

const initialState: State = {
  gameEnd: false,
  currentBlock: createNewBlock(),
  nextBlock: createNewBlock(),
  score: 0,
  highScore: 0,
  level: 0,
};

const existingBlocks: SVGElement[] = [];

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

  const key$ = fromEvent<KeyboardEvent>(document, "keypress");

  const fromKey = (keyCode: Key, xDirection: number, yDirection: number) =>
      key$.pipe(filter(({ code }) => code === keyCode), map(_ => xDirection, yDirection));

  const left$ = fromKey("KeyA", -1, 0);
  const right$ = fromKey("KeyD", 1, 0);
  const down$ = fromKey("KeyS", 0, 1);

  /** Observables */
  

  /** Determines the rate of time steps */
  const tick$ = interval(Constants.TICK_RATE_MS);

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
    
    // Add a block to the preview canvas
    const cubePreview = createSvgElement(preview.namespaceURI, "rect", {
      height: `${Block.HEIGHT}`,
      width: `${Block.WIDTH}`,
      x: `${Block.WIDTH * 2}`,
      y: `${Block.HEIGHT}`,
      style: "fill: green",
    });
    preview.appendChild(cubePreview);
  };

  function canMoveHorizontally(currentBlock: SVGElement[], xOffset: number): boolean {
    return currentBlock.every(element => {
      const newX = Number(element.getAttribute('x')) + xOffset;
      return newX >= 0 && newX + Block.WIDTH <= Viewport.CANVAS_WIDTH;
    });
  }

  function canMoveVertically(currentBlock: SVGElement[], yOffset: number): boolean {
    return currentBlock.every(element => {
      const newY = Number(element.getAttribute('y')) + yOffset;
      return newY >= 0 && newY + Block.HEIGHT <= Viewport.CANVAS_HEIGHT;
    });
  }

  const movement$ = merge(
    left$.pipe(
      map(() => ({ offsetX: -Block.WIDTH, offsetY: 0 })),
      filter(() => canMoveHorizontally(initialState.currentBlock, -Block.WIDTH))
    ),
    right$.pipe(
      map(() => ({ offsetX: Block.WIDTH, offsetY: 0 })),
      filter(() => canMoveHorizontally(initialState.currentBlock, Block.WIDTH))
    ),
    down$.pipe(
      map(() => ({ offsetX: 0, offsetY: Block.HEIGHT })),
      filter(() => canMoveVertically(initialState.currentBlock, Block.HEIGHT))
    )
  ).pipe(
    scan((s: State, { offsetX, offsetY }) => {
      if (canMoveHorizontally(s.currentBlock, offsetX) && canMoveVertically(s.currentBlock, offsetY)) {
        const newBlock = s.currentBlock.map(element => {
          const newX = Number(element.getAttribute('x')) + offsetX;
          const newY = Number(element.getAttribute('y')) + offsetY;
          element.setAttribute('x', `${newX}`);
          element.setAttribute('y', `${newY}`);
          return element;
        });
        return { ...s, currentBlock: newBlock };
      }
      return s;
    }, initialState)
  );

  movement$.subscribe((s: State) => {
    render(s);
  });


  // subscribe the movement

  const source$ = tick$.pipe(
    scan((s: State) => ({ ...s, gameEnd: !canMoveVertically(s.currentBlock, Block.HEIGHT) }), initialState),
    map((s: State) => {
      if (canMoveVertically(s.currentBlock, Block.HEIGHT)) {
        const newBlock = s.currentBlock.map(element => {
          const newY = Number(element.getAttribute('y')) + Block.HEIGHT;
          element.setAttribute('y', `${newY}`);
          return element;
        });
        return { ...s, currentBlock: newBlock };
      } else {
        // Add the current block to the existing blocks
        // const updatedExistingBlocks = [...existingBlocks, ...s.currentBlock];
  
        // const newCurrentBlock = createNewBlock();

        // return {
        //   ...s,
        //   currentBlock: [...s.currentBlock, ...newCurrentBlock],
        //   existingBlocks: updatedExistingBlocks,
        //   gameEnd: !canMoveVertically(newCurrentBlock, Block.HEIGHT),
        // Create a new block and update the state 
        return {
          ...s,
          currentBlock: s.nextBlock,
          nextBlock: createNewBlock(),
        };
      }
    })
  ).subscribe((s: State) => {
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