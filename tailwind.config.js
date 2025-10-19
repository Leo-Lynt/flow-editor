/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Background colors with proper semantic naming
        'flow': {
          'bg': '#f9fafb',
          'bg-dark': '#0f172a',
          'surface': '#ffffff',
          'surface-dark': '#1e293b',
          'surface-hover': '#f3f4f6',
          'surface-hover-dark': '#334155',
          'border': '#e5e7eb',
          'border-dark': '#475569',
          'border-hover': '#d1d5db',
          'border-hover-dark': '#64748b',
          'text': '#111827',
          'text-dark': '#f8fafc',
          'text-secondary': '#374151',
          'text-secondary-dark': '#cbd5e1',
          'text-muted': '#6b7280',
          'text-muted-dark': '#94a3af'
        },

        // Brand colors
        'primary': {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        'accent': '#0ea5e9',
        'success': '#10b981',
        'warning': '#f59e0b',
        'error': '#ef4444',

        // Node specific colors
        'node': {
          'connector': '#3b82f6',
          'math': '#8b5cf6',
          'processor': '#06b6d4',
          'extractor': '#10b981',
          'output': '#6b7280',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
        mono: ['Monaco', 'Menlo', 'monospace']
      },
      fontSize: {
        '11': '11px',
        '13': '13px',
      },
      boxShadow: {
        'focus': '0 0 0 3px rgba(99, 102, 241, 0.1)',
        'focus-2': '0 0 0 2px rgba(99, 102, 241, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
      spacing: {
        '70': '280px',
      }
    },
  },
  plugins: [],
}