import { Player } from '../player.js';
import { Enemy, EnemyManager } from '../enemy.js';
import { LabiryntObject, LabiryntObjectManager } from '../labiryntObject.js';
//import { GameIntro } from '../gameIntro.js';

class GridSystem {
	constructor(matrix, playerX, playerY) {
		this.matrix = matrix;

		this.startGameContext = this.getContext('startGameContext', '#232222k');

		this.playerUiContext = this.getContext('playerUiContext', '#FF0000');
		this.playerImageContext = this.getContext('playerImageContext', 'yellow');
		this.enemyImageContext = this.getContext('enemyImageContext', 'red');

		this.labiryntObjectImageContext = this.getContext('labiryntObjectImageContext', 'blue');
		this.labiryntImageContext = this.getContext('labiryntImageContext', '#222323');
		this.mapContext = this.getContext('mapContext', '#222323');
		this.buttonContext = this.getContext('buttonContext', '#222323');

		this.cellSize = 18;
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
				8,
				'../enemies/monster10_idle.png',
				'../enemies/monster10_prepareToAttack.png',
				'../enemies/monster10_attack.png',
				'../enemies/monster10_damage.png',
				'../enemies/monster10_dead.png',
				3
			)
		);
		this.labiryntObjectManager = new LabiryntObjectManager(this.loadImage.bind(this));
		this.labiryntObjectManager.addLabiryntObject(new LabiryntObject('Door', 1, 10, 'N'));
		this.labiryntObjectManager.addLabiryntObject(new LabiryntObject('Switch', 2, 11, 'E'));

		this.discoveredMatrix[playerY][playerX] = true;
		this.matrix[playerY][playerX] = 2;
		this.showMaze = false;
		this.imageCache = {};
		this.states = {
			exploring: 'exploring',
			fighting: 'fighting',
			waiting: 'waiting',
			interaction: 'interaction',
			startGame: 'startGame',
		};
		this.state = this.states.startGame;
		this.buttonImages = {
			exploring: '../buttons/',
			fighting: '../fight-buttons/',
			interaction: '../interaction-buttons/',
			startGame: '../startGame-buttons/',
		};
		this.enemyStates = {
			enemyIdle: 'enemyIdle',
			enemyPrepareToAttack: 'enemyPrepareToAttack',
			enemyAttack: 'enemyAttack',
		};
		this.enemyState = this.enemyStates.enemyIdle;

		this.objectStates = {
			renderOff: 'renderOff',
			renderOn: 'renderOn',
		};
		this.objectState = this.objectStates.renderOff;

		this.currentEnemy = null;
		this.currentLabiryntObject = null;

		this.generateButtons();
		this.w = 0;
		this.h = 0;
		this.directions = {
			N: { dx: 0, dy: -1, left: 'W', right: 'E' },
			E: { dx: 1, dy: 0, left: 'N', right: 'S' },
			S: { dx: 0, dy: 1, left: 'E', right: 'W' },
			W: { dx: -1, dy: 0, left: 'S', right: 'N' },
		};

		this.isDoorOpen = false;
		this.isSwitchOn = false;
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
		if (id === 'labiryntObjectImageContext') {
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
		} else if (id === 'startGameContext') {
			containerId = 'startGameContainer';
		} else if (id === 'playerImageContext') {
			containerId = 'canvasContainer';
		} else if (id === 'enemyImageContext') {
			containerId = 'canvasContainer';
		} else if (id === 'labiryntObjectImageContext') {
			containerId = 'canvasContainer';
		} else if (id === 'playerUiContext') {
			containerId = 'playerUiContext';
		} else {
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
		console.log('RENDER!!!!');
		const wallImageName = this.#getWallImageName();

		if (this.state === this.states.startGame) {
			this.startIntroLoop();
			this.loadImage(`../cover/start-game-cover.png`)
				.then(startGame => {
					this.playerUiContext.canvas.style.display = 'none';
					this.playerImageContext.canvas.style.display = 'none';
					this.labiryntObjectImageContext.canvas.style.display = 'none';
					this.labiryntImageContext.canvas.style.display = 'none';
					this.enemyImageContext.canvas.style.display = 'none';

					this.startGameContext.drawImage(startGame, 0, 0, w, h * 1.35);
				})
				.catch(error => {
					console.error('Błąd podczas ładowania obrazka:', error);
				});
		} else if (
			this.state === this.states.exploring ||
			this.state === this.states.fighting ||
			this.state === this.states.interaction
		) {
			this.startGameContext.canvas.style.display = 'none';
			this.playerUiContext.canvas.style.display = 'block';
			this.playerImageContext.canvas.style.display = 'block';
			this.labiryntObjectImageContext.canvas.style.display = 'block';
			this.labiryntImageContext.canvas.style.display = 'block';
			this.enemyImageContext.canvas.style.display = 'block';

			this.loadImage(`../images/${wallImageName}`)
				.then(wallImage => {
					this.labiryntImageContext.drawImage(wallImage, 0, 0, w, h);
				})
				.catch(error => {
					console.error('Błąd podczas ładowania obrazka:', error);
				});

			this.loadImage(`../ui/player_border.png`)
				.then(playerBorder => {
					this.playerUiContext.drawImage(playerBorder, 0, 0, w, h / 3);
				})
				.catch(error => {
					console.error('Błąd podczas ładowania obrazka:', error);
				});

			this.loadImage(`../ui/player_direction_${this.player.direction}.png`)
				.then(playerDirection => {
					this.playerUiContext.drawImage(playerDirection, 0, 0, w, h / 3);
				})
				.catch(error => {
					console.error('Błąd podczas ładowania obrazka:', error);
				});

			this.loadImage(`../ui/player_floor_1.png`)
				.then(playerFloor => {
					this.playerUiContext.drawImage(playerFloor, 0, 0, w, h / 3);
				})
				.catch(error => {
					console.error('Błąd podczas ładowania obrazka:', error);
				});

			this.loadImage(`../ui/player_hp_${this.player.hp}.png`)
				.then(playerHp => {
					this.playerUiContext.drawImage(playerHp, 0, 0, w, h / 3);
				})
				.catch(error => {
					console.error('Błąd podczas ładowania obrazka:', error);
				});

			this.loadImage(`../ui/player_portret_10.png`)
				.then(playerPortret => {
					this.playerUiContext.drawImage(playerPortret, 0, 0, w, h / 3);
				})
				.catch(error => {
					console.error('Błąd podczas ładowania obrazka:', error);
				});
		}

		const w = (this.cellSize + this.padding) * this.matrix[0].length - this.padding;
		const h = (this.cellSize + this.padding) * this.matrix.length - this.padding;

		this.w = w;
		this.h = h;

		this.startGameContext.canvas.width = w;
		this.startGameContext.canvas.height = h * 1.34;
		this.playerImageContext.canvas.width = w;
		this.playerImageContext.canvas.height = h;
		this.enemyImageContext.canvas.width = w;
		this.enemyImageContext.canvas.height = h;
		this.labiryntObjectImageContext.canvas.width = w;
		this.labiryntObjectImageContext.canvas.height = h;
		this.labiryntImageContext.canvas.width = w;
		this.labiryntImageContext.canvas.height = h;
		this.mapContext.canvas.width = w;
		this.mapContext.canvas.height = h;
		this.buttonContext.canvas.width = w;
		this.buttonContext.canvas.height = h;
		this.playerUiContext.canvas.width = w;
		this.playerUiContext.canvas.height = h / 3;

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
					//console.log(cellVal);
					let color = '#222323';

					const x = col * (this.cellSize + this.padding);
					const y = row * (this.cellSize + this.padding);

					if (cellVal === 1 || cellVal === 3 || cellVal === 4) {
						color = '#4d4d4d';
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
	startGameAndRenderPlayer() {
		this.switchToExploringState();
		this.player.renderPlayer(this.player, this.playerImageContext, this.w, this.h);
		this.render();
	}
	interactionWithObject(labiryntObject) {
		console.log(labiryntObject);
		this.currentLabiryntObject = labiryntObject;
		this.switchToInteractionState();
		this.render();
	}
	endInteractionWithObject() {
		this.currentLabiryntObject = null;
		this.switchToExploringState();
	}
	playerSwitchLabiryntObject() {
		//console.log(this.isSwitchOn);
		//console.log(this.isDoorOpen);
		this.isSwitchOn = !this.isSwitchOn;
		this.isDoorOpen = !this.isDoorOpen;
		//console.log(`Switch is now: ${this.isSwitchOn}`);
		//console.log(`Door is now: ${this.isDoorOpen}`);
		this.render();
	}
	startBattle(enemy) {
		this.currentEnemy = enemy;
		this.enemyIdle(this.currentEnemy);
		this.switchToFightState();
	}
	playerAttack() {
		if (!this.currentEnemy) return;

		const applyPlayerAttack = () => {
			this.currentEnemy.hp -= 1;
			//console.log(`Attacking enemy ${this.currentEnemy.name}. Remaining HP: ${this.currentEnemy.hp}`);
			this.enemyDamage();
		};

		const enemyAttackAction = () => {
			//console.log('Enemy Attack!');
			this.player.hp -= 1;
			//console.log(this.player.hp);
			this.render();
			this.enemyAttack();
			this.determineEnemyAction();
		};

		const enemyDefeatedAction = () => {
			//console.log(`Enemy ${this.currentEnemy.name} defeated!`);
			this.enemyManager.removeEnemy(this.currentEnemy);
			this.endBattle();
		};

		switch (this.enemyState) {
			case this.enemyStates.enemyPrepareToAttack:
				applyPlayerAttack();
				this.enemyPrepareToAttack();
				this.enemyState = this.enemyStates.enemyAttack;
				break;

			case this.enemyStates.enemyAttack:
				enemyAttackAction();
				break;

			case this.enemyStates.enemyIdle:
				//console.log('Enemy Idle!');
				applyPlayerAttack();
				this.determineEnemyAction();
				break;
		}

		if (this.currentEnemy.hp <= 0) {
			enemyDefeatedAction();
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
			this.enemyIdle();
			this.determineEnemyAction();
			this.shakeScreenDefense();
			//console.log('Player successfully defended!');
		} else if (this.enemyState === 'attack' && !this.playerDefending) {
			this.enemyAttack();
			this.shakeScreen();
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
			this.shakeScreenAttack();
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
	}
	switchToInteractionState() {
		this.setState('interaction');
	}
	switchToExploringState() {
		this.setState('exploring');
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
	handleButtonClick(id) {
		if (this.state === this.states.startGame) {
			this.handleStartGameActions(id);
		} else if (this.state === this.states.exploring) {
			this.handleExploringActions(id);
		} else if (this.state === this.states.fighting) {
			this.handleFightingActions(id);
		} else if (this.state === this.states.interaction) {
			this.handleInteractionActions(id);
		}
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
	handleStartGameActions(id) {
		if (id === 1 || id === 2 || id === 3) {
			this.renderPlayerAction('startGame');
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
	handleInteractionActions(id) {
		const actionMap = {
			1: () => {
				this.shakeScreen();
				this.renderPlayerAction('defense');
			},
			2: () => this.movePlayer({ keyCode: 'Forward' }),
			3: () => {
				this.shakeScreen();
				this.renderPlayerAction('switch');
				this.playerSwitchLabiryntObject();
			},
			4: () => this.movePlayer({ keyCode: 'Left' }),
			5: () => this.movePlayer({ keyCode: 'Backward' }),
			6: () => this.movePlayer({ keyCode: 'Right' }),
			8: () => this.toggleMazeVisibility(),
		};

		if (actionMap[id]) actionMap[id]();
	}
	renderPlayerAction(actionType) {
		const switchIsOffOrOn = this.isSwitchOn ? 'Off' : 'On';
		const actionMethods = {
			defense: () => this.player.renderPlayerDefense(this.player, this.playerImageContext, this.w, this.h),
			attack: () => this.player.renderPlayerAttack(this.player, this.playerImageContext, this.w, this.h),
			switch: () => {
				const switchMethodName = `renderPlayerSwitch${switchIsOffOrOn}`;
				this.player[switchMethodName](this.player, this.playerImageContext, this.w, this.h);
			},
			startGame: () => {
				this.startGameAndRenderPlayer();
			},
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
				const currentPosition = this.matrix[this.player.y][this.player.x];
				const targetCell = this.matrix[this.player.y + dy][this.player.x + dx];
				
				// Aktualizacja pozycji, z której gracz się przemieszcza, tylko jeżeli nie są to drzwi
				if (currentPosition !== 3) {
					this.#updateMatrix(this.player.y, this.player.x, 0);
				}
		
				// Aktualizacja nowej pozycji gracza, tylko jeżeli nie są to drzwi
				if (targetCell !== 3) {
					this.#updateMatrix(this.player.y + dy, this.player.x + dx, 2);
				}
		
				this.player.y += dy;
				this.player.x += dx;
				this.player.isMoving = true;
				this.shakeScreenMoveForward();
			}
		} else if (keyCode === 'Backward') {
			if (this.#isValidMove(-dx, -dy)) {
				const currentPosition = this.matrix[this.player.y][this.player.x];
				const targetCell = this.matrix[this.player.y - dy][this.player.x - dx];
		
				// Aktualizacja pozycji, z której gracz się przemieszcza, tylko jeżeli nie są to drzwi
				if (currentPosition !== 3) {
					this.#updateMatrix(this.player.y, this.player.x, 0);
				}
		
				// Aktualizacja nowej pozycji gracza, tylko jeżeli nie są to drzwi
				if (targetCell !== 3) {
					this.#updateMatrix(this.player.y - dy, this.player.x - dx, 2);
				}
		
				this.player.y -= dy;
				this.player.x -= dx;
				this.player.isMoving = true;
				this.shakeScreenMoveForward();
			}
		}
		if (this.player.isMoving) {
			const enemy = this.checkPlayerEnemyCollision();
			const labiryntObject = this.checkPlayerlabiryntObjectCollision();
			this.player.renderPlayer(this.player, this.playerImageContext, this.w, this.h);
			const targetCell = this.matrix[this.player.y + dy][this.player.x + dx];

			if (enemy) {
				//console.log(enemy);
				this.startBattle(enemy);
			} else if (labiryntObject) {
				//console.log(this.player.direction);
				//console.log(labiryntObject.direction);
				if (labiryntObject && this.player.direction === labiryntObject.direction) {
					if (labiryntObject.name !== 'Door') this.interactionWithObject(labiryntObject);
					//console.log(`labiryntObject: ${labiryntObject}`);
				} else if (labiryntObject.name !== 'Door' && this.player.direction !== labiryntObject.direction) {
					this.endInteractionWithObject();
					//console.log('Interaction ended');
				}
			} else {
				this.endInteractionWithObject();
				//console.log('Interaction ended');
			}
			this.render();
		}
	};
	toggleMazeVisibility() {
		const outlineCanvas = document.querySelector('#mapContext');
		this.showMaze = !this.showMaze;
		outlineCanvas.style.display = this.showMaze ? 'block' : 'none';
		this.render();
		this.player.renderPlayer(this.player, this.playerImageContext, this.w, this.h);
	}
	checkPlayerEnemyCollision() {
		return this.enemyManager.getEnemyAt(this.player.x, this.player.y);
	}
	checkPlayerlabiryntObjectCollision() {
		return this.labiryntObjectManager.getLabiryntObjectAt(this.player.x, this.player.y);
	}
	#updateMatrix(y, x, val) {
		
		this.matrix[y][x] = val;
	}
	shakeScreenAttack() {
		const imageContext = document.getElementById('labiryntImageContext');
		imageContext.style.transform = 'scale(0.9) translateY(-0.3%) rotate(-10deg)';
		imageContext.style.maskImage = 'radial-gradient(circle, white 90%, transparent 95%)';
		setTimeout(() => {
			imageContext.style.transition = 'transform 0.3s ease-out';
			imageContext.style.transform = 'scale(1) translateY(0%) rotate(0deg)';
			imageContext.style.maskImage = 'none';
			setTimeout(() => {
				imageContext.style.transition = '';
			}, 300);
		}, 150);
	}
	shakeScreenDefense() {
		const imageContext = document.getElementById('labiryntImageContext');
		imageContext.style.transform = 'scale(0.9) translateY(-0.3%) rotate(10deg)';
		imageContext.style.maskImage = 'radial-gradient(circle, white 90%, transparent 95%)';
		setTimeout(() => {
			imageContext.style.transition = 'transform 0.3s ease-out';
			imageContext.style.transform = 'scale(1) translateY(0%) rotate(0deg)';
			imageContext.style.maskImage = 'none';
			setTimeout(() => {
				imageContext.style.transition = '';
			}, 300);
		}, 150);
	}
	shakeScreen() {
		const imageContext = document.getElementById('labiryntImageContext');
		imageContext.style.transition = 'transform 50ms';
		const shakes = [
			'translate(2px, 2px)',
			'translate(-2px, -2px)',
			'translate(2px, -2px)',
			'translate(-2px, 2px)',
			'translate(1px, 1px)',
			'translate(-1px, -1px)',
		];
		let i = 0;
		function applyShake() {
			if (i >= shakes.length) {
				imageContext.style.transform = '';
				imageContext.style.transition = '';
				return;
			}
			imageContext.style.transform = shakes[i];
			i++;
			setTimeout(applyShake, 50);
		}
		applyShake();
	}
	shakeScreenMoveForward() {
		const imageContext = document.getElementById('labiryntImageContext');

		// Krok 1: Szybki zoom i subtelne przesunięcie ekranu w górę.
		imageContext.style.transform = 'scale(1.01) translateY(-0.1%)';

		// Krok 2: Powrót ekranu do pozycji początkowej (efekt "zoom out" i subtelne przesunięcie w dół).
		setTimeout(() => {
			imageContext.style.transform = 'scale(1) translateY(0.5%)';
		}, 150);

		// Krok 3: Usuń ewentualne maski.
		setTimeout(() => {
			imageContext.style.maskImage = 'none';
		}, 200);
	}
	shakeScreenTurnLeft() {
		const imageContext = document.getElementById('labiryntImageContext');

		// Dodajemy właściwość transition bezpośrednio za pomocą JavaScript
		imageContext.style.transition = 'transform 0.35s ease-out';

		imageContext.style.transform = 'translateX(0.5%)'; // Przesuń w lewo o 0.5%

		setTimeout(() => {
			imageContext.style.transform = 'translateX(0%)';
		}, 150);
	}
	shakeScreenTurnRight() {
		const imageContext = document.getElementById('labiryntImageContext');

		// Dodajemy właściwość transition bezpośrednio za pomocą JavaScript
		imageContext.style.transition = 'transform 0.35s ease-out';

		imageContext.style.transform = 'translateX(-0.5%)'; // Przesuń w prawo o 0.5%

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
		//console.log(x);
		//console.log(y);
		//console.log(`IS DOOR OPEN? ${this.isDoorOpen}`);
		const { dx, dy, left, right } = this.directions[direction];

		const getCellValue = (dx, dy) => {
			return (this.matrix[y + dy] && this.matrix[y + dy][x + dx]) || 0 ;
		};

		const frontCell = getCellValue(dx, dy);
		const leftCell = getCellValue(this.directions[left].dx, this.directions[left].dy);
		const rightCell = getCellValue(this.directions[right].dx, this.directions[right].dy);

		console.log(`leftCell: ${leftCell}`);
		console.log(`frontCell: ${frontCell}`);
		console.log(`rightCell ${rightCell}`);
		console.log('____________________');

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
		} else if ((leftCell === 1 || leftCell === 4) && frontCell === 1 && (rightCell === 0 || rightCell === 4)) {
			imageName += '6';
		} else if ((leftCell === 0) && frontCell === 1 && (rightCell === 0)) {
			imageName += '7';
		} else if ((leftCell === 0 || leftCell === 4) && frontCell === 1 && (rightCell === 1 || rightCell === 4)) {
			imageName += '8';
		} else if (leftCell === 0 && frontCell === 1 && rightCell === 1) {
			imageName += '9';






		} else if (leftCell === 1 && frontCell === 3 && this.isDoorOpen === true && rightCell === 1) {
			imageName += 'door-open';
		} else if (leftCell === 1 && frontCell === 3 && this.isDoorOpen === false && rightCell === 1) {
			imageName += 'door-closed';
		} else if (leftCell === 3 && frontCell === 1 && this.isDoorOpen === true && rightCell === 0) {
			imageName += 'door-open-6';
		} else if (leftCell === 0 && frontCell === 1 && this.isDoorOpen === true && rightCell === 3) {
			imageName += 'door-open-8';
		} else if (leftCell === 3 && frontCell === 1 && this.isDoorOpen === false && rightCell === 0) {
			imageName += 'door-closed-6';
		} else if (leftCell === 0 && frontCell === 1 && this.isDoorOpen === false && rightCell === 3) {
			imageName += 'door-closed-8';

		} else if (leftCell === 3 && frontCell === 0 && (this.isDoorOpen === true || this.isDoorOpen === false)  && rightCell === 3) {
			imageName += 'inside-door-tunel';
		} else if (leftCell === 0 && frontCell === 3 && (this.isDoorOpen === true || this.isDoorOpen === false)  && rightCell === 0) {
			imageName += 'inside-door';





		} else if (leftCell === 1 && frontCell === 4 && this.isSwitchOn === false && rightCell === 1) {
			imageName += 'switch-off';
		} else if (leftCell === 1 && frontCell === 4 && this.isSwitchOn === true && rightCell === 1) {
			imageName += 'switch-on';
		}
		//wall-inside-door
		console.log(imageName);

		return imageName + '.png';
	}
	drawPlayerDirection(x, y) {
		this.mapContext.fillStyle = '#c6b7be';
		this.mapContext.fillRect(x, y, this.cellSize, this.cellSize);
	}
	#isValidMove(dx, dy) {
		// if (this.matrix[this.player.y + dy][this.player.x + dx] === 0) {
		// 	return true;
		const targetCell = this.matrix[this.player.y + dy][this.player.x + dx];
		if (targetCell === 0 || (targetCell === 3 && this.isDoorOpen === true)) {
			return true;
		}
		this.shakeScreen();
		return false;
	}
	#isCellVisible(col, row) {
		const withinXRange = Math.abs(col - this.player.x) <= 1;
		const withinYRange = Math.abs(row - this.player.y) <= 1;
		return withinXRange && withinYRange;
	}
	wrapText(context, text, x, y, maxWidth, lineHeight, maxLettersPerLine) {
		//let words = text.split(' ');
		let words = text;
		let line = '';
		let lineCount = 0;
		for (let n = 0; n < words.length; n++) {
			// let word = words[n];
			// if (word[n] > maxLettersPerLine) {
			// 	while (words.length > maxLettersPerLine) {
			// 		let part = word.slice(0, maxLettersPerLine) + '-';
			// 		context.fillText(part, x, y);
			// 		word = word.slice(maxLettersPerLine);
			// 		line = '';
			// 		y += lineHeight;
			// 		lineCount++;
			// 	}
			// 	words[n] = word;
			// }

			let testLine = line + words[n] + ' ';
			let metrics = context.measureText(testLine);
			let testWidth = metrics.width;

			if ((testWidth > maxWidth || testLine.length > maxLettersPerLine) && n > 0) {
				context.fillText(line.trim(), x, y);
				line = words[n] + ' ';
				y += lineHeight;
				lineCount++;
			} else {
				line = testLine;
			}
		}
		context.fillText(line.trim(), x, y);
		return lineCount;
	}
	renderText(text, fontSize) {
		this.startGameContext.font = `${fontSize}px 'Press Start 2P'`;
		this.startGameContext.fillStyle = '#c6b7be';
		let x = 0;
		let y = fontSize;
		let lineHeight = fontSize * 1.5;
		let maxWidth = this.width;
		let maxLettersPerLine = 25;
		return this.wrapText(this.startGameContext, text, x, y, maxWidth, lineHeight, maxLettersPerLine);
	}
	startIntroLoop() {
		const introTexts = [
			'Once, the Anunnaki shrouded in benevolence, descended upon our realm.',
			'To the chosen hero, they presented a challenge of wisdom and courage',
			' to traverse the depths of the enigmatic Labyrinth and reclaim the Tablets of Destiny',
			'Tablets of Destin - relics of untold power that weave the very fabric of reality.',
		];
		let currentTextIndex = 0;
		let currentCharIndex = 0;
		let textIsComplete = false;
		let fontSize = 12;
		let x = 0;
		let y = fontSize;
		let lineHeight = fontSize * 1.5;

		const renderLoop = () => {
			if (!textIsComplete && this.state === this.states.startGame) {
				const text = introTexts[currentTextIndex];
				const displayText = text.substring(0, currentCharIndex++);
				let height = this.renderText(displayText, fontSize, x, y);
				if (currentCharIndex > text.length) {
					textIsComplete = true;
					setTimeout(() => {
						textIsComplete = false;
						currentCharIndex = 0;
						if (currentTextIndex < introTexts.length - 1) {
							currentTextIndex++;
						} else {
							currentTextIndex = 0;
						}
						this.startGameContext.clearRect(0, 0, 294, lineHeight * (height + 1));
					}, 3000);
				}
			}

			if (!textIsComplete) {
				setTimeout(() => {
					requestAnimationFrame(renderLoop);
				}, 100);
			} else {
				requestAnimationFrame(renderLoop);
			}
		};
		renderLoop();
	}
}
// 4 -> switch
// 3 -> door
// 2 -> player
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
	[3, 3, 3, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1],
	[1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1],
	[1, 0, 0, 4, 1, 1, 1, 0, 0, 0, 1, 0, 1],
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];
const gridSystem = new GridSystem(gridMatrix, 1, 11);
gridSystem.render();
