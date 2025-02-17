import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export class Renderer {
  private gameObjects: GameObject[];
  private camera: Camera;

  constructor() {
    this.gameObjects = [];
    this.camera = {
      x: 0,
      y: 0,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT
    };
  }

  addGameObject(gameObject: GameObject): void {
    this.gameObjects.push(gameObject);
  }

  removeGameObject(gameObject: GameObject): void {
    const index = this.gameObjects.indexOf(gameObject);
    if (index > -1) {
      this.gameObjects.splice(index, 1);
    }
  }

  updateCamera(x: number, y: number): void {
    this.camera.x = x;
    this.camera.y = y;
  }

  render(): void {
    // Sort game objects by z-index for proper layering
    this.gameObjects.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // Render only objects within camera view
    const visibleObjects = this.gameObjects.filter(obj => this.isVisible(obj));
    
    // Render each visible object
    visibleObjects.forEach(obj => {
      if (obj.render) {
        obj.render();
      }
    });
  }

  private isVisible(obj: GameObject): boolean {
    // Basic visibility check based on camera bounds
    return (
      obj.x + obj.width >= this.camera.x &&
      obj.x <= this.camera.x + this.camera.width &&
      obj.y + obj.height >= this.camera.y &&
      obj.y <= this.camera.y + this.camera.height
    );
  }
}

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
  render?: () => void;
}

interface Camera {
  x: number;
  y: number;
  width: number;
  height: number;
} 