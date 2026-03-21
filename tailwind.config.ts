import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#08090d',
        surface: {
          DEFAULT: '#0f1117',
          2: '#161922',
          3: '#1e222e',
        },
        border: '#252a38',
        text: {
          primary: '#e4e8f2',
          secondary: '#949cb4',
          muted: '#636b84',
        },
        lime: {
          DEFAULT: '#bef264',
          400: '#bef264',
        },
        sky: {
          DEFAULT: '#38bdf8',
          400: '#38bdf8',
        },
        rose: {
          DEFAULT: '#fb7185',
          400: '#fb7185',
        },
        emerald: {
          DEFAULT: '#34d399',
          400: '#34d399',
        },
        amber: {
          DEFAULT: '#fbbf24',
          400: '#fbbf24',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
}

export default config
