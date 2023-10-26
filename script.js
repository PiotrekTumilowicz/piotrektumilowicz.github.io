import { Player } from '../player.js';
import { Enemy, EnemyManager } from '../enemy.js';

class GridSystem {
	constructor(matrix, playerX, playerY) {
		this.matrix = matrix;
		this.playerUiContext = this.getContext('playerUiContext', '#FF0000');
		this.playerImageContext = this.getContext('playerImageContext', 'yellow');
		this.enemyImageContext = this.getContext('enemyImageContext', 'red');
		this.labiryntImageContext = this.getContext('labiryntImageContext', '#222323');
		this.mapContext = this.getContext('mapContext', '#222323');
		this.buttonContext = this.getContext('buttonContext', '#222323');

		this.cellSize = 20;
		this.padding = 5;
		this.discoveredMatrix = matrix.map(row => row.map(() => false));
		this.player = new Player(playerX, playerY, this.loadImage.bind(this));
		this.enemyManager = new EnemyManager(this.loadImage.bind(this));
		this.enemyManager.addEnemy(
			new Enemy(
				'Bat',
				1,
				1,
				'../enemies/monster10_idle.png',
				'../enemies/monster10_prepareToAttack.png',
				'../enemies/monster10_attack.png',
				'../enemies/monster10_damage.png',
				'../enemies/monster10_dead.png',
				3
			)
		);
		this.enemyManager.addEnemy(
			new Enemy(
				'Bat2',
				1,
				10,
				'../enemies/monster10_idle.png',
				'../enemies/monster10_prepareToAttack.png',
				'../enemies/monster10_attack.png',
				'../enemies/monster10_damage.png',
				'../enemies/monster10_dead.png',
				3
			)
		);
		this.discoveredMatrix[playerY][playerX] = true;
		this.matrix[playerY][playerX] = 2;
		this.showMaze = false;
		this.imageCache = {};
		this.states = {
			exploring: 'exploring',
			fighting: 'fighting',
			waiting: 'waiting',
		};
		this.state = this.states.exploring;
		this.buttonImages = {
			exploring: '../buttons/',
			fighting: '../fight-buttons/',
		};
		this.enemyStates = {
			enemyIdle: 'enemyIdle',
			enemyPrepareToAttack: 'enemyPrepareToAttack',
			enemyAttack: 'enemyAttack',
		};
		this.enemyState = this.enemyStates.enemyIdle;
		this.currentEnemy = null;
		this.generateButtons();
		this.w = 0;
		this.h = 0;
		this.directions = {
			N: { dx: 0, dy: -1, left: 'W', right: 'E' },
			E: { dx: 1, dy: 0, left: 'N', right: 'S' },
			S: { dx: 0, dy: 1, left: 'E', right: 'W' },
			W: { dx: -1, dy: 0, left: 'S', right: 'N' },
		};
		// document.addEventListener('keydown', this.#handleKeyDown.bind(this));
		// document.addEventListener('keyup', this.#handleKeyUp.bind(this));
	}
	getContext(id, color = '#111', isTransparent = false) {
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		canvas.id = id;
		canvas.classList.add(id);
		if (id === 'labiryntImageContext') {
			canvas.classList.add('pixel-perfect');
		}
		if (id === 'enemyImageContext') {
			canvas.classList.add('pixel-perfect');
			isTransparent = true;
		}
		if (id === 'playerImageContext') {
			canvas.classList.add('pixel-perfect');
			isTransparent = true;
		}
		if (id === 'playerUiContext') {
			canvas.classList.add('pixel-perfect');
			isTransparent = true;
		}
		if (id === 'playerUiContext') {
			canvas.classList.add('pixel-perfect');
			isTransparent = true;
		}
		canvas.style.background = color;
		if (isTransparent) {
			canvas.style.backgroundColor = 'transparent';
		}
		let containerId;
		if (id === 'buttonContext') {
			containerId = 'buttonContainer';
		} else if (id === 'playerImageContext') {
			containerId = 'canvasContainer';
		} else if (id === 'enemyImageContext') {
			containerId = 'canvasContainer';
		} else if (id === 'enemyImageContext') {
			containerId = 'canvasContainer';
		} else if (id === 'playerUiContext') {
			containerId = 'playerUiContext';
		}else {
			containerId = 'canvasContainer';
		}
		let container = document.getElementById(containerId);
		if (!container) {
			container = document.createElement('div');
			container.id = containerId;
			document.body.appendChild(container);
		}
		container.appendChild(canvas);
		return context;
	}
	async render() {

		const wallImageName = this.#getWallImageName();
		//const wallImageName = this.#getDirectionImage();

		this.loadImage(`../images/${wallImageName}`).then(wallImage => {
			this.labiryntImageContext.drawImage(wallImage, 0, 0, w, h);
		}).catch(error => {
			console.error("Błąd podczas ładowania obrazka:", error);
		});

		this.loadImage(`../ui/player_border.png`).then(playerDirection => {
			this.playerUiContext.drawImage(playerDirection, 0, 0, w, h/3);
		}).catch(error => {
			console.error("Błąd podczas ładowania obrazka:", error);
		});

		this.loadImage(`../ui/player_direction_${this.player.direction}.png`).then(playerDirection => {
			this.playerUiContext.drawImage(playerDirection, 0, 0, w, h/3);
		}).catch(error => {
			console.error("Błąd podczas ładowania obrazka:", error);
		});

		this.loadImage(`../ui/player_floor_1.png`).then(playerFloor => {
			this.playerUiContext.drawImage(playerFloor, 0, 0, w, h/3);
		}).catch(error => {
			console.error("Błąd podczas ładowania obrazka:", error);
		});

		this.loadImage(`../ui/player_hp_${this.player.hp}.png`).then(playerHp => {
			this.playerUiContext.drawImage(playerHp, 0, 0, w, h/3);
		}).catch(error => {
			console.error("Błąd podczas ładowania obrazka:", error);
		});

		this.loadImage(`../ui/player_portret_10.png`).then(playerPortret => {
			this.playerUiContext.drawImage(playerPortret, 0, 0, w, h/3);
		}).catch(error => {
			console.error("Błąd podczas ładowania obrazka:", error);
		});

		const w = (this.cellSize + this.padding) * this.matrix[0].length - this.padding;
		const h = (this.cellSize + this.padding) * this.matrix.length - this.padding;
		
		this.w = w;
		this.h = h;
		
		this.playerImageContext.canvas.width = w;
		this.playerImageContext.canvas.height = h;
		this.enemyImageContext.canvas.width = w;
		this.enemyImageContext.canvas.height = h;
		this.labiryntImageContext.canvas.width = w;
		this.labiryntImageContext.canvas.height = h;
		this.mapContext.canvas.width = w;
		this.mapContext.canvas.height = h;
		this.buttonContext.canvas.width = w;
		this.buttonContext.canvas.height = h;
		this.playerUiContext.canvas.width = w;
		this.playerUiContext.canvas.height = h/3;

		this.player.renderPlayer(this.player, this.playerImageContext, w, h);

		for (let row = 0; row < this.matrix.length; row++) {
			for (let col = 0; col < this.matrix[row].length; col++) {
				const isVisible = this.#isCellVisible(col, row);
				if (isVisible) {
					this.discoveredMatrix[row][col] = true;
				}
			}
		}
		if (this.showMaze) {
			for (let row = 0; row < this.matrix.length; row++) {
				for (let col = 0; col < this.matrix[row].length; col++) {
					if (!this.discoveredMatrix[row][col]) {
						continue;
					}
					const cellVal = this.matrix[row][col];
					let color = '#222323';

					const x = col * (this.cellSize + this.padding);
					const y = row * (this.cellSize + this.padding);

					if (cellVal === 1) {
						color = '#4d4d4d';
					} else if (cellVal === 2) {
						color = this.player.color;
					}

					this.mapContext.fillStyle = color;
					this.mapContext.fillRect(x, y, this.cellSize, this.cellSize);

					if (cellVal === 2) {
						this.drawPlayerDirection(x, y, this.player.direction);
					}
				}
			}
		} else {
			this.mapContext.clearRect(0, 0, this.mapContext.canvas.width, this.mapContext.canvas.height);
		}
	}
	startBattle(enemy) {
		this.currentEnemy = enemy;
		this.enemyIdle(this.currentEnemy);
		this.switchToFightState();
	}
	playerAttack() {
		if (!this.currentEnemy) return;
		if (this.enemyState === this.enemyStates.enemyPrepareToAttack) {
			this.enemyPrepareToAttack();
			this.enemyState = this.enemyStates.enemyAttack;
			console.log(this.enemyState)
		} else if (this.enemyState === this.enemyStates.enemyAttack) {
			console.log('Enemy Attack!');
			this.player.hp -= 1;
			console.log(this.player.hp)
			this.render();
			this.enemyAttack();
			this.determineEnemyAction();
		} else if (this.enemyState === this.enemyStates.enemyIdle) {
			console.log('Enemy Idle!');
			this.currentEnemy.hp -= 1;
			console.log(`Attacking enemy ${this.currentEnemy.name}. Remaining HP: ${this.currentEnemy.hp}`);
			this.enemyDamage();
			this.determineEnemyAction();
			if (this.currentEnemy.hp <= 0) {
				console.log(`Enemy ${this.currentEnemy.name} defeated!`);
				this.enemyManager.removeEnemy(this.currentEnemy);
				this.endBattle();
			}
		}
	}
	determineEnemyAction() {
		const randomNumber = Math.random();

		if (randomNumber < 0.5) {
			this.enemyState = this.enemyStates.enemyIdle;
		} else {
			this.enemyState = this.enemyStates.enemyPrepareToAttack;
		}
	}
	playerDefense() {
		if (!this.currentEnemy) return;
		if (this.enemyState === this.enemyStates.enemyAttack) {
			this.enemyIdle(this.currentEnemy);
			this.determineEnemyAction();
			console.log('Player successfully defended!');
		} else if (this.enemyState === 'attack' && !this.playerDefending) {
			this.enemyAttack();
		}
		this.determineEnemyAction();
	}
	enemyIdle() {
		if (this.currentEnemy) {
			this.enemyManager.renderEnemyIdle(this.currentEnemy, this.enemyImageContext, this.w, this.h);
		}
	}
	enemyPrepareToAttack() {
		if (this.currentEnemy) {
			this.enemyManager.renderEnemyPrepareToAttack(this.currentEnemy, this.enemyImageContext, this.w, this.h);
		}
	}
	enemyAttack() {
		if (this.currentEnemy) {
			this.player.renderPlayerDamage(this.player, this.playerImageContext, this.w, this.h);
			this.enemyManager.renderEnemyAttack(this.currentEnemy, this.enemyImageContext, this.w, this.h);
		}
	}
	enemyDamage() {
		if (this.currentEnemy) {
			this.enemyManager.renderEnemyDamage(this.currentEnemy, this.enemyImageContext, this.w, this.h);
		}
	}
	renderEnemyDeath() {
		if (this.currentEnemy) {
			this.enemyManager.renderEnemyDeath(this.currentEnemy, this.enemyImageContext, this.w, this.h);
		}
	}
	endBattle() {
		this.enemyManager.renderEnemyDeath(this.currentEnemy, this.enemyImageContext, this.w, this.h);
		this.switchToExploringState();
		this.currentEnemy = null;
	}
	switchToFightState() {
		this.setState('fighting');
		//this.state = this.states.fighting;
	}
	switchToExploringState() {
		this.setState('exploring');
		//this.state = this.states.exploring;
	}
	generateButtons() {
		const buttonContainer = document.querySelector('#buttonContainer');
		const buttonsContainer = document.createElement('div');
		buttonsContainer.id = 'buttonsContainer';

		for (let i = 1; i <= 9; i++) {
			const btn = this.createButton(i);
			buttonsContainer.appendChild(btn);
		}

		buttonContainer.appendChild(buttonsContainer);
	}
	createButton(id) {
		const btn = document.createElement('button');
		btn.className = 'game-button';
		btn.style.backgroundImage = `url(${this.buttonImages[this.state]}${id}.png)`;
		btn.dataset.id = id;
		const setPressedImage = () => {
			btn.style.backgroundImage = `url(${this.buttonImages[this.state]}${id}-pressed.png)`;
		};
		const setNormalImage = () => {
			btn.style.backgroundImage = `url(${this.buttonImages[this.state]}${id}.png)`;
		};
		btn.addEventListener('mousedown', setPressedImage);
		btn.addEventListener('mouseup', setNormalImage);
		btn.addEventListener('mouseleave', setNormalImage);
		btn.addEventListener('touchstart', setPressedImage);
		btn.addEventListener('touchend', setNormalImage);
		btn.addEventListener('click', () => this.handleButtonClick(id));
		return btn;
	}
	setState(newState) {
		this.state = newState;
		this.refreshButtons();
	}
	refreshButtons() {
		const buttons = document.querySelectorAll('.game-button');
		buttons.forEach(btn => {
			const id = btn.dataset.id;
			btn.style.backgroundImage = `url(${this.buttonImages[this.state]}${id}.png)`;
		});
	}
	handleButtonClick(id) {
		if (this.state === this.states.exploring) {
			console.log(`button clicked in exploring: ${id}`);
			this.handleExploringActions(id);
		} else if (this.state === this.states.fighting) {
			console.log(`button clicked in fighting: ${id}`);
			this.handleFightingActions(id);
		}
	}
	handleExploringActions(id) {
		const actionMap = {
			1: () => {
				this.shakeScreen();
				this.renderPlayerAction('defense');
			},
			2: () => this.movePlayer({ keyCode: 'Forward' }),
			3: () => {
				this.shakeScreen();
				this.renderPlayerAction('attack');
			},
			4: () => this.movePlayer({ keyCode: 'Left' }),
			5: () => this.movePlayer({ keyCode: 'Backward' }),
			6: () => this.movePlayer({ keyCode: 'Right' }),
			8: () => this.toggleMazeVisibility(),
		};

		if (actionMap[id]) actionMap[id]();
	}
	handleFightingActions(id) {
		const actionMap = {
			1: () => {
				this.shakeScreen();
				this.renderPlayerAction('defense');
				this.playerDefense();
			},
			3: () => {
				this.shakeScreen();
				this.renderPlayerAction('attack');
				this.playerAttack();
			},
		};
		if (actionMap[id]) actionMap[id]();
	}
	renderPlayerAction(actionType) {
		const actionMethods = {
			defense: () => this.player.renderPlayerDefense(this.player, this.playerImageContext, this.w, this.h),
			attack: () => this.player.renderPlayerAttack(this.player, this.playerImageContext, this.w, this.h),
		};
		if (actionMethods[actionType]) actionMethods[actionType]();
	}
	movePlayer = ({ keyCode }) => {
		if (this.showMaze) return;
		let dx = 0;
		let dy = 0;
		switch (this.player.direction) {
			case 'N':
				dy = -1;
				break;
			case 'S':
				dy = 1;
				break;
			case 'E':
				dx = 1;
				break;
			case 'W':
				dx = -1;
				break;
		}
		if (keyCode === 'Left') {
			switch (this.player.direction) {
				case 'N':
					this.player.direction = 'W';
					break;
				case 'S':
					this.player.direction = 'E';
					break;
				case 'E':
					this.player.direction = 'N';
					break;
				case 'W':
					this.player.direction = 'S';
					break;
			}
			this.shakeScreenTurnRight();
			this.player.isMoving = true;
		} else if (keyCode === 'Right') {
			switch (this.player.direction) {
				case 'N':
					this.player.direction = 'E';
					break;
				case 'S':
					this.player.direction = 'W';
					break;
				case 'E':
					this.player.direction = 'S';
					break;
				case 'W':
					this.player.direction = 'N';
					break;
			}
			this.shakeScreenTurnLeft();
			this.player.isMoving = true;
		} else if (keyCode === 'Forward') {
			if (this.#isValidMove(dx, dy)) {
				this.#updateMatrix(this.player.y, this.player.x, 0);
				this.#updateMatrix(this.player.y + dy, this.player.x + dx, 2);
				this.player.y += dy;
				this.player.x += dx;
				this.player.isMoving = true;
				this.shakeScreenMoveForward();
			}
		} else if (keyCode === 'Backward') {
			if (this.#isValidMove(-dx, -dy)) {
				this.#updateMatrix(this.player.y, this.player.x, 0);
				this.#updateMatrix(this.player.y - dy, this.player.x - dx, 2);
				this.player.y -= dy;
				this.player.x -= dx;
				this.player.isMoving = true;
				this.shakeScreenMoveForward();
			}
		}
		if (this.player.isMoving) {
			const enemy = this.checkPlayerEnemyCollision();
			if (enemy) {
				console.log(enemy)
				this.startBattle(enemy);
			}
			this.render();
		}
	};
	toggleMazeVisibility() {
		const outlineCanvas = document.querySelector('#mapContext');
		this.showMaze = !this.showMaze;
		outlineCanvas.style.display = this.showMaze ? 'block' : 'none';
		this.render();
	}
	#isValidMove(dx, dy) {
		if (this.matrix[this.player.y + dy][this.player.x + dx] === 0) {
			// console.log('IsValidMove');
			return true;
		}
		this.shakeScreen();
		return false;
	}
	checkPlayerEnemyCollision() {
		return this.enemyManager.getEnemyAt(this.player.x, this.player.y);
	}
	#updateMatrix(y, x, val) {
		this.matrix[y][x] = val;
	}
	shakeScreen() {
		const imageContext = document.getElementById('labiryntImageContext');
		imageContext.classList.add('shake');
		setTimeout(() => {
			imageContext.classList.remove('shake');
		}, 300);
	}
	shakeScreenMoveForward() {
		const imageContext = document.getElementById('labiryntImageContext');
		imageContext.style.transform = 'scale(0.3)';
		imageContext.style.transform = 'translateY(-0.3%)';
		imageContext.style.maskImage = 'radial-gradient(circle, white 90%, transparent 95%)';
		setTimeout(() => {
			imageContext.style.transform = 'scale(1)';
			imageContext.style.maskImage = 'none';
		}, 150);
	}
	shakeScreenTurnLeft() {
		const imageContext = document.getElementById('labiryntImageContext');
		imageContext.style.transform = 'translateX(-0.5%)'; // Przesuń w lewo o 5%

		setTimeout(() => {
			imageContext.style.transform = 'translateX(0%)';
		}, 150);
	}
	shakeScreenTurnRight() {
		const imageContext = document.getElementById('labiryntImageContext');
		imageContext.style.transform = 'translateX(0.5%)'; // Przesuń w prawo o 5%

		setTimeout(() => {
			imageContext.style.transform = 'translateX(0%)';
		}, 150);
	}
	loadImage(src) {
		if (this.imageCache[src]) {
			return Promise.resolve(this.imageCache[src]);
		}
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				this.imageCache[src] = img;
				resolve(img);
			};
			img.onerror = reject;
			img.src = src;
		});
	}
	#getWallImageName() {
		const { x, y, direction } = this.player;
		console.log(this.player);
		const { dx, dy, left, right } = this.directions[direction];

		const getCellValue = (dx, dy) => {
			return (this.matrix[y + dy] && this.matrix[y + dy][x + dx]) || 0;
		};

		const frontCell = getCellValue(dx, dy);
		const leftCell = getCellValue(this.directions[left].dx, this.directions[left].dy);
		const rightCell = getCellValue(this.directions[right].dx, this.directions[right].dy);

		let imageName = 'wall-';
		if (frontCell === 0 && leftCell === 1 && rightCell === 1) {
			imageName += '1';
		} else if (leftCell === 1 && frontCell === 0 && rightCell === 0) {
			imageName += '2';
		} else if (leftCell === 0 && frontCell === 0 && rightCell === 0) {
			imageName += '3';
		} else if (leftCell === 0 && frontCell === 0 && rightCell === 1) {
			imageName += '4';
		} else if (leftCell === 1 && frontCell === 1 && rightCell === 1) {
			imageName += '5';
		} else if (leftCell === 1 && frontCell === 1 && rightCell === 0) {
			imageName += '6';
		} else if (leftCell === 1 && frontCell === 1 && rightCell === 0) {
			imageName += '7';
		} else if (leftCell === 0 && frontCell === 1 && rightCell === 1) {
			imageName += '8';
		} else if (leftCell === 0 && frontCell === 1 && rightCell === 0) {
			imageName += '9';
		}
		return imageName + '.png';
	}
	drawPlayerDirection(x, y) {
		this.mapContext.fillStyle = '#c6b7be';
		this.mapContext.fillRect(x, y, this.cellSize, this.cellSize);
	}
	#isCellVisible(col, row) {
		const withinXRange = Math.abs(col - this.player.x) <= 1;
		const withinYRange = Math.abs(row - this.player.y) <= 1;

		return withinXRange && withinYRange;
	}
}
const gridMatrix = [
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	[1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	[1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	[1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	[1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	[1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
	[1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
	[1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
	[1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
	[1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1],
	[1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1],
	[1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1],
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];
const gridSystem = new GridSystem(gridMatrix, 1, 11);
gridSystem.render();
