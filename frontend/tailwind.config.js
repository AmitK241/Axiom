/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#534AB7',
          'purple-light': '#7F77DD',
          'purple-dark': '#3C3489',
          teal: '#1D9E75',
          'teal-light': '#5DCAA5',
          coral: '#D85A30',
          'coral-light': '#F0997B',
        },
        surface: {
          900: '#0D0D0F',
          800: '#111114',
          700: '#16161A',
          600: '#1C1C22',
          500: '#242430',
          400: '#2E2E3E',
          300: '#3D3D52',
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    }
  },
  plugins: []
}
