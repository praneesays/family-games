import { useState } from 'react';
import { useStore } from '../lib/store';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { Confetti } from '../components/Overlays';
import { Sheet } from '../components/Sheet';
import type { GameId, RummyState, TambolaState } from '../lib/types';

export function Results() {
  const game = useStore((s) => s.game);
  const players = useStore((s) => s.players);
  const self = players.find((p) => p.isSelf);
  const isHost = !!self?.isHost;
  const sessionWins = useStore((s) => s.sessionWins);
  const gamesPlayed = useStore((s) => s.gamesPlayed);
  const playAgain = useStore((s) => s.playAgain);
  const switchGame = useStore((s) => s.switchGame);
  const endRoom = useStore((s) => s.endRoom);
  const [switchOpen, setSwitchOpen] = useState(false);

  const nameFor = (pid: string) => players.find((p) => p.id === pid)?.name ?? 'Player';
  const colorFor = (name: string) => players.find((p) => p.name === name)?.colorIndex ?? 0;

  return (
    <div className="page results">
      <Confetti />
      <div className="results__head">🎊 Game complete! 🎊</div>

      {gamesPlayed > 1 && sessionWins.length > 0 && (
        <div className="session-strip">
          Tonight:{' '}
          {sessionWins
            .sort((a, b) => b.count - a.count)
            .map((w) => `${w.name} ${w.count}`)
            .join(' · ')}{' '}
          · {gamesPlayed} games
        </div>
      )}

      {game?.kind === 'tambola' ? (
        <TambolaResults game={game} colorFor={colorFor} self={self?.name} />
      ) : game?.kind === 'rummy' ? (
        <RummyResults game={game} nameFor={nameFor} colorFor={colorFor} selfId={self?.id} />
      ) : null}

      <div className="results__loop">
        {isHost ? (
          <>
            <Button size="xl" full pulsing onClick={playAgain}>
              🔁 Play Again
            </Button>
            <div className="row results__loop-row">
              <Button variant="outline" size="m" onClick={() => setSwitchOpen(true)}>
                🎮 Switch game
              </Button>
              <Button variant="ghost" size="m" onClick={endRoom}>
                End
              </Button>
            </div>
          </>
        ) : (
          <div className="waiting-card">
            {players.find((p) => p.isHost)?.name ?? 'The host'} is choosing the next game… 🍿
          </div>
        )}
      </div>

      <Sheet open={switchOpen} title="Switch game" onClose={() => setSwitchOpen(false)}>
        <div className="game-grid game-grid--sheet">
          {(['tambola', 'rummy'] as GameId[]).map((g) => (
            <button
              key={g}
              className="game-card"
              onClick={() => {
                setSwitchOpen(false);
                switchGame(g);
              }}
            >
              <span className="game-card__icon">{g === 'tambola' ? '🎫' : '🃏'}</span>
              <span className="game-card__name">{g === 'tambola' ? 'Tambola' : 'Rummy'}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

function TambolaResults({ game, colorFor, self }: { game: TambolaState; colorFor: (n: string) => number; self?: string }) {
  const fullHouse = game.prizes.find((p) => p.id === 'fullHouse');
  return (
    <>
      {fullHouse?.wonBy && (
        <div className="winner-card anim-pop">
          <Avatar name={fullHouse.wonBy} colorIndex={colorFor(fullHouse.wonBy)} size="lg" />
          <div className="winner-card__name">{fullHouse.wonBy}</div>
          <div className="winner-card__tag">Full House 🏠!</div>
        </div>
      )}
      <ul className="prize-results">
        {game.prizes.map((p) => (
          <li key={p.id}>
            <span>🏆 {p.label}</span>
            <strong>
              {p.wonBy ?? '—'}
              {p.wonBy === self && <span className="you-star"> ⭐ you</span>}
            </strong>
          </li>
        ))}
      </ul>
    </>
  );
}

function RummyResults({
  game,
  nameFor,
  colorFor,
  selfId,
}: {
  game: RummyState;
  nameFor: (id: string) => string;
  colorFor: (n: string) => number;
  selfId?: string;
}) {
  const ranking = Object.entries(game.scores ?? {}).sort((a, b) => a[1] - b[1]);
  const winner = game.declarer ? nameFor(game.declarer) : ranking[0] ? nameFor(ranking[0][0]) : '';
  return (
    <>
      {winner && (
        <div className="winner-card anim-pop">
          <Avatar name={winner} colorIndex={colorFor(winner)} size="lg" />
          <div className="winner-card__name">{winner}</div>
          <div className="winner-card__tag">Declared & won 🃏</div>
        </div>
      )}
      <ul className="prize-results">
        {ranking.map(([pid, score], i) => (
          <li key={pid} className={pid === selfId ? 'is-self' : ''}>
            <span>
              {i + 1}. {nameFor(pid)}
              {pid === selfId && <span className="you-star"> ⭐</span>}
            </span>
            <strong>{score} pts</strong>
          </li>
        ))}
      </ul>
    </>
  );
}
