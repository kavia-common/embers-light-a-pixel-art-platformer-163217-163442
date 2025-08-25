import React, { useMemo, useState } from 'react';
import './App.css';
import Game from './game/Game';
import { loadGame, clearSave } from './game/core/Storage';

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
          <p style={{ color: '#ff9900', marginTop: 8, marginBottom: 24 }}>A Pixel Art Platformer</p>
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
