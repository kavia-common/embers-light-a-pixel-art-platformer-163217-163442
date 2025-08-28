/**
 * Canvas API mock for jsdom test environment.
 * Provides HTMLCanvasElement.getContext('2d') returning a minimal mocked 2D context
 * sufficient for our rendering unit tests.
 */
if (typeof HTMLCanvasElement !== 'undefined') {
  const origGetContext = HTMLCanvasElement.prototype.getContext;
  // eslint-disable-next-line no-undef
  HTMLCanvasElement.prototype.getContext = function getContext(type, ...args) {
    if (type === '2d') {
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
      return {
        fillStyle: '#000',
        globalCompositeOperation: 'source-over',
        fillRect: () => {},
        clearRect: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        drawImage: () => {},
        createRadialGradient: gradient,
      };
    }
    return origGetContext ? origGetContext.call(this, type, ...args) : null;
  };
}
