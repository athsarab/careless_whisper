/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#060B14',
          card: '#0D1628',
          border: '#1A2942',
          accent: '#00F5FF',
          green: '#00FF9C',
          red: '#FF3366',
          purple: '#8B5CF6',
          orange: '#FF6B35',
          yellow: '#FFD700',
          muted: '#4A5568',
          text: '#CBD5E0',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 3s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #00F5FF, 0 0 10px #00F5FF' },
          '100%': { boxShadow: '0 0 20px #00F5FF, 0 0 40px #00F5FF' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'cyber': '0 0 20px rgba(0, 245, 255, 0.15)',
        'cyber-red': '0 0 20px rgba(255, 51, 102, 0.15)',
        'cyber-green': '0 0 20px rgba(0, 255, 156, 0.15)',
      },
    },
  },
  plugins: [],
}
