// ==============================================================
// RESOURCES
const colors = require('tailwindcss/colors')

// MODULE
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // NEXT 12
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    // NEXT 13
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './ui/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // or 'media' or 'class'
  important: false,
  corePlugins: {
    preflight: false,
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      // extend: {
      /**
       *  added the default spacing values to max width
       * @param theme
       */
      maxWidth: (theme) => ({
        ...theme('spacing'),
      }),
      minWidth: (theme) => ({
        ...theme('spacing'),
      }),
      backgroundColor: ['group-focus'],
      borderWidth: {
        1: '1px',
      },
      // },
      // https://vercel.com/design/color
      colors: {
        gray: colors.zinc,
        'gray-1000': 'rgb(17,17,19)',
        'gray-1100': 'rgb(10,10,11)',
        vercel: {
          pink: '#FF0080',
          blue: '#0070F3',
          cyan: '#50E3C2',
          orange: '#F5A623',
          violet: '#7928CA',
        },
      },
      backgroundImage: ({ theme }) => ({
        'vc-border-gradient': `radial-gradient(at left top, ${theme('colors.gray.500')}, 50px, ${theme(
          'colors.gray.800'
        )} 50%)`,
      }),
      keyframes: ({ theme }) => ({
        rerender: {
          '0%': {
            ['border-color']: theme('colors.vercel.pink'),
          },
          '40%': {
            ['border-color']: theme('colors.vercel.pink'),
          },
        },
        highlight: {
          '0%': {
            background: theme('colors.vercel.pink'),
            color: theme('colors.white'),
          },
          '40%': {
            background: theme('colors.vercel.pink'),
            color: theme('colors.white'),
          },
        },
        shimmer: {
          '100%': {
            transform: 'translateX(100%)',
          },
        },
        translateXReset: {
          '100%': {
            transform: 'translateX(0)',
          },
        },
        fadeToTransparent: {
          '0%': {
            opacity: 1,
          },
          '40%': {
            opacity: 1,
          },
          '100%': {
            opacity: 0,
          },
        },
      }),
    },
  },
  variants: {
    extend: {
      // ...
      borderWidth: ['hover', 'focus'],
    },
  },
  // plugins: [require('daisyui')],
  // plugins: [],
  plugins: [require('@tailwindcss/forms')],
  daisyui: {
    darkTheme: 'business',
    themes: ['light', 'luxury', 'business', 'haloween'],
    prefix: 'daisy',
  },
}
