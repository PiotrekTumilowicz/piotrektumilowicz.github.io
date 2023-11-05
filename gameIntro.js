export class GameIntro {
    constructor(context, texts, images) {
      this.context = context;
      this.texts = texts;
      this.images = images;
      this.currentTextIndex = 0;
      this.currentCharIndex = 0;
      this.isRunning = true; // Flaga kontrolująca działanie pętli
      this.context.font = '24px Arial';
      this.context.fillStyle = 'white';
    }
  
    loadImage(path) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = path;
      });
    }
  
    renderText(text, x, y, interval = 100) {
      if (this.currentCharIndex > text.length) {
        this.currentCharIndex = 0;
        return true;
      }
      const displayText = text.substring(0, this.currentCharIndex++);
      this.context.clearRect(x, y - 30, this.context.canvas.width, 50);
      this.context.fillText(displayText, x, y);
      setTimeout(() => {
        if (this.isRunning) { // Kontynuuj tylko jeśli pętla ma być aktywna
          this.renderText(text, x, y, interval);
        }
      }, interval);
      return false;
    }
  
    start() {
      if (this.currentTextIndex < this.texts.length) {
        this.loadImage(this.images[this.currentTextIndex])
          .then(image => {
            this.context.drawImage(image, 0, 0, this.context.canvas.width, this.context.canvas.height);
            if (this.renderText(this.texts[this.currentTextIndex], 50, 300)) {
              this.currentTextIndex++;
              setTimeout(() => {
                if (this.isRunning) { // Kontynuuj tylko jeśli pętla ma być aktywna
                  this.start();
                }
              }, 5000); // Czekaj 5 sekund przed wyświetleniem następnego obrazka i tekstu
            }
          })
          .catch(error => {
            console.error('Error loading image:', error);
          });
      } else {
        this.currentTextIndex = 0; // Zacznij od początku, jeśli doszedłeś do końca
        this.start(); // Restart intro
      }
    }
  
    stop() {
      this.isRunning = false;
    }
  }