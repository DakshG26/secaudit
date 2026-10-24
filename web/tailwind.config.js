/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:      '#2d8fc4',
        'primary-dark':'#1e6f9f',
        'primary-light':'#85c4eb',
        accent:       '#e8956f',
        'accent-dark':'#d97e54',
        background:   '#F9F9F9',
        surface:      '#FFFFFF',
        ink:          '#1A1A1A',
        muted:        '#6A6A6A',
        divider:      '#E0E0E0',
        deep:         '#0F1419',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        serif:   ['"Cormorant Garamond"', 'serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fade-in 0.4s ease-out',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
