import React, { useState } from 'react';
import './App.css';
import Game from './game/Game';

// PUBLIC_INTERFACE
function App() {
  /** Root app renders a title screen then the game in fullscreen. */
  const [started, setStarted] = useState(true); // auto-start for CI env; could gate behind title screen

  if (!started) {
    return (
      <div className="App">
        <header className="App-header" style={{ background: '#0f0f14', color: '#ffeea9' }}>
          <h1 style={{ margin: 0, letterSpacing: 2 }}>EMBER'S LIGHT</h1>
          <p style={{ color: '#ff9900' }}>A Pixel Art Platformer</p>
          <button className="theme-toggle" onClick={() => setStarted(true)}>Begin</button>
        </header>
      </div>
    );
  }

  return <Game />;
}

export default App;
