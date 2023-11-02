import { useEffect, useState } from 'react'
import './App.css'

const OFFSET = 32;
let xDirection = 0;
let yDirection = 1;

let running = false;
let time = new Date();
let timePerFrame = (1 / 12) * 1000; // using 12 frames per sec
let elapsedTime = 0;

let moveBuffer: [number, number][] = [];
let prevKeyDown = "";
window.addEventListener('keydown', (e) => {
	if (moveBuffer.length >= 2 || e.key === prevKeyDown) return;
	prevKeyDown = e.key;

	switch (e.key) {
		case "ArrowDown":
		case "s":
			moveBuffer.push([0, 1]);
			break;
		case "ArrowUp":
		case "w":
			moveBuffer.push([0, -1]);
			break;
		case "ArrowRight":
		case "d":
			moveBuffer.push([1, 0]);
			break;
		case "ArrowLeft":
		case "a":
			moveBuffer.push([-1, 0]);
			break;
	}
});

export default function App() {
	const [state, setState] = useState(() => {
		let nodes = getDefaultSnake();
		let apple = generateApple(new Set(nodes.map(({ x, y }) => `${x},${y}`)));
		return {
			nodes,
			apple,
		}
	})

	if (!running) {
		running = true;

		function gameLoop() {
			elapsedTime += Date.now() - time.getTime();
			time = new Date();

			if (elapsedTime > timePerFrame) {
				elapsedTime = elapsedTime % timePerFrame;

				// Get move from buffer
				if (moveBuffer.length > 0) {
					const [newX, newY] = moveBuffer.shift() as [number, number];

					if (Math.abs(xDirection) + Math.abs(newX) !== 2 && Math.abs(yDirection) + Math.abs(newY) !== 2) {
						xDirection = newX;
						yDirection = newY;
					}
				}

				setState(({ nodes, apple }) => {
					// Iterate through nodes
					let prevX: number = 0;
					let prevY: number = 0;
					let occupiedPositions = new Set<string>();

					for (let i = 0; i < nodes.length; i++) {
						if (i === 0) {
							prevX = nodes[i].x;
							prevY = nodes[i].y;
							nodes[i].x += OFFSET * xDirection;
							nodes[i].y += OFFSET * yDirection;
						} else {
							occupiedPositions.add(`${prevX},${prevY}`);
							let tempX = nodes[i].x;
							let tempY = nodes[i].y;
							nodes[i].x = prevX;
							nodes[i].y = prevY;
							prevX = tempX;
							prevY = tempY;
						}
					}

					// Check collisions
					let head = nodes[0];
					if (head.x < 0 || head.x >= 1024 || head.y < 0 || head.y >= 1024 || occupiedPositions.has(`${head.x},${head.y}`)) {
						// TODO: Show game over screen
						console.log('collision', head, nodes)
						nodes = getDefaultSnake();
						xDirection = 0;
						yDirection = 1;
						prevKeyDown = "";
					} else if (head.x === apple.x && head.y === apple.y) {
						occupiedPositions.add(`${head.x},${head.y}`)
						apple = generateApple(occupiedPositions);
						nodes.push({ x: prevX, y: prevY });
					}

					return {
						nodes,
						apple,
					};
				})
			}

			requestAnimationFrame(gameLoop);
		}
		gameLoop();
	}

	return (
		<>
			<div className="container" id="container">
				<svg viewBox="0 0 1024 1024">
					{
						state.nodes.map(({ x, y }, index) => <rect key={index} width="32" height="32" x={x} y={y} fill="#00ff00"></rect>)
					}
					{
						state.apple && <rect width="32" height="32" x={state.apple.x} y={state.apple.y} fill="#ff0000"></rect>
					}
				</svg>
			</div>
		</>
	)
}

function getDefaultSnake(): SnakeNode[] {
	let retVal = [];

	for (let i = 0; i < 3; i++) {
		retVal.push(
			{
				x: 1024 / 2,
				y: (1024 / 4) - (32 * i) + 128,
			}
		)
	}

	return retVal;
}

function generateApple(occupiedPositions: Set<string>): SnakeNode {
	let x = 0;
	let y = 0;

	do {
		x = Math.floor(Math.random() * (1024 / 32)) * 32;
		y = Math.floor(Math.random() * (1024 / 32)) * 32;

	} while (occupiedPositions.has(`${x},${y}`))

	return { x, y }
}