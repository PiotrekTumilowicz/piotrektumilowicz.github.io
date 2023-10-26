export class Enemy {
	constructor(name, x, y, idleImg, prepareToAttackImg, attackImg, damageImg, deadImg, hp) {
		this.name = name;
		this.x = x;
		this.y = y;
		this.hp = hp;
		this.damage = 1;
		this.idleImg = idleImg;
        this.prepareToAttackImg = prepareToAttackImg;
        this.attackImg = attackImg;
		this.damageImg = damageImg;
		this.deadImg = deadImg;
		
	}
}
export class EnemyManager {
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
	renderEnemyIdle(enemy, context, w, h) {
		context.clearRect(0, 0, w, h);
		this.loadImage(enemy.idleImg).then(img => {
			context.drawImage(img, 0, 0, w, h);
		});
	}
	renderEnemyPrepareToAttack(enemy, context, w, h) {
		context.clearRect(0, 0, w, h);
		this.loadImage(enemy.prepareToAttackImg).then(img => {
			context.drawImage(img, 0, 0, w, h);
		});
	}
	renderEnemyAttack(enemy, context, w, h) {
		console.log('renderEnemyAttack');
		context.clearRect(0, 0, w, h);
		this.loadImage(enemy.attackImg).then(img => {
			context.drawImage(img, 0, 0, w, h);
			setTimeout(() => {
				this.loadImage(enemy.idleImg).then(baseImg => {
					context.clearRect(0, 0, w, h);
					context.drawImage(baseImg, 0, 0, w, h);
				});
			}, 200);
		});
	}
	renderEnemyDamage(enemy, context, w, h) {
		console.log('renderEnemyDamage');
		context.clearRect(0, 0, w, h);
		this.loadImage(enemy.damageImg).then(img => {
			context.drawImage(img, 0, 0, w, h);
			setTimeout(() => {
				this.loadImage(enemy.idleImg).then(baseImg => {
					context.clearRect(0, 0, w, h);
					context.drawImage(baseImg, 0, 0, w, h);
				});
			}, 500);
		});
	}
	renderEnemyDeath(enemy, context, w, h) {
		setTimeout(() => {
			context.clearRect(0, 0, w, h);
			this.loadImage(enemy.deadImg).then(img => {
				context.drawImage(img, 0, 0, w, h);
				setTimeout(() => {
					context.clearRect(0, 0, w, h);
				}, 500);
			});
		}, 600);
	}
	removeEnemy(enemy) {
		const index = this.enemies.indexOf(enemy);
		if (index !== -1) {
			this.enemies.splice(index, 1);
		}
	}
}
