//
// OverlayUI.js - in-game overlay HUD and simple menus (Hollow Knight-inspired, minimal & atmospheric)
//
import React, { useMemo } from 'react';

const uiShadow = '0 0 24px rgba(255,153,0,0.08), 0 0 8px rgba(255,153,0,0.06)';

// Shared capsule style used for bars and chips
const capsule = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(20,22,30,0.65)',
  boxShadow: uiShadow,
  backdropFilter: 'blur(1px)',
};

// PUBLIC_INTERFACE
export function FlameBar({ flame, maxFlame }) {
  /** Minimal flame bar: faint outline, ember gradient, glow ping at changes. */
  const pct = Math.max(0, Math.min(1, flame / maxFlame));
  const width = 180;
  const height = 8;
  const inner = Math.round(pct * (width - 2));

  // soft pulse when low
  const low = pct < 0.25;
  return (
    <div aria-label="Flame" style={{ position: 'absolute', top: 10, left: 10, color: '#fff' }}>
      <div style={{
        ...capsule,
        width, height,
        borderRadius: 6,
        transition: 'box-shadow 200ms ease, background 200ms ease',
        outline: '1px solid rgba(255,255,255,0.03)'
      }}>
        <div style={{
          width: inner,
          height: height - 2,
          margin: '1px',
          borderRadius: 4,
          background: 'linear-gradient(90deg, #c06b20, #ffb84d)',
          boxShadow: '0 0 6px rgba(255,200,140,0.25)',
          transition: 'width 180ms ease-out'
        }} />
      </div>
      <div style={{
        fontSize: 10,
        marginTop: 4,
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 1,
        textShadow: '0 0 4px rgba(255,153,0,0.15)',
        opacity: low ? 0.9 : 0.6,
        transition: 'opacity 200ms ease'
      }}>
        Flame
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function HealthBar({ health, maxHealth, recentDamageTime = 0 }) {
  /** Minimal health bar with muted jade tone and damage shimmer. */
  const pct = Math.max(0, Math.min(1, health / maxHealth));
  const width = 180, height = 8, inner = Math.round(pct * (width - 2));

  const damageAlpha = useMemo(() => {
    if (recentDamageTime <= 0) return 0;
    const t = Math.max(0, Math.min(1, recentDamageTime / 0.3));
    return 0.35 * t;
  }, [recentDamageTime]);

  return (
    <div aria-label="Health" style={{ position: 'absolute', top: 32, left: 10 }}>
      <div style={{
        ...capsule,
        position: 'relative',
        width, height,
        borderRadius: 6,
        outline: '1px solid rgba(255,255,255,0.03)'
      }}>
        {damageAlpha > 0 && (
          <div style={{
            position: 'absolute', left: 1, top: 1,
            width: inner, height: height - 2,
            borderRadius: 4,
            background: `rgba(220, 66, 66, ${damageAlpha})`,
            transition: 'width 120ms ease-out'
          }} />
        )}
        <div style={{
          position: 'relative',
          width: inner, height: height - 2, margin: '1px',
          borderRadius: 4,
          background: 'linear-gradient(90deg, #3c6b4a, #7fd68f)',
          boxShadow: '0 0 6px rgba(127,214,143,0.18)',
          transition: 'width 180ms ease-out'
        }} />
      </div>
      <div style={{
        fontSize: 10,
        marginTop: 4,
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 1
      }}>
        Health
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function InventoryPanel({ inventory }) {
  /** Minimal upgrade chips with faint outlines and subtle glow when active. */
  const items = [
    { key: 'Everbright Coal', abbr: 'EC' },
    { key: 'Solar Mirror', abbr: 'SM' },
    { key: 'Flame Cloak', abbr: 'FC' }
  ];
  return (
    <div aria-label="Upgrades" style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
      {items.map(({ key, abbr }) => {
        const has = !!inventory[key];
        return (
          <div key={key} title={key} style={{
            ...capsule,
            width: 26, height: 16, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: has ? '#ffeea9' : 'rgba(255,255,255,0.35)',
            fontSize: 10, letterSpacing: 0.5,
            boxShadow: has ? '0 0 10px rgba(255,200,140,0.25) inset, ' + uiShadow : uiShadow,
            transition: 'color 150ms ease, box-shadow 150ms ease, background 150ms ease',
            background: has ? 'rgba(40,36,28,0.6)' : 'rgba(20,22,30,0.55)'
          }}>
            {abbr}
          </div>
        );
      })}
    </div>
  );
}

// PUBLIC_INTERFACE
export function SkillIndicatorBar({ player }) {
  /** Minimal skill glyph strip with unlock glow and low-clutter labels. */
  const items = [
    { key: 'dash', label: '⇢' },
    { key: 'wallJump', label: '⟂' },
    { key: 'doubleJump', label: '≋' },
    { key: 'melee', label: '✦' }
  ];
  return (
    <div aria-label="Skills" style={{ position: 'absolute', top: 52, left: 10, display: 'flex', gap: 6 }}>
      {items.map(it => {
        const unlocked = !!player.abilities?.[it.key];
        return (
          <div key={it.key}
               title={`${it.key} ${unlocked ? 'Unlocked' : 'Locked'}`}
               style={{
                 ...capsule,
                 width: 20, height: 14, borderRadius: 7,
                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                 color: unlocked ? '#ffeea9' : 'rgba(255,255,255,0.35)',
                 fontSize: 10,
                 boxShadow: unlocked ? '0 0 8px rgba(255,190,120,0.22) inset, ' + uiShadow : uiShadow,
                 transition: 'color 160ms ease, box-shadow 160ms ease'
               }}>
            {it.label}
          </div>
        );
      })}
    </div>
  );
}

// PUBLIC_INTERFACE
export function MiniMap({ world, camera }) {
  /** Tiny unobtrusive minimap with faint viewport outline. */
  const w = 110, h = 56;
  const ratioX = w / (world.tiles.width);
  const ratioY = h / (world.tiles.height);
  const cx = Math.floor(camera.x / 16) * ratioX;
  const cy = Math.floor(camera.y / 16) * ratioY;
  const cw = (camera.w / 16) * ratioX;
  const ch = (camera.h / 16) * ratioY;

  return (
    <div aria-label="MiniMap" style={{
      position: 'absolute', bottom: 10, right: 10,
      padding: 6, borderRadius: 8, ...capsule
    }}>
      <div style={{
        position: 'relative', width: w, height: h,
        background: 'rgba(10,12,18,0.6)',
        borderRadius: 6,
        outline: '1px solid rgba(255,255,255,0.04)'
      }}>
        <div style={{
          position: 'absolute',
          left: cx, top: cy, width: cw, height: ch,
          border: '1px solid rgba(255,238,169,0.7)',
          boxShadow: '0 0 6px rgba(255,238,169,0.2)'
        }} />
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function PauseMenu({ show, onResume, onSettings, onQuit }) {
  /** Minimal pause overlay with softened vignette. */
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
  /** World map modal - subdued list with soft glow heading. */
  if (!show) return null;
  return (
    <div style={modalStyle}>
      <div style={panelStyle}>
        <h3 style={headingStyle}>World Map</h3>
        <div style={{ color: '#ffeea9', marginBottom: 10, letterSpacing: 1 }}>
          Current: <span style={{ color: '#fff' }}>{world.currentBiome}</span>
        </div>
        <ul style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'left', marginTop: 0 }}>
          {world.unlockedNodes.map(n => <li key={n} style={{ marginBottom: 4 }}>{n}</li>)}
        </ul>
        <button style={btnStyle} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function UpgradeMenu({ show, upgrades, onToggle, onClose }) {
  /** Upgrades modal - simple toggles with faint separators. */
  if (!show) return null;
  return (
    <div style={modalStyle}>
      <div style={panelStyle}>
        <h3 style={headingStyle}>Upgrades</h3>
        {Object.keys(upgrades).map(k => (
          <label key={k} style={{
            color: 'rgba(255,255,255,0.9)', display: 'block', marginBottom: 8,
            paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}>
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
  /** Settings modal for audio/darkness sliders with muted tone. */
  if (!show) return null;
  return (
    <div style={modalStyle}>
      <div style={panelStyle}>
        <h3 style={headingStyle}>Settings</h3>
        <div style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 10 }}>
          <label>
            <input type="checkbox" checked={settings.audio} onChange={(e) => onChange({ audio: e.target.checked })} /> Audio Enabled
          </label>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 10 }}>
          <label>
            Darkness
            <input
              style={{ marginLeft: 8 }}
              type="range" min="0" max="1" step="0.05" value={settings.darkness}
              onChange={(e) => onChange({ darkness: parseFloat(e.target.value) })} />
          </label>
        </div>
        <button style={btnStyle} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

const modalStyle = {
  position: 'absolute',
  inset: 0,
  background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.7) 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};
const panelStyle = {
  ...capsule,
  background: 'rgba(18,21,30,0.85)',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.08)',
  padding: 16,
  width: 320,
  textAlign: 'center'
};
const btnStyle = {
  background: 'linear-gradient(180deg, #ffb84d, #e38a22)',
  border: '1px solid rgba(0,0,0,0.25)',
  padding: '8px 12px',
  color: '#2e2d32',
  margin: 6,
  cursor: 'pointer',
  borderRadius: 6,
  boxShadow: '0 2px 10px rgba(255,153,0,0.18)',
  transition: 'transform 120ms ease, filter 120ms ease'
};
const headingStyle = {
  color: '#ffeea9',
  marginTop: 0,
  textShadow: '0 0 10px rgba(255,190,120,0.25)'
};

function labelFor(k) {
  switch (k) {
    case 'everbrightCoal': return 'Everbright Coal (slower flame decay)';
    case 'solarMirror': return 'Solar Mirror (light puzzles boost)';
    case 'flameCloak': return 'Flame Cloak (reduced rain damage)';
    default: return k;
  }
}
