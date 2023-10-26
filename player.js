export class Player {
	constructor(x, y, loadImage) {
		this.x = x;
		this.y = y;
		this.hp = 10;
		this.damage = 1;
		this.color = 'orange';
		this.direction = 'N';
		this.isMoving = false;
		this.idleImg = ['../player/sword_shield_01.png', '../player/sword_shield_02.png'];
		this.attackImg = ['../player/sword_animation_01.png'];
		this.defenseImg = ['../player/shield_animation_01.png'];
		this.damageImg = ['../player/damage_animation_01.png'];
		this.currentWalkFrame = 0;
		this.currentIdleFrame = 0;
		this.currentAttackFrame = 0;
		this.state = 'idle';
		this.loadImage = loadImage;
	}
	renderPlayer(player, context, w, h) {
		context.clearRect(0, 0, w, h);
		this.loadImage(player.idleImg[player.currentIdleFrame]).then(img => {
			context.drawImage(img, 0, 0, w, h);
			player.currentIdleFrame = (player.currentIdleFrame + 1) % player.idleImg.length;
		});
	}
	renderPlayerAttack(player, context, w, h) {
		context.clearRect(0, 0, w, h);
		this.loadImage(player.attackImg).then(img => {
			context.drawImage(img, 0, 0, w, h);
			setTimeout(() => {
				this.loadImage(player.idleImg[player.currentIdleFrame]).then(baseImg => {
					context.clearRect(0, 0, w, h);
					context.drawImage(baseImg, 0, 0, w, h);
				});
			}, 500);
		});
	}
	renderPlayerDefense(player, context, w, h) {
		context.clearRect(0, 0, w, h);
		this.loadImage(player.defenseImg).then(img => {
			context.drawImage(img, 0, 0, w, h);
			setTimeout(() => {
				this.loadImage(player.idleImg[player.currentAttackFrame]).then(baseImg => {
					context.clearRect(0, 0, w, h);
					context.drawImage(baseImg, 0, 0, w, h);
				});
			}, 500);
		});
	}
	renderPlayerDamage(player, context, w, h) {
		context.clearRect(0, 0, w, h);
		// Oczekiwanie 200ms przed wczytaniem i wyrenderowaniem obrazu damageImg
		setTimeout(() => {
			this.loadImage(player.damageImg).then(img => {
				context.clearRect(0, 0, w, h);
				context.drawImage(img, 0, 0, w, h);
	
				// Oczekiwanie kolejne 200ms przed wczytaniem i wyrenderowaniem obrazu idle
				setTimeout(() => {
					this.loadImage(player.idleImg[player.currentAttackFrame]).then(baseImg => {
						context.clearRect(0, 0, w, h);
						context.drawImage(baseImg, 0, 0, w, h);
					});
				}, 200);
			});
		}, 200);
	}
	
}
