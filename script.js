class Player {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.color = 'orange';
		this.direction = 'N';
		this.idleAnimation = ['../player/sword_shield_01.png', '../player/sword_shield_02.png'];
		this.currentIdleFrame = 0;
		this.isMoving = false;
	}
}

class Enemy {
	constructor(name,x, y,combatImg,damageImg, deadImg) {
		this.name = name;
		this.x = x;
		this.y = y;
		this.hp = 3;
		this.damage = 1;
		this.combatImg = combatImg;
		this.damageImg = damageImg;
		this.deadImg = deadImg;

	}
}

class EnemyManager {
	constructor(loadImage) {
		this.loadImage = loadImage;
		this.enemies = [];
	}

	addEnemy(enemy) {
		this.enemies.push(enemy);
	}

	getEnemyAt(x, y) {
        return this.enemies.find(enemy => enemy.x === x && enemy.y === y);
    }

	removeEnemy(enemy) {
		const index = this.enemies.indexOf(enemy);
		if (index !== -1) {
			this.enemies.splice(index, 1);
		}
	}

	renderEnemies(player, context, w, h) {
		const { x, y } = player;
	
		this.enemies.forEach(enemy => {
			if (enemy.x === x && enemy.y === y) {
				this.loadImage(enemy.combatImg).then(img => {
					context.drawImage(img, 0, 0, w, h);
				});
			}
		});
	}
	renderEnemyDamage(enemy, context, w, h) {
		this.loadImage(enemy.damageImg).then(img => {
			context.drawImage(img, 0, 0, w, h);
			// Po pewnym czasie wróć do obrazka bazowego (na przykład po 500 ms)
			setTimeout(() => {
				this.loadImage(enemy.combatImg).then(baseImg => {
					context.drawImage(baseImg, 0, 0, w, h);
				});
			}, 500);
		});
	}
	
	renderEnemyDeath(enemy, context, w, h) {
		this.loadImage(enemy.deadImg).then(img => {
			context.drawImage(img, 0, 0, w, h);
			// Po pewnym czasie usuń obrazek (na przykład po 1000 ms)
			setTimeout(() => {
				context.clearRect(0, 0, w, h);
			}, 1000);
		});
	}
	
	
}

class GridSystem {
	constructor(matrix, playerX, playerY) {
		this.matrix = matrix;
		this.enemyImageContext = this.getContext('enemyImageContext', 'red');
		this.imageContext = this.getContext('imageContext', '#222323');
		this.outlineContext = this.getContext('outlineContext', '#222323');
		this.buttonContext = this.getContext('buttonContext', '#222323');
		this.arrowBackgroundColor = '#222323';
		this.cellSize = 20;
		this.padding = 5;
		this.discoveredMatrix = matrix.map(row => row.map(() => false));
		this.player = new Player(playerX, playerY);
		this.enemyManager = new EnemyManager(this.loadImage.bind(this));
		this.enemyManager.addEnemy(new Enemy('Bat',1, 1, '../enemies/monster10.png','../enemies/monster11.png','../enemies/monster12.png',  ));
		this.discoveredMatrix[playerY][playerX] = true;
		this.matrix[playerY][playerX] = 2;
		this.showMaze = false;
		this.imageCache = {};
		this.states = {
			exploring: 'exploring',
			fighting: 'fighting'
		};
		this.state = this.states.exploring;
		this.buttonImages = {
			exploring: '../buttons/',
			fighting: '../fight-buttons/'
		};
		this.currentEnemy = null;

		document.addEventListener('keydown', this.#handleKeyDown.bind(this));
		document.addEventListener('keyup', this.#handleKeyUp.bind(this));
		this.render();
		this.generateButtons();
	}
	getContext(id, color = '#111', isTransparent = false) {
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		canvas.id = id;
		canvas.classList.add(id);
		if (id === 'imageContext') {
			canvas.classList.add('pixel-perfect');
		}
		if (id=== 'enemyImageContext'){
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
		} else if (id === 'enemyImageContext') {
			containerId = 'canvasContainer'; // lub inny dedykowany kontener dla enemyImageContext
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
		const wallImageName = this.#getWallImageName();
		const wallImage = await this.loadImage(`../images/${wallImageName}`);

		const w = (this.cellSize + this.padding) * this.matrix[0].length - this.padding;
		const h = (this.cellSize + this.padding) * this.matrix.length - this.padding;

		this.enemyImageContext.canvas.width = w;
		this.enemyImageContext.canvas.height = h;
		this.imageContext.canvas.width = w;
		this.imageContext.canvas.height = h;
		this.outlineContext.canvas.width = w;
		this.outlineContext.canvas.height = h;
		this.buttonContext.canvas.width = w;
		this.buttonContext.canvas.height = h;
		this.imageContext.drawImage(wallImage, 0, 0, w, h);

		for (let row = 0; row < this.matrix.length; row++) {
			for (let col = 0; col < this.matrix[row].length; col++) {
				const isVisible = this.#isCellVisible(col, row);
				if (isVisible) {
					this.discoveredMatrix[row][col] = true;
				}
			}
		}
		this.enemyManager.renderEnemies(this.player, this.enemyImageContext, w, h);

		const idleImgSrc = this.player.idleAnimation[this.player.currentIdleFrame];
		this.loadImage(idleImgSrc)
			.then(img => {
				this.imageContext.drawImage(img, 0, 0, w, h);
				this.player.currentIdleFrame = (this.player.currentIdleFrame + 1) % this.player.idleAnimation.length;
			})
			.catch(error => {
				console.error('Błąd podczas ładowania idle gracza:', error);
			});

		if (this.showMaze) {
			for (let row = 0; row < this.matrix.length; row++) {
				for (let col = 0; col < this.matrix[row].length; col++) {
					// Renderuj tylko odkryte komórki
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

					this.outlineContext.fillStyle = color;
					this.outlineContext.fillRect(x, y, this.cellSize, this.cellSize);

					if (cellVal === 2) {
						this.drawPlayerDirection(x, y, this.player.direction);
					}
				}
			}
		} else {
			this.outlineContext.clearRect(0, 0, this.outlineContext.canvas.width, this.outlineContext.canvas.height);
		}
	}

	

	startBattle(enemy) {
		this.switchToFightState();
		this.currentEnemy = enemy;
		console.log(this.currentEnemy);
	}
	playerAttack() {
		console.log('player attack');
		if (this.currentEnemy) {
			this.currentEnemy.hp -= 1;
			console.log(`Attacking enemy ${this.currentEnemy.name}. Remaining HP: ${this.currentEnemy.hp}`);
	
			// Podmień obrazek na wersję "damaged"
			this.enemyManager.renderEnemyDamage(this.currentEnemy, this.enemyImageContext, window.innerWidth, window.innerHeight);
	
			if (this.currentEnemy.hp <= 0) {
				console.log(`Enemy ${this.currentEnemy.name} defeated!`);
				this.enemyManager.removeEnemy(this.currentEnemy);
				this.endBattle();
			}
		}
	}
	
	endBattle() {
		this.enemyManager.renderEnemyDeath(this.currentEnemy, this.enemyImageContext, window.innerWidth, window.innerHeight);
		this.switchToExploringState();
	}
	checkForEnemyAt(x, y) {
		return this.enemyManager.getEnemyAt(x, y);
	}

	async generateButtons() {
		const buttonContainer = document.getElementById('buttonContainer');
		const buttonsContainer = document.createElement('div');
		buttonsContainer.id = 'buttonsContainer';
		buttonContainer.appendChild(buttonsContainer);
		// Załaduj wszystkie obrazki przed generowaniem przycisków
		const imagePromises = [];
		for (let i = 1; i <= 9; i++) {
			imagePromises.push(this.loadImage(`${this.buttonImages[this.state]}${i}.png`));
			imagePromises.push(this.loadImage(`${this.buttonImages[this.state]}${i}-pressed.png`));
		}
		// Czekaj na załadowanie wszystkich obrazków
		await Promise.all(imagePromises);

		for (let i = 1; i <= 9; i++) {
			const btn = document.createElement('button');
			btn.classList.add('game-button');
			btn.style.backgroundImage = `url(${this.buttonImages[this.state]}${i}.png)`;
			btn.dataset.id = i; // Przypisz ID przycisku jako data-atrybut	
			// Obsługa myszy
			btn.addEventListener('mousedown', () => this.handleButtonDown(i, btn));
			btn.addEventListener('mouseup', () => this.handleButtonUp(i, btn));
			btn.addEventListener('mouseleave', () => this.handleButtonUp(i, btn));
			// Obsługa dotyku
			btn.addEventListener('touchstart', (event) => {
				event.preventDefault(); // zapobiega dodatkowym zdarzeniom myszy na niektórych urządzeniach
				this.handleButtonDown(i, btn);
			});
			btn.addEventListener('touchend', (event) => {
				event.preventDefault(); // zapobiega dodatkowym zdarzeniom myszy na niektórych urządzeniach
				this.handleButtonUp(i, btn);
			});
			if (i === 5) {
				btn.addEventListener('mousedown', this.handleMapButtonDown.bind(this));
				btn.addEventListener('mouseup', this.handleMapButtonUp.bind(this));
			} else {
				btn.addEventListener('click', this.buttonClicked.bind(this, i));
			}
			buttonsContainer.appendChild(btn);
		}
	}
	refreshButtons() {
		console.log('Aktualny stan:', this.state); // dodaj tę linię

		const buttonsContainer = document.getElementById('buttonsContainer');
		if (!buttonsContainer) return;
	
		const buttons = buttonsContainer.getElementsByClassName('game-button');
		for (let btn of buttons) {
			const buttonId = btn.dataset.id;
			btn.style.backgroundImage = `url(${this.buttonImages[this.state]}${buttonId}.png)`;
		}
	}
	switchToFightState() {
		this.state = this.states.fighting;
		this.refreshButtons();
	}
	switchToExploringState() {
		this.state = this.states.exploring;
		this.refreshButtons();
	}
	buttonClicked(buttonId) {
		const outlineCanvas = document.getElementById('outlineContext');
		if (this.state === this.states.exploring) {
			switch (buttonId) {
				case 2:
					this.movePlayer({ keyCode: 38 }); // Strzałka do góry
					break;
				case 4:
					this.movePlayer({ keyCode: 37 }); // Strzałka w lewo
					break;
				case 6:
					this.movePlayer({ keyCode: 39 }); // Strzałka w prawo
					break;
				case 5:
					if (!this.showMaze) {
						this.showMaze = true;
						outlineCanvas.style.display = 'block';
						this.render();
					} else {
						this.showMaze = false;
						outlineCanvas.style.display = 'none';
						this.render();
					}
					break;
			}
		} else if (this.state === this.states.fighting) {
			if (buttonId === 3) {
				this.playerAttack();
			}
		}
	}
	handleButtonDown(buttonId, btn) {
		const pressedImageUrl = `${this.buttonImages[this.state]}${buttonId}-pressed.png`;
		btn.style.backgroundImage = `url(${pressedImageUrl})`;
	}
	handleButtonUp(buttonId, btn) {
		const defaultImageUrl = `${this.buttonImages[this.state]}${buttonId}.png`;
		btn.style.backgroundImage = `url(${defaultImageUrl})`;
	}
	moveForward() {
		const imageContext = document.getElementById('imageContext');
		imageContext.style.transform = 'scale(0.3)';
		imageContext.style.transform = 'translateY(-0.3%)';
		imageContext.style.maskImage = 'radial-gradient(circle, white 90%, transparent 95%)';
		setTimeout(() => {
			imageContext.style.transform = 'scale(1)';
			imageContext.style.maskImage = 'none';
		}, 150);
	}
	turnLeft() {
		const imageContext = document.getElementById('imageContext');
		imageContext.style.transform = 'translateX(-0.5%)'; // Przesuń w lewo o 5%

		setTimeout(() => {
			imageContext.style.transform = 'translateX(0%)';
		}, 150);
	}
	turnRight() {
		const imageContext = document.getElementById('imageContext');
		imageContext.style.transform = 'translateX(0.5%)'; // Przesuń w prawo o 5%

		setTimeout(() => {
			imageContext.style.transform = 'translateX(0%)';
		}, 150);
	}
	#isValidMove(x, y) {
		if (this.matrix[this.player.y + y][this.player.x + x] === 0) {
			return true;
		}

		this.#shakeScreen();
		return false;
	}
	#shakeScreen() {
		const imageContext = document.getElementById('imageContext');
		imageContext.classList.add('shake');
		setTimeout(() => {
			imageContext.classList.remove('shake');
		}, 200);
	}
	#updateMatrix(y, x, val) {
		this.matrix[y][x] = val;
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

		if (keyCode === 37) {
			// Strzałka w lewo
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
			this.turnRight();
			this.player.isMoving = true;
		} else if (keyCode === 39) {
			// Strzałka w prawo
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
			this.turnLeft();
			this.player.isMoving = true;
		} else if (keyCode === 38) {
			// Strzałka do góry
			if (keyCode === 38) {
				// Strzałka do góry
				if (this.#isValidMove(dx, dy)) {
					this.#updateMatrix(this.player.y, this.player.x, 0);
					this.#updateMatrix(this.player.y + dy, this.player.x + dx, 2);
					this.player.y += dy;
					this.player.x += dx;
					this.player.isMoving = true;
					this.moveForward();
					
					// Sprawdzenie, czy na nowej pozycji gracza jest wróg:
					const enemy = this.enemyManager.getEnemyAt(this.player.x, this.player.y);
					if (enemy) {
						this.startBattle(enemy);
					}
				}
			}
		}

		if (this.player.isMoving) {
			this.render();
			console.log(this.player.direction);
		}
	};
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

		const directions = {
			N: { dx: 0, dy: -1, left: 'W', right: 'E' },
			E: { dx: 1, dy: 0, left: 'N', right: 'S' },
			S: { dx: 0, dy: 1, left: 'E', right: 'W' },
			W: { dx: -1, dy: 0, left: 'S', right: 'N' },
		};

		const { dx, dy, left, right } = directions[direction];
		const frontCell = this.matrix[y + dy] && this.matrix[y + dy][x + dx];
		const leftCell =
			this.matrix[y + directions[left].dy] && this.matrix[y + directions[left].dy][x + directions[left].dx];
		const rightCell =
			this.matrix[y + directions[right].dy] && this.matrix[y + directions[right].dy][x + directions[right].dx];

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
	#handleKeyDown = ({ keyCode }) => {
		const outlineCanvas = document.getElementById('outlineContext');

		if (keyCode === 32) {
			// Spacja
			this.showMaze = true;
			outlineCanvas.style.display = 'block'; // Pokaż canvas
			this.render();
		} else {
			this.movePlayer({ keyCode });
		}
	};
	#handleKeyUp = ({ keyCode }) => {
		const outlineCanvas = document.getElementById('outlineContext');

		if (keyCode === 32) {
			// Spacja
			this.showMaze = false;
			outlineCanvas.style.display = 'none';
			this.render();
		}
	};
	handleMapButtonDown() {
		const outlineCanvas = document.getElementById('outlineContext');
		this.showMaze = true;
		outlineCanvas.style.display = 'block'; // Pokaż canvas
		this.render();
	}
	handleMapButtonUp() {
		const outlineCanvas = document.getElementById('outlineContext');
		this.showMaze = false;
		outlineCanvas.style.display = 'none'; // Ukryj canvas
		this.render();
	}
	drawPlayerDirection(x, y) {
		this.outlineContext.fillStyle = '#c6b7be';
		this.outlineContext.fillRect(x, y, this.cellSize, this.cellSize);
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
