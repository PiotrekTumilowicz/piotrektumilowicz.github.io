export class LabiryntObject {
	constructor(name, x, y, direction) {
		this.name = name;
		this.x = x;
		this.y = y;
		this.direction = direction;
	}
}
export class LabiryntObjectManager {
	constructor(loadImage) {
		this.loadImage = loadImage;
		this.labiryntObjects = [];
	}
	addLabiryntObject(labiryntObject) {
		this.labiryntObjects.push(labiryntObject);
	}
	getLabiryntObjectAt(x, y) {
		return this.labiryntObjects.find(labiryntObject => labiryntObject.x === x && labiryntObject.y === y);
	}
}