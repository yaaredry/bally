import { AVATAR_SEEDS, getAvatarUrl } from '../lib/avatars';

export default function AvatarPicker({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {AVATAR_SEEDS.map(seed => (
        <button
          key={seed}
          type="button"
          onClick={() => onSelect(seed)}
          className={`w-full aspect-square rounded-full overflow-hidden border-2 transition-all ${
            selected === seed
              ? 'border-brand-500 scale-110 shadow-md'
              : 'border-transparent hover:border-brand-200'
          }`}
        >
          <img src={getAvatarUrl(seed)} alt={seed} className="w-full h-full object-cover" />
        </button>
      ))}
    </div>
  );
}
