import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IRANSansX', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          green:  { DEFAULT: '#10B981', light: '#D1FAE5', dark: '#065F46' },
          blue:   { DEFAULT: '#3B82F6', light: '#DBEAFE', dark: '#1E3A8A' },
          amber:  { DEFAULT: '#F59E0B', light: '#FEF3C7', dark: '#92400E' },
          purple: { DEFAULT: '#8B5CF6', light: '#EDE9FE', dark: '#5B21B6' },
          red:    { DEFAULT: '#EF4444', light: '#FEE2E2', dark: '#991B1B' },
        },
        surface: {
          primary:   'var(--surface-primary)',
          secondary: 'var(--surface-secondary)',
          tertiary:  'var(--surface-tertiary)',
          card:      'var(--surface-card)',
        },
        content: {
          primary:   'var(--content-primary)',
          secondary: 'var(--content-secondary)',
          tertiary:  'var(--content-tertiary)',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
}

export default config
