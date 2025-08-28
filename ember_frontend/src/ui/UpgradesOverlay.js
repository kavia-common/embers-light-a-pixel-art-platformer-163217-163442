import React, { useState } from 'react';

const UPGRADE_INFO = {
  everbright_coal: { name: 'Everbright Coal', desc: 'Slows flame decay by 30%.' },
  solar_mirror: { name: 'Solar Mirror', desc: 'Reflects beams to kindle distant braziers.' },
  flame_cloak: { name: 'Flame Cloak', desc: 'Slightly faster and higher jumps.' },
};

export function UpgradesOverlay({ onClose, game }) {
  const [flags, setFlags] = useState(game?.upgrades?.flags || {});
  const toggle = (k) => {
    if (!game) return;
    game.upgrades.toggle(k);
    setFlags({ ...game.upgrades.flags });
  };
  return (
    <div className="upgrades-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Upgrades</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          {Object.entries(UPGRADE_INFO).map(([k, info]) => (
            <div key={k} className="ui-panel" style={{ padding: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{info.name}</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={!!flags[k]} onChange={() => toggle(k)} />
                  Enabled
                </label>
              </div>
              <div className="tooltip" style={{ marginTop: 6 }}>{info.desc}</div>
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
