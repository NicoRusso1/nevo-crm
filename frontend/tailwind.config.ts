import type { Config } from 'tailwindcss';

/**
 * Design tokens for neVo Sales CRM.
 *
 * Enterprise palette: steel surfaces + aggressive orange accent.
 * Heavier, more corporate than the Linear-style indigo it replaced —
 * the goal is "system used by closers all day", not "design tool".
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces (darkest → lightest)
        background: '#0B0D10',
        surface: '#14161A',
        'surface-elevated': '#1B1E24',
        'surface-hover': '#22262E',

        // Text
        foreground: '#EDEDED',
        muted: '#A7AAB3',
        'muted-foreground': '#6B7280',

        // Lines — solid (no translucent) for the heavier enterprise feel.
        line: '#2B3038',
        'line-strong': '#363C44',

        // Accent (aggressive orange for sales actions)
        accent: {
          DEFAULT: '#FF6A00',
          hover: '#FF8124',
          active: '#E85D00',
          muted: 'rgba(255, 106, 0, 0.12)',
        },

        // Status
        success: {
          DEFAULT: '#2FBF71',
          dark: '#1E8A50',
        },
        warning: {
          DEFAULT: '#F2C14E',
          soft: '#D6A72F',
        },
        danger: {
          DEFAULT: '#E5484D',
          dark: '#A83235',
        },
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
        '4xl': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        '3xl': ['1.875rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        '2xl': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
        elevated: '0 12px 32px -8px rgba(0, 0, 0, 0.6)',
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
