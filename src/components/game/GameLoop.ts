export class GameLoop {
  private fps: number;
  private frameTime: number;
  private lastTime: number;
  private callback: ((deltaTime: number) => void) | null;
  private animationFrameId: number | null;
  private isRunning: boolean;

  constructor(fps: number = 60) {
    this.fps = fps;
    this.frameTime = 1000 / fps;
    this.lastTime = 0;
    this.callback = null;
    this.animationFrameId = null;
    this.isRunning = false;
  }

  start(callback: (deltaTime: number) => void): void {
    if (this.isRunning) return;
    
    this.callback = callback;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isRunning = false;
    this.callback = null;
  }

  private loop(): void {
    this.animationFrameId = requestAnimationFrame((currentTime: number) => {
      if (!this.isRunning) return;

      const deltaTime = currentTime - this.lastTime;

      if (deltaTime >= this.frameTime) {
        this.lastTime = currentTime;
        if (this.callback) {
          this.callback(deltaTime / 1000); // Convert to seconds
        }
      }

      this.loop();
    });
  }
} 