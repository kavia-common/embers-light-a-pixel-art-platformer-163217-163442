//
// Game.js - orchestrates the game loop and high-level state
//
import React, { useEffect, useRef, useState } from 'react';
import input from './core/Input';
import audio from './core/AudioManager';
import bus from './core/EventBus';
import { renderLighting } from './core/Lighting';
import { createInitialWorld } from './world/World';
import Player from './entities/Player';
import { createMote, createSeed } from './entities/Entities';
import { renderTiles, renderBraziers } from './render/Renderer';
import { saveGame, loadGame } from './core/Storage';

// PUBLIC_INTERFACE
export default function Game({ onReturnToMenu }) {
  /**
   * Game component - sets up canvas rendering and runs the loop.
   * Provides overlay UI and menus.
   */
  const canvasRef = useRef(null);
  const [ui, setUi] = useState({
    pause: false,
    map: false,
    upgrades: false,
    settings: false
  });

  const [state, setState] = useState(() => {
    const world = createInitialWorld();
    const player = new Player(3 * 16, (world.tiles.height - 6) * 16);
    const snap = loadGame();
    if (snap) {
      player.x = snap.player.x ?? player.x;
      player.y = snap.player.y ?? player.y;
      player.health = snap.player.health ?? player.health;
      player.flame = snap.player.flame ?? player.flame;
      player.upgrades = { ...player.upgrades, ...(snap.player.upgrades || {}) };
      world.unlockedNodes = snap.world.unlockedNodes || world.unlockedNodes;
      world.currentBiome = snap.world.currentBiome || world.currentBiome;
      world.braziers = world.braziers.map(b => {
        const saved = (snap.world.braziers || []).find(x => x.id === b.id);
        return saved ? { ...b, lit: saved.lit } : b;
      });
    }

    // Entities
    const entities = [];
    for (const s of world.spawners) {
      if (s.type === 'mote') entities.push(createMote(s.x, s.y));
    }

    return {
      world,
      player,
      entities,
      inventory: {
        'Everbright Coal': player.upgrades.everbrightCoal,
        'Solar Mirror': player.upgrades.solarMirror,
        'Flame Cloak': player.upgrades.flameCloak
      },
      settings: {
        audio: true,
        // Lower default darkness (higher brightness). Users can still tweak via Settings.
        darkness: 0.6
      }
    };
  });

  const lastTimeRef = useRef(0);
  const accRef = useRef(0);

  useEffect(() => {
    input.attach();
    (async () => {
      await audio.init();
      // Preload minimal SFX (use simple beeps hosted via data URIs for demo)
      // For brevity, not including real assets; rely on simple html audio data files could be added later.
    })();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const scale = state.world.camera.scale;
    resizeCanvas(canvas, state.world.camera);

    const loop = (t) => {
      if (!lastTimeRef.current) lastTimeRef.current = t;
      const dt = Math.min(1 / 30, (t - lastTimeRef.current) / 1000);
      lastTimeRef.current = t;

      if (!ui.pause) {
        updateGame(dt);
      } else {
        input.update();
      }

      render(ctx);
      requestAnimationFrame(loop);
    };

    const onResize = () => {
      resizeCanvas(canvas, state.world.camera);
    };
    window.addEventListener('resize', onResize);
    requestAnimationFrame(loop);

    return () => {
      input.detach();
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resizeCanvas(canvas, camera) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    canvas.width = Math.floor(camera.w * camera.scale);
    canvas.height = Math.floor(camera.h * camera.scale);
    canvas.style.width = `${vw}px`;
    canvas.style.height = `${vh}px`;
    canvas.style.imageRendering = 'pixelated';
    canvas.style.background = '#0f0f14';
  }

  function spawn(ent) {
    if (ent.type === 'seed') {
      state.entities.push(createSeed(ent));
    }
  }

  function updateGame(dt) {
    const { world, player, entities } = state;

    input.update();

    // Toggle menus
    if (input.wasPressed('pause')) setUi(u => ({ ...u, pause: !u.pause }));
    if (input.wasPressed('map')) setUi(u => ({ ...u, map: !u.map }));
    if (input.wasPressed('interact')) setUi(u => ({ ...u, upgrades: !u.upgrades }));

    // Update player and entities
    player.update(dt, input, world, { audio, entities, spawn });

    // Update enemies and projectiles
    for (const e of entities) {
      if (e.type === 'mote') e.update(dt, player, world);
      if (e.type === 'seed') e.update(dt, { audio }, world);
    }
    // Cleanup dead entities
    for (let i = entities.length - 1; i >= 0; i--) {
      if (entities[i].dead || (entities[i].hp !== undefined && entities[i].hp <= 0)) {
        entities.splice(i, 1);
      }
    }

    // Camera follow
    const cam = world.camera;
    cam.x = Math.floor(player.x - cam.w / 2);
    cam.y = Math.floor(player.y - cam.h / 2);
    cam.x = Math.max(0, Math.min(cam.x, world.tiles.width * 16 - cam.w));
    cam.y = Math.max(0, Math.min(cam.y, world.tiles.height * 16 - cam.h));

    // Autosave occasionally (simple timer via accumulator)
    accRef.current += dt;
    if (accRef.current > 5) {
      saveGame({
        player: {
          x: player.x, y: player.y, health: player.health, flame: player.flame, upgrades: player.upgrades
        },
        world: {
          unlockedNodes: state.world.unlockedNodes,
          currentBiome: state.world.currentBiome,
          braziers: state.world.braziers.map(b => ({ id: b.id, lit: b.lit }))
        },
        inventory: state.inventory,
        settings: state.settings
      });
      accRef.current = 0;
    }

    // Trigger rerender for UI values
    setState(s => ({ ...s }));
  }

  function render(ctx) {
    const { world, player, entities } = state;
    const cam = world.camera;
    const scale = cam.scale;

    // Draw to low-res buffer via scaling
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    // Clear
    ctx.fillStyle = '#0f0f14';
    ctx.fillRect(0, 0, cam.w, cam.h);

    // Render world tiles and objects
    renderTiles(ctx, world, cam);
    renderBraziers(ctx, world, cam);

    // Render entities
    for (const e of entities) {
      e.render(ctx, cam);
    }
    player.render(ctx, cam);

    // Lighting overlay
    const lights = [
      ...player.getLightSources(cam),
      ...world.braziers.filter(b => b.lit).map(b => ({
        x: Math.floor(b.x - cam.x + 5), y: Math.floor(b.y - cam.y + 2), r: 50, strength: 0.78, color: 'rgba(255,210,150,0.10)'
      }))
    ];
    renderLighting(ctx, cam.w, cam.h, lights, state.settings.darkness);

    // Reset transform for UI drawing by React on DOM
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // UI handlers
  const handleToggleUpgrade = (key) => {
    state.player.upgrades[key] = !state.player.upgrades[key];
    setState(s => ({ ...s, inventory: {
      'Everbright Coal': state.player.upgrades.everbrightCoal,
      'Solar Mirror': state.player.upgrades.solarMirror,
      'Flame Cloak': state.player.upgrades.flameCloak
    }}));
  };

  const handleSettingsChange = (patch) => {
    if (patch.audio !== undefined) audio.setEnabled(!!patch.audio);
    setState(s => ({ ...s, settings: { ...s.settings, ...patch } }));
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#0f0f14' }}>
      <canvas ref={canvasRef} style={{ display: 'block', outline: 'none' }} tabIndex={0} />
      {/* Overlay UI - separate React DOM */}
      <HUD state={state} />
      <Menus
        ui={ui} setUi={setUi}
        state={state}
        onToggleUpgrade={handleToggleUpgrade}
        onSettingsChange={handleSettingsChange}
        onReturnToMenu={onReturnToMenu}
      />
    </div>
  );
}

// PUBLIC_INTERFACE
export function HUD({ state }) {
  /** HUD wrapper for flame/health/inventory/minimap. */
  const { player, inventory, world } = state;
  const { FlameBar, HealthBar, InventoryPanel, MiniMap } = require('./ui/OverlayUI');
  return (
    <>
      <FlameBar flame={player.flame} maxFlame={player.maxFlame} />
      <HealthBar health={player.health} maxHealth={player.maxHealth} />
      <InventoryPanel inventory={inventory} />
      <MiniMap world={world} camera={world.camera} />
    </>
  );
}

// PUBLIC_INTERFACE
export function Menus({ ui, setUi, state, onToggleUpgrade, onSettingsChange, onReturnToMenu }) {
  /** Pause, Map, Upgrade, and Settings menus. */
  const { PauseMenu, MapMenu, UpgradeMenu, SettingsMenu } = require('./ui/OverlayUI');
  return (
    <>
      <PauseMenu
        show={ui.pause}
        onResume={() => setUi(u => ({ ...u, pause: false }))}
        onSettings={() => setUi(u => ({ ...u, settings: true }))}
        onQuit={() => {
          // Prefer callback to return to main menu if provided; fallback to reload.
          if (typeof onReturnToMenu === 'function') onReturnToMenu();
          else window.location.reload();
        }}
      />
      <MapMenu show={ui.map} world={state.world} onClose={() => setUi(u => ({ ...u, map: false }))} />
      <UpgradeMenu show={ui.upgrades} upgrades={state.player.upgrades}
        onToggle={onToggleUpgrade}
        onClose={() => setUi(u => ({ ...u, upgrades: false }))} />
      <SettingsMenu show={ui.settings} settings={state.settings}
        onChange={onSettingsChange}
        onClose={() => setUi(u => ({ ...u, settings: false }))} />
    </>
  );
}
