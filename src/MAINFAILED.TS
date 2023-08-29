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
import { map, filter, scan, tap, startWith } from "rxjs/operators";

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

interface BlockPosition {
  x: number;
  y: number;
  color: string
}

/** User input */

type Key = "KeyS" | "KeyA" | "KeyD";

type Event = "keydown" | "keyup" | "keypress";

/** Utility functions */

/** State processing */

type State = Readonly<{
  gameEnd: boolean;
}>;

const initialState: State = {
  gameEnd: false,
} as const;

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

const tetriminos = [
  // I Tetrimino
  { blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }], color: 'cyan' },
  // J Tetrimino
  { blocks: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], color: 'blue' },
  // L Tetrimino
  { blocks: [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], color: 'orange' },
  // O Tetrimino
  { blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], color: 'yellow' },
  // T Tetrimino
  { blocks: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], color: 'purple' },
  // Z Tetrimino
  { blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }], color: 'red' },
  // S Tetrimino
  { blocks: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], color: 'green' },
];

/**
 * This is the function called on page load. Your main game loop
 * should be called here.
 */
export function main() {

  const existingBlocks: BlockPosition[] = [
  
  ];

  const generateRandomTetrimino = () => {
    const randomIndex = Math.floor(Math.random() * tetriminos.length);
    return { ...tetriminos[randomIndex] };
  };

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

  const fromKey = (keyCode: Key, direction: number) =>
    key$.pipe(filter(({ code }) => code === keyCode), map(() => direction));

  const left$ = fromKey("KeyA", -1);
  const right$ = fromKey("KeyD", 1);
  const down$ = fromKey("KeyS", 0);

  // Merge the key observables to get the movement offsets
  // const movement$ = merge(left$, right$, down$);

  /** Observables */

  /** Determines the rate of time steps */
  const tick$ = interval(Constants.TICK_RATE_MS);

  const checkCollision = (block: BlockPosition, existingBlocks: BlockPosition[]): boolean => {
    return existingBlocks.some(existingBlock => {
      // Check if the positions of the two blocks overlap
      return block.x === existingBlock.x && block.y === existingBlock.y;
    });
  };

  const handleCollisionOrGround = (selectedTetrimino: any): BlockPosition[] => {
    existingBlocks.push(...selectedTetrimino.blocks);
    return existingBlocks; // Return the updated existingBlocks array
  };

  const checkOutOfBounds = (blocks: BlockPosition[]): boolean => {
    return blocks.some(block =>
      block.x < 0 || block.x >= Constants.GRID_WIDTH || block.y >= Constants.GRID_HEIGHT
    );
  };

  // const keyboardControl = (selectedTetrimino: any, existingBlocks: BlockPosition[]): any => {
  //   const tetriminoCopy = { ...selectedTetrimino };
  
  //   const movement$ = merge(left$, right$, down$).pipe(
  //     scan((acc, val) => acc + val, 0),
  //     startWith(0)
  //   );
  
  //   movement$.subscribe(dx => {
  //     const updatedBlocks = tetriminoCopy.blocks.map((block: BlockPosition) => ({
  //       x: block.x + dx,
  //       y: block.y,
  //       color: tetriminoCopy.color,
  //     }));
  
  //     if (!checkCollision(updatedBlocks, existingBlocks) && !checkOutOfBounds(updatedBlocks)) {
  //       tetriminoCopy.blocks = updatedBlocks;
  //     }
  //   });
  
  //   return tetriminoCopy;
  // };

  // const tetriminoSvgBlocks: SVGGraphicsElement[] = [];

  // function keyboardControl(tetrimino: any, existingBlocks: BlockPosition[]) {
  //   const tetriminoSvgBlocks: SVGGraphicsElement[] = []; // Initialize the array
  
  //   tetrimino.blocks.forEach((block: BlockPosition, index: number) => {
  //     const svgBlock = createSvgElement(svg.namespaceURI, 'rect', {
  //       height: `${Block.HEIGHT}`,
  //       width: `${Block.WIDTH}`,
  //       x: `${block.x * Block.WIDTH}`,
  //       y: `${block.y * Block.HEIGHT}`,
  //       style: `fill: ${tetrimino.color}`,
  //     });
  
  //     tetriminoSvgBlocks.push(svgBlock as SVGGraphicsElement); // Add the SVG block to the array

  //     svg.appendChild(svgBlock);
  //     return svgBlock;
  //   });
  
  //   const action$ = merge(left$, right$, down$).pipe(
  //     scan((acc: { x: number; y: number }, direction: number) => {
  //       const tetriminoBlocks = tetrimino.blocks.map((block: BlockPosition, index: number) => ({
  //         x: block.x + acc.x,
  //         y: block.y + acc.y,
  //       }));
  
  //       const collisionDetected = tetriminoBlocks.some((block: BlockPosition) =>
  //         checkCollision(block, existingBlocks) ||
  //         block.x < 0 || block.x >= Constants.GRID_WIDTH ||
  //         block.y >= Constants.GRID_HEIGHT
  //       );

  //       tetrimino.blocks.forEach((block: BlockPosition, index: number) => {
  //         const svgBlock = tetriminoSvgBlocks[index];
  //         svgBlock.setAttribute("x", `${block.x * Block.WIDTH}`);
  //         svgBlock.setAttribute("y", `${block.y * Block.HEIGHT}`);
  //       });
  
  //       if (!collisionDetected) {
  //         tetrimino.blocks = tetriminoBlocks;
  //         return { x: acc.x + direction * Block.WIDTH, y: acc.y };
  //       }
  
  //       return acc;
  //     }, { x: 0, y: 0 })
  //   ).subscribe(({ x, y }) => {
  //     tetrimino.blocks.forEach((block: BlockPosition, index: number) => {
  //       const svgBlock = tetriminoSvgBlocks[index];
  //       svgBlock.setAttribute("x", `${block.x * Block.WIDTH}`);
  //       svgBlock.setAttribute("y", `${block.y * Block.HEIGHT}`);
  //     });
  //   });
  // }

  function move(block: BlockPosition, existingBlocks: BlockPosition[]) {
    // This function will handle the movement of the tetrimino
    // Update the tetrimino's position based on user input and game rules
    const action$ = merge(left$, right$, down$).pipe(
      scan((acc: { x: number; y: number }, direction: number) => {
        // Copy the current position to avoid modifying the original block
        const currentBlock = { ...acc };
  
        // Update the x position based on direction and block width
        currentBlock.x = currentBlock.x + direction * Block.WIDTH;
  
        // Handle collision with walls
        if (currentBlock.x < 0) {
          currentBlock.x = 0;
        } else if (currentBlock.x > Viewport.CANVAS_WIDTH - Block.WIDTH) {
          currentBlock.x = Viewport.CANVAS_WIDTH - Block.WIDTH;
        }
  
        // Handle downward movement
        if (direction === 0) {
          currentBlock.y = currentBlock.y + Block.HEIGHT;
        }
  
        // Handle collision with the bottom
        if (currentBlock.y > Viewport.CANVAS_HEIGHT - Block.HEIGHT) {
          currentBlock.y = Viewport.CANVAS_HEIGHT - Block.HEIGHT;
        }
  
        // Return the updated position
        return { x: currentBlock.x, y: currentBlock.y };
      },
      { x: block.x, y: block.y })
    ).subscribe(({ x, y }) => {
      // Update the block's attributes to reflect the new position
      block.x = x;
      block.y = y;
      // block.setAttribute("x", `${x}`);
      // block.setAttribute("y", `${y}`);
    });
  }

  /**
   * Renders the current state to the canvas.
   *
   * In MVC terms, this updates the View using the Model.
   *
   * @param s Current state
   */
  const render = (s: State) => {
    // svg.innerHTML = '';

    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    existingBlocks.forEach(existingBlock => {
      const square = createSvgElement(svg.namespaceURI, 'rect', {
        height: `${Block.HEIGHT}`,
        width: `${Block.WIDTH}`,
        x: `${existingBlock.x * Block.WIDTH}`,
        y: `${existingBlock.y * Block.HEIGHT}`,
        style: `fill: ${existingBlock.color}`, // Adjust color for existing blocks
      });
      svg.appendChild(square);
    });

    const selectedTetrimino = tetriminos[3]; // Change this index to select a different shape

    selectedTetrimino.blocks.forEach(block => {
      const square = createSvgElement(svg.namespaceURI, 'rect', {
        height: `${Block.HEIGHT}`,
        width: `${Block.WIDTH}`,
        x: `${block.x * Block.WIDTH}`,
        y: `${block.y * Block.HEIGHT}`,
        style: `fill: ${selectedTetrimino.color}`,
      });
      svg.appendChild(square);
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

  const source$ = tick$.pipe(
  scan((s: State) => ({ ...s, gameEnd: false }), initialState),
  map((s: State) => {
    const selectedTetrimino = tetriminos[3]; // Change this index to select a different shape


    const updatedBlocks = selectedTetrimino.blocks.map(block => ({
      x: block.x,
      y: block.y + 1, // Move down by one position
      color: selectedTetrimino.color
    }));

    const collisionDetected = updatedBlocks.some((block: BlockPosition) =>
      checkCollision(block, existingBlocks) || block.y >= Constants.GRID_HEIGHT
    );

    if (!collisionDetected) {
      selectedTetrimino.blocks = updatedBlocks;
    } else {
      handleCollisionOrGround(selectedTetrimino); // Store the final positions
      const newTetrimino = generateRandomTetrimino(); // Generate a new random tetrimino
      selectedTetrimino.blocks = newTetrimino.blocks; // Update selectedTetrimino with new tetrimino
      selectedTetrimino.color = newTetrimino.color; // Update the color as well
      // selectedTetrimino.blocks = tetriminos[3].blocks
      // selectedTetrimino.color = tetriminos[3].color
    }

    return s;
  }),
  tap((s: State) => {
    render(s);

    if (s.gameEnd) {
      show(gameover);
    } else {
      hide(gameover);
    }
  })
).subscribe();
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
