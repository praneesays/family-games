import { useStore } from '../lib/store';

const REACTIONS = ['😂', '👏', '😮', '🎉', '❤️'];

export function ReactionBar({ onOpenPlayers }: { onOpenPlayers: () => void }) {
  const react = useStore((s) => s.react);
  const players = useStore((s) => s.players);
  return (
    <div className="reaction-bar">
      <div className="reaction-bar__emojis" role="group" aria-label="Send a reaction">
        {REACTIONS.map((e) => (
          <button key={e} className="reaction-bar__btn" onClick={() => react(e)} aria-label={`React ${e}`}>
            {e}
          </button>
        ))}
      </div>
      <button className="reaction-bar__players" onClick={onOpenPlayers} aria-label="View players">
        👥 {players.filter((p) => p.conn !== 'left').length}
      </button>
    </div>
  );
}
