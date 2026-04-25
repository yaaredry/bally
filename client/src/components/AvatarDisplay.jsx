import { getAvatarUrl } from '../lib/avatars';

export default function AvatarDisplay({ seed, name, size = 'md' }) {
  const sizes = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden bg-brand-100 flex items-center justify-center flex-shrink-0`}>
      {seed ? (
        <img
          src={getAvatarUrl(seed)}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
      ) : null}
      <span
        className="text-brand-700 font-bold w-full h-full items-center justify-center"
        style={{ display: seed ? 'none' : 'flex' }}
      >
        {initials}
      </span>
    </div>
  );
}
