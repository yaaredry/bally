const SPORT_IMG = {
  'Beach Volleyball': { src: '/icons/volleyball-ball.jpg',  alt: 'Volleyball' },
  'Footvolley':       { src: '/icons/footvolley-ball.png',  alt: 'Footvolley' },
  'Teqball':          { src: '/icons/teqball-table.png',    alt: 'Teqball'    },
};

export default function SportIcon({ sport, size = 20, className = '' }) {
  const img = SPORT_IMG[sport];
  if (!img) return null;
  return (
    <img
      src={img.src}
      alt={img.alt}
      style={{ width: size, height: size }}
      className={`inline-block object-contain ${className}`}
    />
  );
}
