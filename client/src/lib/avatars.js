export const AVATAR_SEEDS = [
  'beach-ace',
  'surfer-wave',
  'spike-king',
  'sand-setter',
  'dig-master',
  'block-hero',
  'serve-ace',
  'rally-queen',
  'volley-star',
  'beach-pro',
  'foot-wizard',
  'court-legend',
];

export const getAvatarUrl = (seed) =>
  `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed || 'beach-ace')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
