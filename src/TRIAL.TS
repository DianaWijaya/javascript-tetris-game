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

import { fromEvent, generate, interval, merge, from, Observable, Subscription } from "rxjs";
import { map, filter, scan, takeWhile, tap } from "rxjs/operators";

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

const existingBlocks: SVGRectElement[] = [];

function addBlockToExistingBlocks(block: SVGRectElement) {
  existingBlocks.push(block);
}

let addedBlockSubscription: Subscription | null = null;

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

  const fromKey = (keyCode: Key, direction: number) =>
    key$.pipe(filter(({ code }) => code === keyCode), map(() => direction));

  const left$ = fromKey("KeyA", -1);
  const right$ = fromKey("KeyD", 1);
  const down$ = fromKey("KeyS", 0);

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
    // Add blocks to the main grid canvas

  /** Observables */
    
  // const cube2 = createSvgElement(svg.namespaceURI, "rect", {
  //   height: `${Block.HEIGHT}`,
  //   width: `${Block.WIDTH}`,
  //   x: `${Block.WIDTH * (3 - 1)}`,
  //   y: `${Block.HEIGHT * (20 - 1)}`,
  //   style: "fill: red",
  // });
  // svg.appendChild(cube2);
  // addBlockToExistingBlocks(cube2 as SVGRectElement);

  // const cube3 = createSvgElement(svg.namespaceURI, "rect", {
  //   height: `${Block.HEIGHT}`,
  //   width: `${Block.WIDTH}`,
  //   x: `${Block.WIDTH * (4 - 1)}`,
  //   y: `${Block.HEIGHT * (20 - 1)}`,
  //   style: "fill: red",
  // });
  // svg.appendChild(cube3);
  // addBlockToExistingBlocks(cube3 as SVGRectElement);

  // Add a block to the preview canvas
  const cubePreview = createSvgElement(preview.namespaceURI, "rect", {
    height: `${Block.HEIGHT}`,
    width: `${Block.WIDTH}`,
    x: `${Block.WIDTH * 2}`,
    y: `${Block.HEIGHT}`,
    style: "fill: blue",
  });
  preview.appendChild(cubePreview);
  };

  const keyboardControl = (object: SVGElement, existingBlocks: SVGRectElement[]) => {
    const keyDown$ = fromEvent<KeyboardEvent>(document, "keydown");
  
    return keyDown$.pipe(
      map(event => {
        switch (event.code) {
          case "KeyA": return -1; // Move left
          case "KeyD": return 1;  // Move right
          case "KeyS": return 0;  // Move down
          default: return 0;      // Default to no movement
        }
      }),
      scan((state, direction) => {
        const replacedObject = object as SVGRectElement;
  
        const newX = Math.max(
          0,
          Math.min(
            Viewport.CANVAS_WIDTH - Block.WIDTH,
            replacedObject.x.baseVal.value + direction * Block.WIDTH
          )
        );
        const newY = direction !== 0
          ? replacedObject.y.baseVal.value
          : Math.min(
              Viewport.CANVAS_HEIGHT - Block.HEIGHT,
              replacedObject.y.baseVal.value + Block.HEIGHT
            );
  
        if (!checkCollision(replacedObject, existingBlocks)) {
          replacedObject.x.baseVal.value = newX;
          replacedObject.y.baseVal.value = newY;
        }

        // else {
        //   addedBlock = generateNewBlock()
        // }
  
        return { x: newX, y: newY };
      }, {
        x: (object as SVGRectElement).x.baseVal.value,
        y: (object as SVGRectElement).y.baseVal.value
      }),
      takeWhile(({ x, y }) => !checkCollision(object as SVGRectElement, existingBlocks)),
      tap(({ x, y }) => {
        (object as SVGRectElement).setAttribute("x", `${x}`);
        (object as SVGRectElement).setAttribute("y", `${y}`);
      })
    ).subscribe();
  };

  // const added_block = createSvgElement(svg.namespaceURI, "rect", {
  //   height: `${Block.HEIGHT}`,
  //   width: `${Block.WIDTH}`,
  //   x: "0",
  //   y: "0",
  //   style: "fill: green",
  // });
  // svg.appendChild(added_block);

  function generateNewBlock() {
    // Unsubscribe from the previous addedBlockSubscription if it exists
    if (addedBlockSubscription) {
      addedBlockSubscription.unsubscribe();
    }
  
    const newBlock = createSvgElement(svg.namespaceURI, "rect", {
      height: `${Block.HEIGHT}`,
      width: `${Block.WIDTH}`,
      x: "0",
      y: "0",
      style: "fill: pink",
    });
  
    svg.appendChild(newBlock);
    addBlockToExistingBlocks(newBlock as SVGRectElement);
  
    // Create a new subscription for the keyboard control of the newBlock
    addedBlockSubscription = keyboardControl(newBlock as SVGRectElement, existingBlocks);
  
    return newBlock;
  }

  function removeFilledRows() {
    const rowsToRemove = [];
  
    for (let row = Constants.GRID_HEIGHT - 1; row >= 0; row--) {
      const blocksInRow = existingBlocks.filter(block => {
        const blockY = block.y.baseVal.value;
        return Math.floor(blockY / Block.HEIGHT) === row;
      });
  
      if (blocksInRow.length === Constants.GRID_WIDTH) {
        rowsToRemove.push(row);
      }
    }
  
    rowsToRemove.forEach(row => {
      const blocksInRow = existingBlocks.filter(block => {
        const blockY = block.y.baseVal.value;
        return Math.floor(blockY / Block.HEIGHT) === row;
      });
  
      blocksInRow.forEach(block => {
        block.remove();
        existingBlocks.splice(existingBlocks.indexOf(block), 1);
      });
  
      // Move all blocks above the removed row down by one row
      existingBlocks.forEach(block => {
        const blockY = block.y.baseVal.value;
        if (blockY < (row * Block.HEIGHT)) {
          block.y.baseVal.value += Block.HEIGHT;
        }
      });
    });
  }
  

  // const generateNewBlockObservable = new Observable(observer => {
  //   const newBlock = generateNewBlock();
  //   observer.next(newBlock);
  //   observer.complete();
  // });
  

  let addedBlock = generateNewBlock()

  function checkCollision(block: SVGRectElement, existingBlocks: SVGRectElement[]): boolean {
    const blockX = block.x.baseVal.value;
    const blockY = block.y.baseVal.value;
  
    const collisionDetected = existingBlocks.some(existingBlock => {
      const existingBlockX = existingBlock.x.baseVal.value;
      const existingBlockY = existingBlock.y.baseVal.value;
  
      return blockY + Block.HEIGHT === existingBlockY && blockX === existingBlockX;
    });
  
    const touchesBottom = blockY + Block.HEIGHT === Viewport.CANVAS_HEIGHT;
  
    if (collisionDetected || touchesBottom) {
      // Stop all operations and disable controls
      // source$.unsubscribe(); // Unsubscribe from the tick$ observable
      // keyDownSubscription.unsubscribe();
      addedBlock = generateNewBlock()
      
      // addedBlock = generateNewBlock();
      return true; // Collision detected
    }
  
    return false; // No collision detected
  }

  // if checkCollision()
  // keyboardControl(added_block); 
  // keyboardControl(addedBlock, existingBlocks);

  const source$ = tick$.pipe(
    scan((s: State) => ({ ...s, gameEnd: false }), initialState),
    map((s: State) => {
      const cubeRect = addedBlock as SVGRectElement;

      // Check for collision with existing blocks
      if (!checkCollision(cubeRect, existingBlocks)) {
        cubeRect.y.baseVal.value += Block.HEIGHT;

        if (cubeRect.y.baseVal.value >= Viewport.CANVAS_HEIGHT - Block.HEIGHT) {
          cubeRect.y.baseVal.value = Viewport.CANVAS_HEIGHT - Block.HEIGHT;
        }
      }

      removeFilledRows();

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