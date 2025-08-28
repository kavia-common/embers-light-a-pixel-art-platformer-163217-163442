//
// OverlayUI.js - in-game overlay HUD and simple menus
//
import React from 'react';

// PUBLIC_INTERFACE
export function FlameBar({ flame, maxFlame, colorPrimary = '#ff9900', colorAccent = '#ffeea9' }) {
  /** Flame/life HUD bar with pixel style. */
  const pct = Math.max(0, Math.min(1, flame / maxFlame));
  const width = 180;
  const height = 10;
  const inner = Math.round(pct * (width - 2));
  return (
    <div style={{ position: 'absolute', top: 10, left: 10, color: '#fff', fontFamily: 'monospace' }}>
      <div style={{ fontSize: 12, marginBottom: 4 }}>Flame</div>
      <div style={{ width, height, border: '2px solid var(--border-color)', background: 'var(--border-color)' }}>
        <div style={{
          width: inner,
          height: height - 2,
          background: `linear-gradient(90deg, ${colorPrimary}, ${colorAccent})`
        }} />
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function HealthBar({ health, maxHealth }) {
  /** Health bar HUD. */
  const pct = Math.max(0, Math.min(1, health / maxHealth));
  const width = 180, height = 10, inner = Math.round(pct * (width - 2));
  return (
    <div style={{ position: 'absolute', top: 40, left: 10 }}>
      <div style={{ fontSize: 12, marginBottom: 4, color: '#fff', fontFamily: 'monospace' }}>Health</div>
      <div style={{ width, height, border: '2px solid var(--border-color)', background: 'var(--border-color)' }}>
        <div style={{ width: inner, height: height - 2, background: '#8af26a' }} />
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function InventoryPanel({ inventory }) {
  /** Simple inventory strip HUD. */
  return (
    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 8 }}>
      {['Everbright Coal', 'Solar Mirror', 'Flame Cloak'].map((name) => {
        const has = !!inventory[name];
        return (
          <div key={name}
            title={name}
            style={{
              width: 24, height: 24, border: '2px solid var(--border-color)',
              background: has ? '#ff9900' : '#3a3a45', color: '#fff',
              fontFamily: 'monospace', fontSize: 10, display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
            {name.split(' ').map(w => w[0]).join('')}
          </div>
        );
      })}
    </div>
  );
}

// PUBLIC_INTERFACE
export function MiniMap({ world, camera, scale = 2 }) {
  /** Very small world mini-map representation. */
  const w = 120, h = 60;
  const ratioX = w / (world.tiles.width);
  const ratioY = h / (world.tiles.height);
  const cx = Math.floor(camera.x / 16) * ratioX;
  const cy = Math.floor(camera.y / 16) * ratioY;
  const cw = (camera.w / 16) * ratioX;
  const ch = (camera.h / 16) * ratioY;

  return (
    <div style={{ position: 'absolute', bottom: 10, right: 10, padding: 6, background: 'rgba(29,34,48,0.85)', border: '2px solid var(--border-color)' }}>
      <div style={{ position: 'relative', width: w, height: h, background: 'var(--bg-primary)' }}>
        <div style={{
          position: 'absolute',
          left: cx, top: cy, width: cw, height: ch, border: '1px solid #ffeea9'
        }} />
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function PauseMenu({ show, onResume, onSettings, onQuit }) {
  /** Pause modal.
   * Buttons:
   * - Resume: closes pause
   * - Settings: opens in-game settings modal
   * - Quit to Title: triggers onQuit (App handles returning to Main Menu)
   */
  if (!show) return null;
  return (
    <div style={modalStyle}>
      <div style={panelStyle}>
        <h3 style={headingStyle}>Paused</h3>
        <button style={btnStyle} onClick={onResume}>Resume</button>
        <button style={btnStyle} onClick={onSettings}>Settings</button>
        <button style={btnStyle} onClick={onQuit}>Quit to Title</button>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function MapMenu({ show, world, onClose }) {
  /** World map modal. */
  if (!show) return null;
  return (
    <div style={modalStyle}>
      <div style={panelStyle}>
        <h3 style={headingStyle}>World Map</h3>
        <div style={{ color: '#fff', marginBottom: 10, fontFamily: 'monospace' }}>
          Current: {world.currentBiome}
        </div>
        <ul style={{ color: '#fff', textAlign: 'left' }}>
          {world.unlockedNodes.map(n => <li key={n}>{n}</li>)}
        </ul>
        <button style={btnStyle} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function UpgradeMenu({ show, upgrades, onToggle, onClose }) {
  /** Upgrades selection modal. */
  if (!show) return null;
  return (
    <div style={modalStyle}>
      <div style={panelStyle}>
        <h3 style={headingStyle}>Upgrades</h3>
        {Object.keys(upgrades).map(k => (
          <label key={k} style={{ color: '#fff', display: 'block', marginBottom: 6 }}>
            <input type="checkbox" checked={!!upgrades[k]} onChange={() => onToggle(k)} /> {labelFor(k)}
          </label>
        ))}
        <button style={btnStyle} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function SettingsMenu({ show, settings, onChange, onClose }) {
  /** Settings modal for audio and visuals. */
  if (!show) return null;
  return (
    <div style={modalStyle}>
      <div style={panelStyle}>
        <h3 style={headingStyle}>Settings</h3>
        <div style={{ color: '#fff', marginBottom: 10 }}>
          <label>
            <input type="checkbox" checked={settings.audio} onChange={(e) => onChange({ audio: e.target.checked })} /> Audio Enabled
          </label>
        </div>
        <div style={{ color: '#fff', marginBottom: 10 }}>
          <label>
            Darkness Intensity
            <input type="range" min="0" max="1" step="0.05" value={settings.darkness}
              onChange={(e) => onChange({ darkness: parseFloat(e.target.value) })} />
          </label>
        </div>
        <button style={btnStyle} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

const modalStyle = {
  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex',
  alignItems: 'center', justifyContent: 'center'
};
const panelStyle = {
  background: 'var(--bg-secondary)', border: '2px solid var(--border-color)', padding: 16, width: 320, textAlign: 'center',
  boxShadow: '0 6px 24px rgba(255,153,0,0.12)'
};
const btnStyle = {
  background: '#ff9900', border: 'none', padding: '8px 12px', color: '#2e2d32', margin: 6, cursor: 'pointer',
  boxShadow: '0 3px 10px rgba(255,153,0,0.25)'
};
const headingStyle = { color: '#ffeea9', marginTop: 0 };

function labelFor(k) {
  switch (k) {
    case 'everbrightCoal': return 'Everbright Coal (slower flame decay)';
    case 'solarMirror': return 'Solar Mirror (light puzzles boost)';
    case 'flameCloak': return 'Flame Cloak (reduced rain damage)';
    default: return k;
  }
}
