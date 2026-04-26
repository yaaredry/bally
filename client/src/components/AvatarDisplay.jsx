// Single grayscale gradient avatar with cream initials — design system spec
const PX = { xs: 28, sm: 36, md: 48, lg: 64, xl: 84 };

export default function AvatarDisplay({ name, size = 'md' }) {
  const px = PX[size] ?? 48;
  const initials = name
    ? name.split(' ').map(n => n[0]).filter(Boolean).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: px / 2,
        background: 'linear-gradient(160deg, #2a241c 0%, #4a3f33 100%)',
        color: '#f6f1e8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: px * 0.36,
        flexShrink: 0,
        letterSpacing: 0,
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  );
}
