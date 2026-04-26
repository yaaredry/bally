/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sand:        '#f6f1e8',
        'sand-deep': '#ede4d2',
        cream:       '#fbf7ef',
        hairline:    'rgba(31,26,20,0.08)',
        ink: {
          DEFAULT: '#1f1a14',
          70: 'rgba(31,26,20,0.70)',
          55: 'rgba(31,26,20,0.55)',
          35: 'rgba(31,26,20,0.35)',
          15: 'rgba(31,26,20,0.15)',
        },
        coral: {
          DEFAULT: '#e87a4a',
          deep:    '#c8425a',
          soft:    '#fbe2d2',
        },
        ocean: {
          DEFAULT: '#3d6f7c',
          soft:    '#dfe9ec',
        },
        success: '#5e8c4f',
        warn:    '#c98a2a',
        danger:  '#c8425a',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Inter"', '"Helvetica Neue"', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '22px',
        '4xl': '28px',
      },
      boxShadow: {
        s1: '0 1px 2px rgba(31,26,20,0.04), 0 1px 6px rgba(31,26,20,0.04)',
        s2: '0 6px 24px rgba(31,26,20,0.06), 0 1px 2px rgba(31,26,20,0.04)',
        s3: '0 20px 60px rgba(31,26,20,0.16), 0 4px 12px rgba(31,26,20,0.06)',
        coral: '0 8px 22px rgba(216,89,59,0.32)',
      },
    },
  },
  plugins: [],
};
