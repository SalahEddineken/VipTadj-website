import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Deep obsidian blacks (Zara/Tom Ford editorial benchmark)
        obsidian: {
          50: '#F5F5F5',
          100: '#E5E5E5',
          200: '#CCCCCC',
          300: '#999999',
          400: '#666666',
          500: '#333333',
          600: '#262626',
          700: '#1C1C1C',
          800: '#141414',
          900: '#0E0E0E',
          950: '#080808', // Ultra-matte black canvas
        },
        // Charcoal aliases mapping to obsidian scale
        charcoal: {
          50: '#F5F5F5',
          100: '#E5E5E5',
          200: '#CCCCCC',
          300: '#999999',
          400: '#666666',
          500: '#333333',
          600: '#262626',
          700: '#1C1C1C',
          800: '#141414',
          900: '#0E0E0E',
          950: '#080808',
        },
        // Muted luxury gold & bronze accents (#D4AF37 / #C5A059)
        gold: {
          50: '#FAF7EE',
          100: '#F3ECDA',
          200: '#E6D7B2',
          300: '#D9C289',
          400: '#CBAD61',
          500: '#C5A059', // Primary luxury gold
          600: '#B08A42',
          700: '#8C6B2F',
          800: '#674D1F',
          900: '#433111',
          accent: '#D4AF37', // Pure metallic gold accent
          muted: '#B89B6A',
          hover: '#B38F46',
        },
        // Bronze aliases mapping to gold scale
        bronze: {
          50: '#FAF7EE',
          100: '#F3ECDA',
          200: '#E6D7B2',
          300: '#D9C289',
          400: '#CBAD61',
          500: '#C5A059',
          600: '#B08A42',
          700: '#8C6B2F',
          800: '#674D1F',
          900: '#433111',
        },
        // Warm ivory surfaces (#FAF8F5)
        ivory: {
          DEFAULT: '#FAF8F5',
          50: '#FFFFFF',
          100: '#FAF8F5',
          200: '#F5F2EB',
          300: '#ECE6DA',
          400: '#DFD7C7',
          500: '#CFC5B2',
        },
        // Sand & desert undertones
        sand: {
          50: '#FBF9F6',
          100: '#F5F0E8',
          200: '#EBE2D4',
          300: '#DDD0BE',
          400: '#C7B7A2',
          500: '#AF9D86',
          600: '#8F7D67',
          700: '#6E5F4D',
          800: '#4D4235',
          900: '#2F271E',
        },
      },
      fontFamily: {
        serif: ['Readex Pro', 'sans-serif'],
        sans: ['Readex Pro', 'sans-serif'],
        cinzel: ['Readex Pro', 'sans-serif'],
        arabic: ['Readex Pro', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        widest: '0.2em',
        'extra-wide': '0.3em',
      },
      boxShadow: {
        'luxury-subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'luxury-card': '0 10px 30px -5px rgba(0, 0, 0, 0.08)',
        'luxury-gold': '0 4px 25px -2px rgba(197, 160, 89, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'gold-shimmer': 'shimmer 2.5s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
