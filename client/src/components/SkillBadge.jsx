// Neutral pill with a colored dot — dot color indicates level, pill is always paper/hairline
const DOT = {
  // Beach Volleyball (numeric)
  '1': '#7aa867', '2': '#7aa867',
  '3': '#e8a23a', '4': '#e8a23a',
  '5': '#e87a4a', '6': '#e87a4a',
  '7': '#c8425a',
  // Footvolley (letter)
  E: '#7aa867', D: '#e8a23a', C: '#e8a23a', B: '#e87a4a', A: '#c8425a',
  League: '#c8425a',
  // Universal
  'All welcome': '#3d6f7c',
};

export default function SkillBadge({ level, small = false }) {
  const dot = DOT[level] ?? '#3d6f7c';
  const d = small ? 6 : 7;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: small ? 5 : 6,
        background: '#fff',
        border: '1px solid rgba(31,26,20,0.08)',
        borderRadius: 999,
        padding: small ? '3px 8px 3px 7px' : '4px 10px 4px 9px',
        fontSize: small ? 11 : 12,
        fontWeight: 500,
        color: '#1f1a14',
        letterSpacing: -0.1,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: d, height: d, borderRadius: d / 2, background: dot, flexShrink: 0 }} />
      {level}
    </span>
  );
}
