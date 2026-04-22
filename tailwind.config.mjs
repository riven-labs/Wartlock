/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Segoe UI',
          'Roboto',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        // Base
        background: '#0A0A0A',
        foreground: '#FAFAFA',
        // Semantic
        primary: {
          DEFAULT: '#2F6FEB',
          foreground: '#FFFFFF',
          muted: '#1E56B5',
        },
        success: {
          DEFAULT: '#22C55E',
          foreground: '#FFFFFF',
        },
        warning: {
          DEFAULT: '#F59E0B',
          foreground: '#0A0A0A',
        },
        danger: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        // Riven surfaces
        'riven-bg': '#0A0A0A',
        'riven-surface': '#111113',
        'riven-surface-2': '#17171A',
        'riven-surface-3': '#1E1E22',
        'riven-border': 'rgba(255, 255, 255, 0.08)',
        'riven-border-strong': 'rgba(255, 255, 255, 0.16)',
        'riven-muted': '#8A8A8A',
        'riven-muted-soft': '#B4B4BA',
        'riven-accent': '#2F6FEB',
      },
      height: {
        page: 'calc(100vh - 150px)',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '8rem',
        },
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'scale-out': {
          from: { opacity: '1', transform: 'scale(1)' },
          to: { opacity: '0', transform: 'scale(0.96)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateX(100%)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'toast-out': {
          from: { opacity: '1', transform: 'translateX(0)' },
          to: { opacity: '0', transform: 'translateX(100%)' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'fade-out': 'fade-out 120ms ease-out',
        'scale-in': 'scale-in 150ms cubic-bezier(0.22, 0.61, 0.36, 1)',
        'scale-out': 'scale-out 120ms ease-out',
        'slide-up': 'slide-up 150ms ease-out',
        'slide-down': 'slide-down 150ms ease-out',
        'toast-in': 'toast-in 180ms cubic-bezier(0.22, 0.61, 0.36, 1)',
        'toast-out': 'toast-out 150ms ease-out',
        spin: 'spin 0.8s linear infinite',
      },
    },
  },

  plugins: [],
}
