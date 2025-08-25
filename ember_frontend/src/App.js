import React, { useMemo, useState } from 'react';
import './App.css';
import Game from './game/Game';
import { loadGame, clearSave } from './game/core/Storage';

/**
 * Small presentational row for a control binding.
 */
// PUBLIC_INTERFACE
function ControlRow({ label, value }) {
  /** Renders a single label/value pair for key bindings on the main menu. */
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
      <span style={{ color: '#d6cba3', textAlign: 'left' }}>{label}</span>
      <span
        style={{
          color: '#0f0f14',
          background: '#ffb84d',
          padding: '2px 8px',
          borderRadius: 4,
          border: '1px solid #2e2d32',
          boxShadow: '0 1px 0 rgba(0,0,0,0.3) inset',
          fontWeight: 700
        }}
      >
        {value}
      </span>
    </div>
  );
}

// Simple helper to read save presence without loading into game.
function hasSave() {
  try {
    const snap = loadGame();
    return !!snap && !!snap.player;
  } catch {
    return false;
  }
}

// PUBLIC_INTERFACE
function App() {
  /**
   * Root app renders the Main Menu first with Start/Continue/Settings.
   * Supports returning to the main menu from in-game via a callback.
   */
  const [screen, setScreen] = useState('menu'); // 'menu' | 'game' | 'settings'
  const [continueAvailable, setContinueAvailable] = useState(() => hasSave());

  const handleStartNew = () => {
    // Starting new game: clear save and go to gameplay
    clearSave();
    setScreen('game');
  };
  const handleContinue = () => {
    setScreen('game');
  };
  const handleSettingsFromMenu = () => {
    setScreen('settings');
  };
  const handleCloseSettings = () => {
    // From settings go back to menu if not in-game; otherwise a no-op (in-game has its own settings modal)
    setScreen('menu');
    setContinueAvailable(hasSave());
  };
  const handleReturnToMenuFromGame = () => {
    // Called by Game when user chooses "Return to Main Menu" from pause
    setScreen('menu');
    setContinueAvailable(hasSave());
  };

  // Keep save availability updated when we come back to menu.
  useMemo(() => {
    if (screen === 'menu') {
      setContinueAvailable(hasSave());
    }
  }, [screen]);

  if (screen === 'menu') {
    return (
      <div className="App">
        <header className="App-header" style={{ background: '#0f0f14', color: '#ffeea9' }}>
          <h1 style={{ margin: 0, letterSpacing: 2 }}>EMBER'S LIGHT</h1>
          <p style={{ color: '#ff9900', marginTop: 8, marginBottom: 16 }}>A Pixel Art Platformer</p>

          {/* Atmospheric game description */}
          <div
            style={{
              maxWidth: 720,
              margin: '0 auto',
              color: '#d6cba3',
              lineHeight: 1.6,
              fontSize: 14,
              textShadow: '0 0 6px rgba(255, 153, 0, 0.15)',
              opacity: 0.95,
              padding: '0 16px',
              marginBottom: 20
            }}
          >
            Play as Ember, the last spark of a flame spirit, exploring a darkened world after a great
            flood. Rekindle ancient braziers, survive hazards, and restore light to the ruins before
            your flame fades.
          </div>

          {/* Controls / Key Bindings */}
          <div
            aria-label="Game Controls"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(180px, 1fr))',
              gap: 10,
              padding: '12px 14px',
              border: '2px solid #2e2d32',
              background: '#15141acc',
              boxShadow: '0 0 12px rgba(255,153,0,0.08) inset',
              borderRadius: 6,
              color: '#ffeea9',
              width: 'min(720px, 92vw)',
              margin: '0 auto 22px',
              fontSize: 13
            }}
          >
            <div style={{ gridColumn: '1 / -1', marginBottom: 2, color: '#ffb84d', letterSpacing: 1, fontWeight: 700, textAlign: 'left' }}>
              Controls
            </div>
            <ControlRow label="Move" value="WASD / Arrow Keys" />
            <ControlRow label="Jump" value="Space / K" />
            <ControlRow label="Flame Burst" value="J" />
            <ControlRow label="Fire Seed" value="L" />
            <ControlRow label="Dim (Stealth)" value="Shift" />
            <ControlRow label="Map" value="M" />
            <ControlRow label="Upgrades / Interact" value="E" />
            <ControlRow label="Pause" value="P" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 240 }}>
            <button className="theme-toggle" onClick={handleStartNew}>Start Game</button>
            <button className="theme-toggle" onClick={handleContinue} disabled={!continueAvailable}>
              Continue
            </button>
            <button className="theme-toggle" onClick={handleSettingsFromMenu}>Settings</button>
          </div>
          {!continueAvailable && (
            <div style={{ marginTop: 10, color: '#888', fontSize: 12 }}>No save data found</div>
          )}
        </header>
      </div>
    );
  }

  if (screen === 'settings') {
    // A very lightweight settings screen for menu context only.
    return (
      <div className="App">
        <header className="App-header" style={{ background: '#0f0f14', color: '#ffeea9' }}>
          <h2 style={{ margin: 0, letterSpacing: 2 }}>Settings</h2>
          <p style={{ color: '#ff9900', marginTop: 8, marginBottom: 24 }}>Adjust options in-game from Pause</p>
          <button className="theme-toggle" onClick={handleCloseSettings}>Back</button>
        </header>
      </div>
    );
  }

  // Gameplay screen
  return <Game onReturnToMenu={handleReturnToMenuFromGame} />;
}

export default App;
