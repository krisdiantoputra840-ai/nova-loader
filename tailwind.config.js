/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: 'var(--bg-base)',
          surface: 'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          DEFAULT: 'var(--border)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        accent: {
          DEFAULT: '#E07B39',
          hover: '#CB6E30',
          muted: 'rgba(224,123,57,0.12)',
          subtle: 'rgba(224,123,57,0.08)',
        },
        platform: {
          youtube: '#FF0000',
          tiktok: '#E8E8E8',
          instagram: '#E1306C',
          spotify: '#1DB954',
          ytmusic: '#FF0000',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'sm': '6px',
        'DEFAULT': '10px',
        'md': '12px',
        'lg': '14px',
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0,0,0,0.4)',
        'card': '0 2px 8px rgba(0,0,0,0.3)',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
      }
    },
  },
  plugins: [],
}
