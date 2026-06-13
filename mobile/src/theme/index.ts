import { StyleSheet } from 'react-native';

export const Colors = {
  background: '#07060E',        // Ultra dark violet space background
  surface: 'rgba(255, 255, 255, 0.03)', // Transparent glass base
  surfaceBorder: 'rgba(255, 255, 255, 0.08)',
  primary: '#7C3AED',           // Neon Indigo/Purple
  primaryGradient: ['#7C3AED', '#5B21B6'],
  secondary: '#10B981',         // High-contrast Emerald Green
  accent: '#F43F5E',            // Neon Coral Red for issues/incidents
  textPrimary: '#F9FAFB',       // Crisp White
  textSecondary: '#9CA3AF',     // Slate Grey
  textMuted: '#6B7280',         // Dark Slate Grey
};

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  }
};

export const GlassStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  cardHighlight: {
    backgroundColor: 'rgba(124, 58, 237, 0.06)',
    borderColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginVertical: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 4,
  }
});
