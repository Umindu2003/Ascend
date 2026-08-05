export const COLORS = {
  // Backgrounds & Surface Cards
  background: '#F8F8F6',
  card: '#FFFFFF',
  cardSecondary: '#F3F4F1',
  
  // Primary CTA & Typography Accent
  primary: '#111111',
  
  // Gamification Accents
  xp: '#F5C542',           // Gold 🪙
  xpBackground: '#FEF9E7', // Soft Gold Tint
  success: '#22C55E',      // Emerald Green 💚
  achievement: '#8B5CF6',  // Royal Purple 🏆
  warning: '#F59E0B',      // Orange 🍊
  danger: '#EF4444',       // Soft Red 🩸
  
  // Typography
  textPrimary: '#111111',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textLight: '#FFFFFF',
  
  // Borders & Dividers
  border: '#ECECEC',
  borderDark: '#111111',
  
  // Translucent Overlays
  overlay: 'rgba(17, 17, 17, 0.4)',
  glassCard: 'rgba(255, 255, 255, 0.85)',
};

export const SHADOWS = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 3,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  button: {
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  glowPurple: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  glowGold: {
    shadowColor: '#F5C542',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const RADIUS = {
  sm: 12,
  md: 16,
  card: 24,
  modal: 28,
  full: 9999,
};

export const SPACING = {
  xs: 6,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};
