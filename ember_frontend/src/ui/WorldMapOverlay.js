import React from 'react';

export function WorldMapOverlay({ onClose, game }) {
  const biomes = [
    { id: 'ruins', name: 'Flooded Ruins', discovered: true },
    { id: 'forest', name: 'Drowned Forest', discovered: false },
    { id: 'peaks', name: 'Frosted Peaks', discovered: false },
  ];
  return (
    <div className="world-map-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>World Map</h2>
        <p>Choose a destination. Rekindle ancient braziers to push back the dark.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {biomes.map(b => (
            <div key={b.id} className="ui-panel" style={{ padding: 10, opacity: b.discovered ? 1 : 0.6 }}>
              <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{b.name}</div>
              <div className="tooltip">{b.discovered ? 'Explorable' : 'Unknown'}</div>
              <button className="btn" disabled={!b.discovered} style={{ marginTop: 8 }}
                onClick={() => {
                  if (!b.discovered) return;
                  if (game) {
                    // In a fuller game, switch world layout/tiles/biome
                    game.world.biome = b.name;
                  }
                  onClose && onClose();
                }}
              >Travel</button>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
