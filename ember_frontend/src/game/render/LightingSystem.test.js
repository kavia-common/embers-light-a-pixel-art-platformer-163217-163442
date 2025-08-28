import { Renderer } from './Renderer';
import { LightingSystem } from './LightingSystem';

// Provide minimal jsdom-safe mocks for Canvas API used by LightingSystem.
function createMockCanvas() {
  const gradient = () => {
    const stops = [];
    return {
      stops,
      addColorStop: (offset, color) => {
        if (typeof color === 'string' && color.startsWith('rgbaa')) {
          throw new Error('Invalid color: rgbaa* not allowed');
        }
        stops.push([offset, color]);
      },
    };
  };

  const ctx = {
    fillStyle: '#000',
    globalCompositeOperation: 'source-over',
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    drawImage: jest.fn(),
    createRadialGradient: jest.fn().mockImplementation(gradient),
  };

  const canvas = {
    width: 320,
    height: 180,
    getContext: jest.fn().mockImplementation((type) => {
      if (type === '2d') return ctx;
      return null;
    }),
  };

  return { canvas, ctx };
}

// Stub AudioContext in jsdom test env to avoid unrelated errors if code references it.
beforeAll(() => {
  if (!window.AudioContext) {
    // eslint-disable-next-line no-undef
    window.AudioContext = function AudioContext() { this.createGain = () => ({ connect: () => {}, gain: { value: 0 } }); this.close = () => {}; };
  }
  if (!window.webkitAudioContext) {
    // eslint-disable-next-line no-undef
    window.webkitAudioContext = window.AudioContext;
  }
});

describe('LightingSystem color handling', () => {
  test('does not produce invalid rgbaa colors and renders without throwing', () => {
    const { canvas, ctx } = createMockCanvas();
    const renderer = new Renderer(canvas, { pixelScale: 2 });
    renderer.worldToScreen = (x, y) => [x, y]; // identity mapping for test

    const lighting = new LightingSystem(renderer);

    lighting.begin();
    lighting.addLight(100, 100, 50, 'rgba(255,180,80,0.9)');

    expect(() => lighting.render(0.6)).not.toThrow();
    expect(ctx.createRadialGradient).toHaveBeenCalled();
  });

  test('handles rgb() input by converting to rgba with alpha', () => {
    const { canvas } = createMockCanvas();
    const renderer = new Renderer(canvas, { pixelScale: 2 });
    renderer.worldToScreen = (x, y) => [x, y];

    const lighting = new LightingSystem(renderer);
    lighting.begin();
    lighting.addLight(50, 50, 30, 'rgb(255,200,120)');
    expect(() => lighting.render(0.6)).not.toThrow();
  });
});
