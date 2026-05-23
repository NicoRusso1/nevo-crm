import type { Config } from 'tailwindcss';

/**
 * Design tokens for neVo.
 *
 * Inspired by Stripe and Linear: deep navy background, generous spacing,
 * very subtle borders (using rgba whites at low alpha rather than solid grays),
 * a single saturated accent for active/important states.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces (darkest → lightest)
        background: '#0B0F19',
        surface: '#0F1420',
        'surface-elevated': '#141A2A',
        'surface-hover': '#1A2236',

        // Text
        foreground: '#FAFAFA',
        muted: '#9CA3AF',
        'muted-foreground': '#6B7280',

        // Lines — use these via `border-line` etc.; intentionally translucent.
        line: 'rgba(255, 255, 255, 0.06)',
        'line-strong': 'rgba(255, 255, 255, 0.10)',

        // Accent (Linear-ish indigo/blue)
        accent: {
          DEFAULT: '#5B6CFF',
          hover: '#6E7EFF',
          muted: 'rgba(91, 108, 255, 0.12)',
        },

        // Status
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      fontSize: {
        // Tighter tracking on display sizes — Linear-style.
        '4xl': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        '3xl': ['1.875rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        '2xl': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
      },
      borderRadius: {
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        // Soft glow rather than hard drop shadows.
        card: '0 1px 0 0 rgba(255, 255, 255, 0.04) inset, 0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        elevated:
          '0 1px 0 0 rgba(255, 255, 255, 0.04) inset, 0 8px 24px -8px rgba(0, 0, 0, 0.5)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(2px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
