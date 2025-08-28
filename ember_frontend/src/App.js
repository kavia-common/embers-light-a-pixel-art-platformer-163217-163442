import React, { useEffect, useRef, useState } from 'react';
import './index.css';
import { Game } from './game/Game';
import { UIOverlay } from './ui/UIOverlay';
import { WorldMapOverlay } from './ui/WorldMapOverlay';
import { UpgradesOverlay } from './ui/UpgradesOverlay';
import { PauseOverlay } from './ui/PauseOverlay';
import { saveGameToStorage, loadGameFromStorage } from './state/saveLoad';

// PUBLIC_INTERFACE
export default function App() {
  /**
   * Root component renders fullscreen game canvas and overlays.
   * Keyboard:
   *  - Esc: Pause
   *  - M: World Map
   *  - U: Upgrades
   *  - F5: Save
   *  - F9: Load
   */
  const containerRef = useRef(null);
  const [game, setGame] = useState(null);
  const [paused, setPaused] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [hudState, setHudState] = useState(null);

  // Mount game
  useEffect(() => {
    const root = containerRef.current;
    const g = new Game({
      parent: root,
      onHUDUpdate: setHudState,
      onRequestPause: () => setPaused(true),
    });
    setGame(g);

    // Attempt load
    const loaded = loadGameFromStorage();
    if (loaded) {
      try {
        g.importState(loaded);
      } catch (e) {
        console.warn('Failed to import saved state', e);
      }
    }

    g.start();
    return () => g.destroy();
  }, []);

  // Global keys
  useEffect(() => {
    const onKey = (e) => {
      if (!game) return;
      if (e.code === 'Escape') {
        setPaused((p) => {
          const np = !p;
          game.setPaused(np);
          return np;
        });
      }
      if (e.code === 'KeyM') {
        setShowMap((s) => {
          const ns = !s;
          game.setInputBlocked(ns || showUpgrades || paused);
          return ns;
        });
      }
      if (e.code === 'KeyU') {
        setShowUpgrades((s) => {
          const ns = !s;
          game.setInputBlocked(ns || showMap || paused);
          return ns;
        });
      }
      if (e.code === 'F5') {
        const state = game.exportState();
        saveGameToStorage(state);
      }
      if (e.code === 'F9') {
        const state = loadGameFromStorage();
        if (state) game.importState(state);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [game, paused, showMap, showUpgrades]);

  const handleResume = () => {
    setPaused(false);
    game && game.setPaused(false);
  };

  const closeMap = () => {
    setShowMap(false);
    game && game.setInputBlocked(showUpgrades || paused);
  };
  const closeUpgrades = () => {
    setShowUpgrades(false);
    game && game.setInputBlocked(showMap || paused);
  };

  return (
    <div id="game-root" ref={containerRef}>
      <div className="topbar">
        <button className="btn" onClick={() => { setPaused(p => { const np = !p; game && game.setPaused(np); return np;});}}>
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button className="btn" onClick={() => setShowMap(s => { const ns = !s; game && game.setInputBlocked(ns || showUpgrades || paused); return ns;})}>
          Map
        </button>
        <button className="btn" onClick={() => setShowUpgrades(s => { const ns = !s; game && game.setInputBlocked(ns || showMap || paused); return ns;})}>
          Upgrades
        </button>
        <button className="btn" onClick={() => { const state = game?.exportState(); saveGameToStorage(state); }}>
          Save
        </button>
        <button className="btn" onClick={() => { const state = loadGameFromStorage(); if (state) game?.importState(state); }}>
          Load
        </button>
      </div>

      <UIOverlay hud={hudState} />

      {paused && <PauseOverlay onResume={handleResume} />}
      {showMap && <WorldMapOverlay onClose={closeMap} game={game} />}
      {showUpgrades && <UpgradesOverlay onClose={closeUpgrades} game={game} />}
    </div>
  );
}
