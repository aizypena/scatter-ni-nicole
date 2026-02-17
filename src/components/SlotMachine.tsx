import { useState, useCallback, useRef, useEffect } from "react";
import "./SlotMachine.css";

// Nicole-themed silly symbols
const SYMBOLS = [
  { id: "nicole", emoji: "👸", name: "Nicole", multiplier: 50 },
  { id: "scatter", emoji: "💎", name: "SCATTER", multiplier: 0 },
  { id: "crown", emoji: "👑", name: "Queen", multiplier: 25 },
  { id: "money", emoji: "💸", name: "Sweldo", multiplier: 20 },
  { id: "lipstick", emoji: "💄", name: "Slay", multiplier: 15 },
  { id: "star", emoji: "⭐", name: "Main Char", multiplier: 10 },
  { id: "coffee", emoji: "☕", name: "Kape Pls", multiplier: 8 },
  { id: "phone", emoji: "📱", name: "Aaayye", multiplier: 5 },
  { id: "cat", emoji: "🐱", name: "Mingming", multiplier: 4 },
  { id: "pizza", emoji: "🍕", name: "Comfort Fud", multiplier: 3 },
  { id: "clown", emoji: "🤡", name: "My Ex", multiplier: 2 },
  { id: "toilet", emoji: "🚽", name: "My Lovelife", multiplier: 1 },
];

const REEL_COUNT = 5;
const ROW_COUNT = 3;

// Funny messages
const WIN_MESSAGES = [
  "NICOLE IS EATING SAMGYUP TONIGHT! 🥩🔥",
  "SLAY QUEEN, SLAY! Pang-Shopee checkout na 'to! 💅🛒",
  "THE UNIVERSE SAID 'SIGE NA NGA' BESTIE! ✨",
  "NANAY WOULD BE SO PROUD... if this was real money 😭",
  "RENT? PAID. NAILS? DONE. GCASH? LOADED. 💅",
  "THIS IS YOUR SIGN TO KEEP GOING... jk wag ka maadik 😂",
  "CALL THE PULIS CUZ YOU JUST ROBBED THIS GAME! 🚔",
  "MAIN CHARACTER ENERGY TALAGA 'TO EH 🎬",
  "PANG-MILKTEA FUND NA 'TO SIS! 🧋✨",
  "YAYAMANIN ARC ACTIVATED 💰👑",
  "NICOLE GALIT NA SA KAHIRAPAN! 😤💸",
  "MANIFESTING WORKED BESTIE CHAROT 🙏✨",
];

const LOSE_MESSAGES = [
  "It's giving... kalawang 💀",
  "Nicole bestie... bawi next spin? 🥲",
  "The slots said 'hindi mo deserve' 😭",
  "Your GCash balance felt that one 😬",
  "That was rough... parang lovelife mo 🤡",
  "Have you tried being maswerte? 🤔",
  "Sakit. Parang bills every 15th. 😩",
  "It's okay, pera lang yan... na wala ka na 🧘‍♀️",
  "At least maganda ka? Charot 💁‍♀️",
  "Girl... 👁️👄👁️ ano 'to",
  "Talo ka na naman HAHAHAHA 😂💀",
  "Wala na finish na... jk spin ulit 🤪",
  "Baka naman Lord, bigyan mo naman si Nicole 🙏😭",
  "Pang-jeep na lang natira sis 🚌",
  "Error 404: Swerte not found 🔍",
];

const SCATTER_MESSAGES = [
  "✨ SCATTER QUEEN NG PILIPINAS ACTIVATED ✨",
  "💎 FREE SPINS BABY! LIBRENG LARO TARA! 💎",
  "🎰 THE SCATTERS SAID 'PARA SA'YO 'TO NICOLE!' 🎰",
  "👸 SWERTE MO NAMAN TODAY SIS! 👸",
  "🎉 ANG GALING MO NAMAN MAMI! 🎉",
];

const NEAR_MISS_MESSAGES = [
  "KONTI NA LANG! The scatter was RIGHT THERE! 😤",
  "One more scatter and KUMITA KA SANA 😭",
  "Almost had it bestie... HALOS 🥲",
  "SO CLOSE tangina ang sakit nito 😩",
  "The scatter said 'next time na lang beh' 💀",
];

type ReelSymbol = (typeof SYMBOLS)[number];

interface WinLine {
  symbols: ReelSymbol[];
  positions: [number, number][];
  payout: number;
}

function getRandomSymbol(): ReelSymbol {
  // Weighted random - scatter is rarer
  const rand = Math.random();
  if (rand < 0.06) return SYMBOLS[1]; // scatter ~6%
  if (rand < 0.12) return SYMBOLS[0]; // nicole ~6%
  const otherIdx = 2 + Math.floor(Math.random() * (SYMBOLS.length - 2));
  return SYMBOLS[otherIdx];
}

function generateGrid(): ReelSymbol[][] {
  return Array.from({ length: REEL_COUNT }, () =>
    Array.from({ length: ROW_COUNT }, () => getRandomSymbol())
  );
}

function checkPaylines(
  grid: ReelSymbol[][]
): { winLines: WinLine[]; scatterCount: number; scatterPositions: [number, number][] } {
  const winLines: WinLine[] = [];
  const scatterPositions: [number, number][] = [];
  let scatterCount = 0;

  // Count scatters
  for (let col = 0; col < REEL_COUNT; col++) {
    for (let row = 0; row < ROW_COUNT; row++) {
      if (grid[col][row].id === "scatter") {
        scatterCount++;
        scatterPositions.push([col, row]);
      }
    }
  }

  // Check horizontal lines (3 rows)
  for (let row = 0; row < ROW_COUNT; row++) {
    const lineSymbols = Array.from({ length: REEL_COUNT }, (_, col) => grid[col][row]);
    // Check for 3+ matching from left
    let matchCount = 1;
    const firstNonScatter = lineSymbols.find((s) => s.id !== "scatter");
    if (firstNonScatter) {
      for (let i = 1; i < REEL_COUNT; i++) {
        if (lineSymbols[i].id === firstNonScatter.id || lineSymbols[i].id === "scatter") {
          matchCount++;
        } else {
          break;
        }
      }
    }
    if (matchCount >= 3 && firstNonScatter) {
      const positions: [number, number][] = [];
      for (let col = 0; col < matchCount; col++) {
        positions.push([col, row]);
      }
      const payout = firstNonScatter.multiplier * (matchCount - 2) * 2;
      winLines.push({
        symbols: lineSymbols.slice(0, matchCount),
        positions,
        payout,
      });
    }
  }

  // V-shape payline
  const vShape = [
    [0, 0], [1, 1], [2, 2], [3, 1], [4, 0],
  ] as [number, number][];
  checkCustomLine(grid, vShape, winLines);

  // Inverted V
  const invV = [
    [0, 2], [1, 1], [2, 0], [3, 1], [4, 2],
  ] as [number, number][];
  checkCustomLine(grid, invV, winLines);

  return { winLines, scatterCount, scatterPositions };
}

function checkCustomLine(
  grid: ReelSymbol[][],
  positions: [number, number][],
  winLines: WinLine[]
) {
  const lineSymbols = positions.map(([col, row]) => grid[col][row]);
  const firstNonScatter = lineSymbols.find((s) => s.id !== "scatter");
  if (!firstNonScatter) return;

  let matchCount = 0;
  for (let i = 0; i < lineSymbols.length; i++) {
    if (lineSymbols[i].id === firstNonScatter.id || lineSymbols[i].id === "scatter") {
      matchCount++;
    } else {
      break;
    }
  }

  if (matchCount >= 3) {
    const payout = firstNonScatter.multiplier * (matchCount - 2) * 2;
    winLines.push({
      symbols: lineSymbols.slice(0, matchCount),
      positions: positions.slice(0, matchCount),
      payout,
    });
  }
}

export default function SlotMachine() {
  const [grid, setGrid] = useState<ReelSymbol[][]>(generateGrid);
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState("Hoy Nicole! Ready ka na ba yumaman? 💅💰");
  const [lastWin, setLastWin] = useState(0);
  const [winPositions, setWinPositions] = useState<Set<string>>(new Set());
  const [scatterPositions, setScatterPositions] = useState<Set<string>>(new Set());
  const [freeSpins, setFreeSpins] = useState(0);
  const [showBigWin, setShowBigWin] = useState(false);
  const [totalWinThisRound, setTotalWinThisRound] = useState(0);
  const [stoppedReels, setStoppedReels] = useState<boolean[]>([true, true, true, true, true]);
  const [autoPlay, setAutoPlay] = useState(false);
  const autoPlayRef = useRef(false);
  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spin = useCallback(() => {
    if (spinning) return;
    if (balance < bet && freeSpins <= 0) {
      setMessage("Wala ka nang pera sis 💀 Mangutang ka muna HAHAHAHA");
      return;
    }

    const isFree = freeSpins > 0;
    if (!isFree) {
      setBalance((b) => b - bet);
    } else {
      setFreeSpins((f) => f - 1);
    }

    setSpinning(true);
    setWinPositions(new Set());
    setScatterPositions(new Set());
    setLastWin(0);
    setShowBigWin(false);
    setMessage(isFree ? `✨ FREE SPIN! ${freeSpins - 1} left ✨` : "Spinning... 🤞");

    // Stagger reel stops
    const delays = [0, 1, 2, 3, 4].map((i) => 600 + i * 350);
    setStoppedReels([false, false, false, false, false]);

    const newGrid = generateGrid();

    // Stop reels one by one
    delays.forEach((delay, reelIdx) => {
      setTimeout(() => {
        setGrid((prev) => {
          const updated = prev.map((col, i) => (i === reelIdx ? newGrid[reelIdx] : col));
          return updated;
        });
        setStoppedReels((prev) => {
          const updated = [...prev];
          updated[reelIdx] = true;
          return updated;
        });
      }, delay);
    });

    // After all reels stopped
    const totalDelay = delays[delays.length - 1] + 300;
    spinTimeoutRef.current = setTimeout(() => {
      setGrid(newGrid);
      const { winLines, scatterCount, scatterPositions: scatPos } = checkPaylines(newGrid);

      let totalWin = 0;
      const allWinPos = new Set<string>();
      const allScatPos = new Set<string>();

      // Handle wins
      winLines.forEach((wl) => {
        totalWin += wl.payout * (bet / 10);
        wl.positions.forEach(([c, r]) => allWinPos.add(`${c}-${r}`));
      });

      // Handle scatters
      scatPos.forEach(([c, r]) => allScatPos.add(`${c}-${r}`));

      if (scatterCount >= 3) {
        const bonusSpins = scatterCount === 3 ? 8 : scatterCount === 4 ? 12 : 20;
        setFreeSpins((f) => f + bonusSpins);
        totalWin += bet * scatterCount * 2;
        setMessage(
          SCATTER_MESSAGES[Math.floor(Math.random() * SCATTER_MESSAGES.length)] +
            ` (+${bonusSpins} FREE SPINS!)`
        );
      } else if (totalWin > 0) {
        setMessage(WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)]);
      } else if (scatterCount === 2) {
        setMessage(NEAR_MISS_MESSAGES[Math.floor(Math.random() * NEAR_MISS_MESSAGES.length)]);
      } else {
        setMessage(LOSE_MESSAGES[Math.floor(Math.random() * LOSE_MESSAGES.length)]);
      }

      if (totalWin > 0) {
        setBalance((b) => b + totalWin);
        setLastWin(totalWin);
        setTotalWinThisRound(totalWin);
      }

      if (totalWin >= bet * 10) {
        setShowBigWin(true);
        setTimeout(() => setShowBigWin(false), 3000);
      }

      setWinPositions(allWinPos);
      setScatterPositions(allScatPos);
      setSpinning(false);
    }, totalDelay);
  }, [spinning, balance, bet, freeSpins]);

  // Auto play
  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  useEffect(() => {
    if (autoPlay && !spinning && balance >= bet) {
      const timer = setTimeout(() => {
        if (autoPlayRef.current) spin();
      }, 1500);
      return () => clearTimeout(timer);
    }
    if (balance < bet && autoPlay) {
      setAutoPlay(false);
    }
  }, [autoPlay, spinning, balance, bet, spin]);

  const adjustBet = (direction: "up" | "down") => {
    const bets = [1, 2, 5, 10, 20, 50, 100, 200, 500];
    const idx = bets.indexOf(bet);
    if (direction === "up" && idx < bets.length - 1) setBet(bets[idx + 1]);
    if (direction === "down" && idx > 0) setBet(bets[idx - 1]);
  };

  return (
    <div className="slot-container">
      {/* Header */}
      <div className="game-header">
        <h1 className="game-title">
          <span className="title-scatter">✨</span>
          SCATTER NI NICOLE
          <span className="title-scatter">✨</span>
        </h1>
        <p className="game-subtitle">~ Where Sweldo Goes to Die ~</p>
      </div>

      {/* Free spins banner */}
      {freeSpins > 0 && (
        <div className="free-spins-banner">
          🎉 FREE SPINS: {freeSpins} remaining 🎉
        </div>
      )}

      {/* Slot machine frame */}
      <div className="machine-frame">
        <div className="reels-container">
          {Array.from({ length: REEL_COUNT }, (_, colIdx) => (
            <div
              key={colIdx}
              className={`reel ${!stoppedReels[colIdx] ? "reel-spinning" : "reel-stopped"}`}
            >
              {Array.from({ length: ROW_COUNT }, (_, rowIdx) => {
                const sym = grid[colIdx]?.[rowIdx] || SYMBOLS[0];
                const posKey = `${colIdx}-${rowIdx}`;
                const isWin = winPositions.has(posKey);
                const isScatter = scatterPositions.has(posKey);
                return (
                  <div
                    key={`${colIdx}-${rowIdx}`}
                    className={`symbol-cell ${isWin ? "symbol-win" : ""} ${
                      isScatter ? "symbol-scatter" : ""
                    } ${sym.id === "scatter" ? "is-scatter-symbol" : ""} ${
                      sym.id === "nicole" ? "is-nicole-symbol" : ""
                    }`}
                  >
                    <span className="symbol-emoji">{sym.emoji}</span>
                    <span className="symbol-name">{sym.name}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Message */}
      <div className={`message-bar ${lastWin > 0 ? "message-win" : ""}`}>
        <p>{message}</p>
        {lastWin > 0 && <p className="win-amount">+₱{lastWin.toFixed(2)} 🤑</p>}
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="controls-info-row">
          <div className="control-group">
            <label>BALANCE</label>
            <div className="balance-display">₱{balance.toFixed(2)}</div>
          </div>

          <div className="control-group">
            <label>BET</label>
            <div className="bet-controls">
              <button
                className="bet-btn"
                onClick={() => adjustBet("down")}
                disabled={spinning}
              >
                −
              </button>
              <span className="bet-amount">₱{bet}</span>
              <button
                className="bet-btn"
                onClick={() => adjustBet("up")}
                disabled={spinning}
              >
                +
              </button>
            </div>
          </div>

          <div className="control-group">
            <label>LAST WIN</label>
            <div className="last-win-display">
              ₱{lastWin.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="controls-action-row">
          <button
            className={`auto-btn ${autoPlay ? "auto-active" : ""}`}
            onClick={() => setAutoPlay(!autoPlay)}
            disabled={spinning}
          >
            {autoPlay ? "STOP" : "AUTO"}
          </button>

          <button
            className={`spin-btn ${spinning ? "spin-btn-disabled" : ""} ${
              freeSpins > 0 ? "spin-btn-free" : ""
            }`}
            onClick={spin}
            disabled={spinning}
          >
            {spinning ? "💫" : freeSpins > 0 ? "🎁 FREE" : "SPIN 🎰"}
          </button>

          <button
            className={`auto-btn ${autoPlay ? "auto-active" : ""}`}
            style={{ visibility: 'hidden' }}
            aria-hidden="true"
          >
            AUTO
          </button>
        </div>
      </div>

      {/* Paytable */}
      <div className="paytable">
        <h3>💰 PAYTABLE 💰</h3>
        <div className="paytable-grid">
          {SYMBOLS.map((sym) => (
            <div key={sym.id} className={`paytable-item ${sym.id === "scatter" ? "paytable-scatter" : ""}`}>
              <span className="pt-emoji">{sym.emoji}</span>
              <span className="pt-name">{sym.name}</span>
              <span className="pt-value">
                {sym.id === "scatter"
                  ? "3+ = FREE SPINS!"
                  : `x${sym.multiplier}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Big win overlay */}
      {showBigWin && (
        <div className="big-win-overlay">
          <div className="big-win-content">
            <div className="big-win-emoji">🎉👸🎉</div>
            <h2>JACKPOT MAMI!</h2>
            <p className="big-win-amount">₱{totalWinThisRound.toFixed(2)}</p>
            <p className="big-win-sub">NICOLE YAYAMANIN NA! SAMGYUP TAYO! 🥩💅✨</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="game-footer">
        <p>⚠️ Hindi 'to totoo. Peke ang pera. Wag ka magpapadala kay Nicole. ⚠️</p>
        <p className="footer-tiny">Made with 💖, kape, at poor life decisions</p>
      </div>
    </div>
  );
}
