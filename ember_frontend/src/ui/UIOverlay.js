import React from 'react';

export function UIOverlay({ hud }) {
  if (!hud) return null;
  const flamePct = Math.max(0, Math.min(1, hud.flame / hud.maxFlame));
  const healthPct = Math.max(0, Math.min(1, hud.health / hud.maxHealth));
  return (
    <div className="ui-root">
      <div className="ui-panel ui-health">
        <div className="flex">
          <span className="badge">Biome: {hud.biome}</span>
          <span className="badge">Seeds: {hud.seeds}</span>
          <span className="badge">Rain: {hud.isRaining ? 'Yes' : 'No'}</span>
          <span className="badge">Wind: {hud.wind.toFixed(1)}</span>
        </div>
        <div style={{ marginTop: 6 }}>
          <div className="tooltip">Flame</div>
          <div className="healthbar"><div className="healthbar-fill" style={{ width: `${flamePct * 100}%` }} /></div>
        </div>
        <div style={{ marginTop: 6 }}>
          <div className="tooltip">Health</div>
          <div className="healthbar"><div className="healthbar-fill" style={{ width: `${healthPct * 100}%`, background: 'linear-gradient(90deg, #4a0010, #ff3355 60%, #fff3f6)' }} /></div>
        </div>
      </div>

      <div className="ui-panel ui-inventory">
        <div className="tooltip">Inventory</div>
        <div className="flex" style={{ marginTop: 6, flexWrap: 'wrap' }}>
          {Object.entries(hud.inventory).map(([k, v]) => (
            <span className="badge" key={k}>{k}: {v}</span>
          ))}
          {Object.entries(hud.upgrades).map(([k, v]) => v ? <span className="badge" key={k}>▲ {label(k)}</span> : null)}
        </div>
      </div>

      <div className="ui-panel ui-center">
        <span className="tooltip">Tip: J/F Burst • L Seed • Shift Dim • Space Jump • M Map • U Upgrades • Esc Pause</span>
      </div>

      <div className="ui-panel ui-prompts">
        <span className="tooltip">Rekindle braziers to restore light.</span>
      </div>
    </div>
  );
}

function label(k) {
  if (k === 'everbright_coal') return 'Everbright Coal';
  if (k === 'solar_mirror') return 'Solar Mirror';
  if (k === 'flame_cloak') return 'Flame Cloak';
  return k;
}
