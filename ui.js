export class uiRenderer {
	constructor(context) {
		this.context = context;
		this.images = {};
		this.imageCache = {};
		this.container = this.createContainer();
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

	// async loadGameImages() {
	// 	const imageSources = {
	// 		playerBorder: '../ui/player_border.png',
	// 		playerHP: '../ui/player_hp10.png',
	// 		playerDirectionN: '../ui/player_direction_N.png',
	// 		playerFloor1: '../ui/player_floor1.png',
	// 		playerHp10: '../ui/player_hp10.png',
	// 		playerPortrait10: '../ui/player_portret10.png',
	// 		//playerBackground: "../ui/player_background.png"
	// 	};

	// 	try {
	// 		await Promise.all(
	// 			Object.entries(imageSources).map(async ([key, src]) => {
	// 				this.images[key] = await this.loadImage(src);
	// 			})
	// 		);
	// 	} catch (error) {
	// 		console.error('Error loading image:', error);
	// 	}

	// 	this.createImageElements();
	// }

	createContainer() {
		const container = document.createElement('div');
		container.style.position = 'relative';
		this.context.canvas.parentElement.appendChild(container);
		return container;
	}

	createImageElements() {
		let zIndex = 0;

		for (let key in this.images) {
			const divElement = document.createElement('div');
			divElement.id = key; // Ustawienie ID dla diva
			divElement.className = 'playerUiElements'; // Nadanie klasy
			divElement.style.position = 'absolute';
			divElement.style.zIndex = zIndex.toString();
			divElement.style.backgroundImage = `url(${this.images[key].src})`; // Ustawienie obrazka jako tła
			divElement.style.backgroundSize = 'cover'; // Aby obrazek dobrze pasował do diva

			this.container.appendChild(divElement);
			zIndex++;
		}
	}

	render() {
		const w = this.context.canvas.width;
		const h = this.context.canvas.height;

		this.context.clearRect(0, 0, w, h);

		// Rysowanie różnych obrazków w zależności od sytuacji
		this.context.drawImage(this.images.playerBorder, 0, 0, w, h);
		this.context.drawImage(this.images.playerDirectionN, 0, 0, w, h);
		this.context.drawImage(this.images.playerDirectionN, 0, 0, w, h);
		this.context.drawImage(this.images.playerDirectionN, 0, 0, w, h);
		// ... dodaj kolejne obrazki według potrzeb
	}

	async updatePlayerDirection(direction) {
		const directions = {
			N: '../ui/player_direction_N.png',
			S: '../ui/player_direction_S.png',
			W: '../ui/player_direction_W.png',
			E: '../ui/player_direction_E.png',
		};

		if (directions[direction]) {
			// Aktualizacja obrazka kierunku gracza
			this.images.playerDirectionN = await this.loadImage(directions[direction]);
			this.render();
		} else {
			console.error('Nieprawidłowy kierunek:', direction);
		}
	}
}
