/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        secai: {
          purple:       '#6554F0',
          'purple-dark':'#4E3ED9',
          'purple-light':'#8273F5',
          indigo:       '#342D8C',
          lavender:     '#F0EDFF',
          bg:           '#F7F8FC',
          card:         '#FFFFFF',
          cyan:         '#66D9F5',
          green:        '#16B887',
          amber:        '#FFAD42',
          red:          '#F45D75',
          text:         '#18213D',
          muted:        '#77819D',
          border:       '#E7E9F3',
          'dark-bg':    '#0E1326',
          'dark-card':  '#151B38',
          'dark-border':'#262E54',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(101, 84, 240, 0.08), 0 2px 6px -1px rgba(24, 33, 61, 0.04)',
        'elevated': '0 10px 30px -4px rgba(101, 84, 240, 0.12), 0 4px 12px -2px rgba(24, 33, 61, 0.06)',
        'glow-purple': '0 0 25px rgba(101, 84, 240, 0.35)',
      }
    },
  },
  plugins: [],
}
