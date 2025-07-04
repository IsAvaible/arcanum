import tailwindcssPrimeui from 'tailwindcss-primeui'
import tailwindScrollbar from 'tailwind-scrollbar'
import tailwindContainerQueries from '@tailwindcss/container-queries'

/** @type {import('tailwindcss').Config} */
export default {
  mode: 'jit',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'max-sm': { raw: '(max-width: 639px)' },
        'max-md': { raw: '(max-width: 767px)' },
        'max-lg': { raw: '(max-width: 1023px)' },
        'max-xl': { raw: '(max-width: 1279px)' },
        'max-2xl': { raw: '(max-width: 1535px)' },
        'sm-h': { raw: '(min-height: 640px)' },
        'md-h': { raw: '(min-height: 768px)' },
        'lg-h': { raw: '(min-height: 1024px)' },
        'xl-h': { raw: '(min-height: 1280px)' },
        '2xl-h': { raw: '(min-height: 1536px)' },
      },
      size: {
        0.75: '0.1875rem',
      },
      fontSize: {
        '2xs': ['0.625rem', '0.85rem'],
        '3xs': ['0.5rem', '0.75rem'],
      },
      maxHeight: {
        128: '32rem',
        xl: '36rem',
        '2xl': '42rem',
        '3xl': '48rem',
        '4xl': '54rem',
        '5xl': '60rem',
        '6xl': '66rem',
        '7xl': '72rem',
      },
    },
  },
  plugins: [tailwindcssPrimeui, tailwindScrollbar, tailwindContainerQueries],
}
