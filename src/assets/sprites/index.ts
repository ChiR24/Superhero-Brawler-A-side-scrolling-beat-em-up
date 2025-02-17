// Temporary placeholder sprites using colored rectangles
// These will be replaced with actual sprite assets later
const createColoredRect = (color: string) => ({
  uri: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAAJ0lEQVR4nO3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAIC3AcUAAAF5tYZ0AAAAAElFTkSuQmCC`,
  color
});

export const sprites = {
  hero: {
    name: 'hero',
    animations: {
      idle: {
        name: 'idle',
        frames: [
          { source: createColoredRect('#0066cc'), duration: 0.5 },
          { source: createColoredRect('#0055bb'), duration: 0.5 }
        ],
        loop: true
      },
      walk: {
        name: 'walk',
        frames: [
          { source: createColoredRect('#0066cc'), duration: 0.15 },
          { source: createColoredRect('#0055bb'), duration: 0.15 },
          { source: createColoredRect('#0044aa'), duration: 0.15 },
          { source: createColoredRect('#0055bb'), duration: 0.15 }
        ],
        loop: true
      },
      jump: {
        name: 'jump',
        frames: [
          { source: createColoredRect('#0077dd'), duration: 0.3 },
          { source: createColoredRect('#0066cc'), duration: 0.3 }
        ],
        loop: false
      },
      attack: {
        name: 'attack',
        frames: [
          { source: createColoredRect('#0088ee'), duration: 0.1 },
          { source: createColoredRect('#0099ff'), duration: 0.1 },
          { source: createColoredRect('#0088ee'), duration: 0.1 }
        ],
        loop: false
      },
      dash: {
        name: 'dash',
        frames: [
          { source: createColoredRect('#00aaff'), duration: 0.1 },
          { source: createColoredRect('#00bbff'), duration: 0.1 }
        ],
        loop: true
      }
    }
  },
  enemy: {
    minion: {
      name: 'minion',
      animations: {
        idle: {
          name: 'idle',
          frames: [
            { source: createColoredRect('#cc0000'), duration: 0.5 },
            { source: createColoredRect('#bb0000'), duration: 0.5 }
          ],
          loop: true
        },
        walk: {
          name: 'walk',
          frames: [
            { source: createColoredRect('#cc0000'), duration: 0.2 },
            { source: createColoredRect('#bb0000'), duration: 0.2 },
            { source: createColoredRect('#aa0000'), duration: 0.2 }
          ],
          loop: true
        },
        attack: {
          name: 'attack',
          frames: [
            { source: createColoredRect('#ff0000'), duration: 0.1 },
            { source: createColoredRect('#ee0000'), duration: 0.1 },
            { source: createColoredRect('#ff0000'), duration: 0.1 }
          ],
          loop: false
        }
      }
    },
    ranged: {
      name: 'ranged',
      animations: {
        idle: {
          name: 'idle',
          frames: [
            { source: createColoredRect('#cc6600'), duration: 0.5 },
            { source: createColoredRect('#bb5500'), duration: 0.5 }
          ],
          loop: true
        },
        walk: {
          name: 'walk',
          frames: [
            { source: createColoredRect('#cc6600'), duration: 0.2 },
            { source: createColoredRect('#bb5500'), duration: 0.2 },
            { source: createColoredRect('#aa4400'), duration: 0.2 }
          ],
          loop: true
        },
        attack: {
          name: 'attack',
          frames: [
            { source: createColoredRect('#ff7700'), duration: 0.15 },
            { source: createColoredRect('#ff8800'), duration: 0.15 },
            { source: createColoredRect('#ff7700'), duration: 0.15 }
          ],
          loop: false
        }
      }
    },
    elite: {
      name: 'elite',
      animations: {
        idle: {
          name: 'idle',
          frames: [
            { source: createColoredRect('#660066'), duration: 0.5 },
            { source: createColoredRect('#550055'), duration: 0.5 }
          ],
          loop: true
        },
        walk: {
          name: 'walk',
          frames: [
            { source: createColoredRect('#660066'), duration: 0.2 },
            { source: createColoredRect('#550055'), duration: 0.2 },
            { source: createColoredRect('#440044'), duration: 0.2 }
          ],
          loop: true
        },
        attack: {
          name: 'attack',
          frames: [
            { source: createColoredRect('#880088'), duration: 0.1 },
            { source: createColoredRect('#990099'), duration: 0.1 },
            { source: createColoredRect('#880088'), duration: 0.1 }
          ],
          loop: false
        }
      }
    }
  }
}; 