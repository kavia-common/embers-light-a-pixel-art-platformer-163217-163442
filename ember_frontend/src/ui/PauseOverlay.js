import React from 'react';

export function PauseOverlay({ onResume }) {
  return (
    <div className="pause-overlay">
      <div className="modal">
        <h2>Game Paused</h2>
        <p>Rain whispers over the ruins. Your flame waits.</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn primary" onClick={onResume}>Resume</button>
        </div>
        <div className="controls">
          <div className="control">Move: Arrow Keys / A D</div>
          <div className="control">Jump: Space / K</div>
          <div className="control">Flame Burst: J / F</div>
          <div className="control">Fire Seed: L</div>
          <div className="control">Dim (Stealth): Shift</div>
          <div className="control">World Map: M</div>
          <div className="control">Upgrades: U</div>
          <div className="control">Save/Load: F5 / F9</div>
        </div>
      </div>
    </div>
  );
}
