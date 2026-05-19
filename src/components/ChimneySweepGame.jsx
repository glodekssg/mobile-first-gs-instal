import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Trophy, ChevronRight, AlertTriangle, Play, Hammer } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';
import { useT } from '../lib/i18n';

// Maski kierunków
const T = 1, R = 2, B = 4, L = 8;
const rotMask = (m) => (((m << 1) | (m >> 3)) & 15);
const rotN = (m, n) => { let r = m; for (let i = 0; i < ((n % 4) + 4) % 4; i++) r = rotMask(r); return r; };

const DIR_MASK = { T, R, B, L };
const DIR_OPP = { T: 'B', R: 'L', B: 'T', L: 'R' };
const DIR_DELTA = { T: [-1, 0], R: [0, 1], B: [1, 0], L: [0, -1] };

function generateLevel(level) {
  const sizes = [5, 5, 6, 6, 7, 7, 8, 8, 9, 10];
  const size = sizes[Math.min(level - 1, 9)];
  const minLen = Math.floor(size * 1.8);

  for (let attempt = 0; attempt < 500; attempt++) {
    const entryCol = Math.floor(Math.random() * size);
    const result = genPath(size, size, entryCol, minLen);
    if (result) {
      return buildBoard(size, size, entryCol, result.exitCol, result.cells, level);
    }
  }
  return buildBoard(size, size, Math.floor(size/2), Math.floor(size/2), [], level);
}

function genPath(rows, cols, entryCol, minLength) {
  const cells = [];
  const visited = new Set();
  let r = 0, c = entryCol;
  let entryDir = 'T';

  for (let step = 0; step < rows * cols * 4; step++) {
    visited.add(`${r},${c}`);
    const candidates = [];
    for (const dir of ['B', 'R', 'L']) {
      if (dir === entryDir) continue;
      const [dr, dc] = DIR_DELTA[dir];
      const nr = r + dr, nc = c + dc;
      if (dir === 'B' && nr >= rows) {
        if (r === rows - 1 && cells.length + 1 >= minLength) {
          cells.push({ r, c, entry: entryDir, exit: 'B' });
          return { cells, exitCol: c };
        }
        continue;
      }
      if (nr < 0 || nc < 0 || nc >= cols) continue;
      if (visited.has(`${nr},${nc}`)) continue;
      candidates.push(dir);
    }
    if (candidates.length === 0) return null;

    const wantDown = (r < rows - 1) && candidates.includes('B') && (cells.length >= minLength - rows ? 0.8 : 0.3);
    let chosen = (wantDown && Math.random() < wantDown) ? 'B' : candidates[Math.floor(Math.random() * candidates.length)];

    cells.push({ r, c, entry: entryDir, exit: chosen });
    const [dr, dc] = DIR_DELTA[chosen];
    r += dr; c += dc;
    entryDir = DIR_OPP[chosen];
  }
  return null;
}

function buildBoard(rows, cols, entryCol, exitCol, pathCells, level) {
  const tiles = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) row.push({ shape: 0, isPath: false, rotation: 0 });
    tiles.push(row);
  }
  for (const cell of pathCells) {
    const shape = DIR_MASK[cell.entry] | DIR_MASK[cell.exit];
    tiles[cell.r][cell.c] = { shape, isPath: true, rotation: Math.floor(Math.random() * 4) };
  }
  // Obstacles
  const types = [T | B, T | R, T | R | L, T | B | R | L];
  const density = Math.min(0.8, 0.4 + (level * 0.05));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!tiles[r][c].isPath && Math.random() < density) {
        tiles[r][c] = {
          shape: types[Math.floor(Math.random() * types.length)],
          isPath: false,
          rotation: Math.floor(Math.random() * 4),
        };
      }
    }
  }
  return { tiles, rows, cols, entryCol, exitCol };
}

function advanceFlow(board, flowPath) {
  const current = flowPath[flowPath.length - 1];
  const { r, c, to } = current;
  const [dr, dc] = DIR_DELTA[to];
  const nr = r + dr, nc = c + dc;
  const fromDir = DIR_OPP[to];

  if (nr >= board.rows && r === board.rows - 1 && c === board.exitCol && to === 'B') {
    return { status: 'solved', newSegment: null };
  }
  if (nr < 0 || nr >= board.rows || nc < 0 || nc >= board.cols) {
    return { status: 'failed', newSegment: null };
  }

  const tile = board.tiles[nr][nc];
  if (!tile.shape) return { status: 'failed', newSegment: null };

  const eff = rotN(tile.shape, tile.rotation);
  if (!(eff & DIR_MASK[fromDir])) return { status: 'failed', newSegment: null };

  let nextTo = null;
  for (const dir of ['T', 'R', 'B', 'L']) {
    if (dir === fromDir) continue;
    if (eff & DIR_MASK[dir]) { nextTo = dir; break; }
  }

  if (!nextTo) return { status: 'failed', newSegment: null };
  return { status: 'flowing', newSegment: { r: nr, c: nc, from: fromDir, to: nextTo } };
}

// =================== UI ===================

const TILE_SIZE = 52;
const PIPE_WIDTH = 24;

function ChimneySVG({ shape, hasAir, isTip }) {
  const c = TILE_SIZE / 2;
  const pw = PIPE_WIDTH;
  const borderColor = "#27272a"; // Zinc 800
  const brushColor = "#09090b"; // Ziemny czarny dla szczotki
  
  return (
    <svg width={TILE_SIZE} height={TILE_SIZE} className="block overflow-visible">
      <defs>
        {/* Ceglany / stalowy gradient wkłady kominowego */}
        <linearGradient id="chimney-grad-v" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3f3f46" />
          <stop offset="20%" stopColor="#71717a" />
          <stop offset="80%" stopColor="#52525b" />
          <stop offset="100%" stopColor="#27272a" />
        </linearGradient>
        <linearGradient id="chimney-grad-h" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3f3f46" />
          <stop offset="20%" stopColor="#71717a" />
          <stop offset="80%" stopColor="#52525b" />
          <stop offset="100%" stopColor="#27272a" />
        </linearGradient>
      </defs>

      {/* Rury zewnętrzne wkłady kominowej */}
      {shape > 0 && <circle cx={c} cy={c} r={pw / 1.4} fill="url(#chimney-grad-v)" stroke={borderColor} strokeWidth="2" />}
      {(shape & T) && <rect x={c - pw/2} y={-2} width={pw} height={c + pw/2 + 2} fill="url(#chimney-grad-v)" stroke={borderColor} strokeWidth="2" />}
      {(shape & B) && <rect x={c - pw/2} y={c - pw/2} width={pw} height={TILE_SIZE - c + pw/2 + 2} fill="url(#chimney-grad-v)" stroke={borderColor} strokeWidth="2" />}
      {(shape & L) && <rect x={-2} y={c - pw/2} width={c + pw/2 + 2} height={pw} fill="url(#chimney-grad-h)" stroke={borderColor} strokeWidth="2" />}
      {(shape & R) && <rect x={c - pw/2} y={c - pw/2} width={TILE_SIZE - c + pw/2 + 2} height={pw} fill="url(#chimney-grad-h)" stroke={borderColor} strokeWidth="2" />}

      {/* Środek wyczyszczonego komina (czarny od sadzy po przejściu szczotki) */}
      {hasAir && shape > 0 && (
        <circle cx={c} cy={c} r={pw / 2.5} fill={brushColor} />
      )}
      {hasAir && (shape & T) && <rect x={c - pw/2.5} y={0} width={pw/1.25} height={c} fill={brushColor} />}
      {hasAir && (shape & B) && <rect x={c - pw/2.5} y={c} width={pw/1.25} height={TILE_SIZE - c} fill={brushColor} />}
      {hasAir && (shape & L) && <rect x={0} y={c - pw/2.5} width={c} height={pw/1.25} fill={brushColor} />}
      {hasAir && (shape & R) && <rect x={c} y={c - pw/2.5} width={TILE_SIZE - c} height={pw/1.25} fill={brushColor} />}
      
      {/* Animacja samej kuli/szczotki na końcu (tip) */}
      {isTip && (
        <circle cx={c} cy={c} r={pw / 1.8} fill="#18181b" stroke="#3f3f46" strokeWidth="2" strokeDasharray="2,2" />
      )}

      {/* Spoiny wkłady (detale) */}
      {shape > 0 && <circle cx={c} cy={c} r={pw / 1.4} fill="none" stroke="#18181b" strokeWidth="1" opacity="0.5" />}
      {(shape & T) && <line x1={c - pw/2 + 1} y1={c/2} x2={c + pw/2 - 1} y2={c/2} stroke="#18181b" strokeWidth="2" opacity="0.6" />}
      {(shape & B) && <line x1={c - pw/2 + 1} y1={c + c/2} x2={c + pw/2 - 1} y2={c + c/2} stroke="#18181b" strokeWidth="2" opacity="0.6" />}
      {(shape & L) && <line x1={c/2} y1={c - pw/2 + 1} x2={c/2} y2={c + pw/2 - 1} stroke="#18181b" strokeWidth="2" opacity="0.6" />}
      {(shape & R) && <line x1={c + c/2} y1={c - pw/2 + 1} x2={c + c/2} y2={c + pw/2 - 1} stroke="#18181b" strokeWidth="2" opacity="0.6" />}
    </svg>
  );
}

function Tile({ tile, r, c, onClick, hasAir, isTip, status }) {
  const empty = !tile.shape;
  const locked = hasAir || status === 'failed' || status === 'solved';
  
  // Tło to wzór cegieł
  const bg = empty ? 'bg-orange-950/40' : 'bg-red-950/60 shadow-inner';
  
  return (
    <button
      onClick={() => !locked && !empty && onClick(r, c)}
      disabled={locked || empty}
      className={`relative ${bg} border border-orange-900/30 ${empty ? '' : 'cursor-pointer hover:bg-red-900/80 active:bg-red-950'} ${hasAir ? 'ring-2 ring-orange-500/30 z-10' : ''}`}
      style={{ width: TILE_SIZE, height: TILE_SIZE }}
    >
      {!empty && (
        <div
          className="absolute inset-0 origin-center flex items-center justify-center"
          style={{
            transform: `rotate(${(tile.rotation || 0) * 90}deg)`,
            transition: 'transform 0.2s cubic-bezier(.4,1.4,.6,.95)',
          }}
        >
          <ChimneySVG shape={tile.shape} hasAir={hasAir} isTip={isTip} />
        </div>
      )}
    </button>
  );
}

export default function ChimneySweepGame() {
  const t = useT();
  const [level, setLevel] = useState(1);
  const [board, setBoard] = useState(null);
  const [flowState, setFlowState] = useState({ status: 'waiting', countdown: 3, path: [] });
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    loadLevel(level);
  }, [level]);

  function loadLevel(n) {
    const b = generateLevel(n);
    setBoard(b);
    setFlowState({ status: 'waiting', countdown: 4, path: [{ r: -1, c: b.entryCol, from: 'T', to: 'B' }] });
    setGameStarted(false);
  }

  // Timer dla odliczania startu spadania szczotki — uruchamia się gdy gameStarted i waiting
  useEffect(() => {
    if (flowState.status !== 'waiting' || !gameStarted) return;
    if (flowState.countdown > 0) {
      const timer = setTimeout(() => {
        setFlowState(s => ({ ...s, countdown: s.countdown - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setFlowState(s => ({ ...s, status: 'flowing' }));
    }
  }, [flowState, gameStarted]);

  // Ruch spadającej szczotki kominiarskiej
  useEffect(() => {
    if (flowState.status !== 'flowing' || !board) return;
    const speed = Math.max(150, 700 - level * 45); // Gra przyspiesza
    
    const t = setTimeout(() => {
      const result = advanceFlow(board, flowState.path);
      if (result.status === 'solved') {
        setFlowState(s => ({ ...s, status: 'solved' }));
        setScore(sc => sc + flowState.path.length * 10 + 500); // Bonus za ukończenie
      } else if (result.status === 'failed') {
        setFlowState(s => ({ ...s, status: 'failed' }));
      } else {
        setFlowState(s => ({ ...s, path: [...s.path, result.newSegment] }));
        setScore(sc => sc + 10); // Punkty za każdy segment
      }
    }, speed);
    return () => clearTimeout(t);
  }, [flowState, board, level]);

  function rotateTile(r, c) {
    if (!gameStarted) setGameStarted(true);
    if (flowState.status === 'failed' || flowState.status === 'solved') return;
    const hasAir = flowState.path.some(p => p.r === r && p.c === c);
    if (hasAir) return;

    setBoard(prev => {
      const tiles = prev.tiles.map((row, ri) =>
        row.map((tile, ci) => ri === r && ci === c
          ? { ...tile, rotation: ((tile.rotation || 0) + 1) % 4 }
          : tile));
      return { ...prev, tiles };
    });
  }

  if (!board) return null;

  const gridWidth = board.cols * TILE_SIZE;
  const gridHeight = board.rows * TILE_SIZE;
  const containerW = gridWidth + 80;
  const containerH = gridHeight + 140;
  const gridLeft = 40;
  const gridTop = 80;

  return (
    <section className="py-24 relative overflow-hidden bg-slate-900" id="gra">
      {/* Tło — wygenerowany przekrój domu */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/game_house_bg.png')`, filter: 'brightness(0.5) contrast(1.1)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-orange-950 via-transparent to-zinc-900/60 z-0" />

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <AnimatedSection className="text-center mb-8">
          <p className="text-orange-400 font-bold uppercase tracking-widest text-sm mb-2 drop-shadow-md flex justify-center items-center gap-2">
            <Hammer className="w-4 h-4" aria-hidden="true" /> {t('game.eyebrow')} <Hammer className="w-4 h-4" aria-hidden="true" />
          </p>
          <h2 className="text-3xl md:text-5xl font-black mb-3 text-white drop-shadow-xl tracking-tight">{t('game.title')}</h2>
          <p className="text-orange-100/90 max-w-2xl mx-auto font-medium text-lg leading-relaxed shadow-slate-900/50 drop-shadow-md bg-zinc-900/40 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
            {t('game.description')}
          </p>
        </AnimatedSection>

        {/* UI Top Bar */}
        <div className="flex flex-wrap items-center justify-between bg-zinc-900/80 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-4 mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.8)] max-w-xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs text-orange-400/80 uppercase font-bold tracking-wider mb-0.5">{t('game.level')}</div>
              <div className="text-2xl font-black text-white leading-none">{level}</div>
            </div>
            <div className="w-px h-10 bg-zinc-700" />
            <div className="text-center">
              <div className="text-xs text-orange-400/80 uppercase font-bold tracking-wider mb-0.5">{t('game.points')}</div>
              <div className="text-2xl font-black text-orange-400 leading-none">{score}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!gameStarted && flowState.status === 'waiting' && (
              <div className="flex items-center gap-2 bg-orange-500/20 text-orange-400 px-4 py-2 rounded-xl border border-orange-500/30">
                <AlertTriangle className="w-5 h-5 animate-pulse" aria-hidden="true" />
                <span className="font-bold whitespace-nowrap">{t('game.click_to_start')}</span>
              </div>
            )}
            {gameStarted && flowState.status === 'waiting' && (
              <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-xl border border-red-500/30">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <span className="font-bold whitespace-nowrap">START ZA: {flowState.countdown}s</span>
              </div>
            )}
            {flowState.status === 'flowing' && (
              <div className="flex items-center gap-2 bg-orange-500/20 text-orange-400 px-4 py-2 rounded-xl border border-orange-500/30">
                <Hammer className="w-5 h-5 animate-bounce" />
                <span className="font-bold">{t('game.cleaning')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Game Board Container */}
        <div className="relative mx-auto rounded-3xl backdrop-blur-sm bg-zinc-900/70 border-4 border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden" style={{ maxWidth: containerW + 48 }}>
          
          <div className="relative mx-auto" style={{ width: containerW, height: containerH }}>
            
            {/* Dach - Kominiarz (Start) */}
            <div className="absolute z-20 flex flex-col items-center justify-center bg-zinc-900 rounded-full shadow-[0_0_20px_rgba(0,0,0,1)] border-2 border-zinc-700" style={{
              left: gridLeft + board.entryCol * TILE_SIZE + TILE_SIZE / 2 - 40,
              top: gridTop - 90,
              width: 80, height: 80,
              overflow: 'hidden'
            }}>
              <img src="/game_sweep_roof.png" alt={t('game.alt_roof')} className="w-full h-full object-cover scale-150 transform translate-y-3" />
            </div>
            
            {/* Wkład wejściowy z dachu */}
            <div className="absolute z-10" style={{
              left: gridLeft + board.entryCol * TILE_SIZE + TILE_SIZE / 2 - 12,
              top: gridTop - 15,
              width: 24, height: 15,
              background: 'linear-gradient(to right, #3f3f46, #71717a, #27272a)',
              borderLeft: '2px solid #18181b',
              borderRight: '2px solid #18181b',
            }} />

            {/* Grid */}
            <div className="absolute bg-black/60 rounded-xl p-2 shadow-inner" style={{ left: gridLeft - 8, top: gridTop - 8 }}>
              {board.tiles.map((row, r) => (
                <div key={r} className="flex">
                  {row.map((tile, c) => {
                    const hasAir = flowState.path.some(p => p.r === r && p.c === c);
                    const isTip = hasAir && flowState.path[flowState.path.length - 1].r === r && flowState.path[flowState.path.length - 1].c === c;
                    return (
                      <Tile key={c} tile={tile} r={r} c={c} onClick={rotateTile} hasAir={hasAir} isTip={isTip} status={flowState.status} />
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Wkład wyjściowy do kominka */}
            <div className="absolute z-10" style={{
              left: gridLeft + board.exitCol * TILE_SIZE + TILE_SIZE / 2 - 12,
              top: gridTop + gridHeight,
              width: 24, height: 15,
              background: 'linear-gradient(to right, #3f3f46, #71717a, #27272a)',
              borderLeft: '2px solid #18181b',
              borderRight: '2px solid #18181b',
            }} />
            
            {/* Kominek (Koniec) */}
            <div className="absolute z-20" style={{
              left: gridLeft + board.exitCol * TILE_SIZE + TILE_SIZE / 2 - 60,
              top: gridTop + gridHeight + 15,
              width: 120, height: 120,
            }}>
              <AnimatePresence mode="wait">
                  <motion.img 
                    src="/game_fireplace.png"
                    alt={t('game.alt_fireplace')}
                    className="w-full h-full object-cover rounded-xl border-4 border-zinc-800 drop-shadow-[0_10px_20px_rgba(234,88,12,0.4)]"
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: flowState.status === 'solved' ? 1 : 0.8, filter: flowState.status === 'solved' ? 'brightness(1.3)' : 'brightness(1)' }}
                  />
              </AnimatePresence>
            </div>

            {/* Failed Overlay */}
            <AnimatePresence>
              {flowState.status === 'failed' && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-3xl"
                >
                  <div className="bg-zinc-900 border-2 border-red-500 rounded-2xl p-8 text-center max-w-sm shadow-2xl">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h4 className="text-3xl font-black text-white mb-2">{t('game.failed_title')}</h4>
                    <p className="text-red-200 mb-6 font-medium">{t('game.failed_message')}</p>
                    <button onClick={() => loadLevel(level)} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(220,38,38,0.5)] flex justify-center items-center gap-2">
                      <RefreshCw className="w-5 h-5" /> {t('game.retry')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Solved Overlay */}
            <AnimatePresence>
              {flowState.status === 'solved' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 flex items-center justify-center bg-orange-950/80 backdrop-blur-md rounded-3xl"
                >
                  <div className="bg-zinc-900 border-2 border-orange-500 rounded-2xl p-8 text-center max-w-sm shadow-[0_0_40px_rgba(249,115,22,0.4)]">
                    <div className="text-6xl mb-4">🔥</div>
                    <h4 className="text-3xl font-black text-white mb-1">{t('game.solved_title')}</h4>
                    <p className="text-orange-200 mb-6 font-medium">{t('game.solved_message')}</p>
                    <button onClick={() => setLevel(l => l + 1)} className="w-full py-4 bg-orange-500 hover:bg-orange-400 text-zinc-950 rounded-xl font-black uppercase tracking-wider transition-transform hover:scale-105 shadow-[0_0_15px_rgba(249,115,22,0.6)] flex justify-center items-center gap-2">
                      {t('game.next_order')} <Play className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

      </div>
    </section>
  );
}
