/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Inside the Head Theme Colors
        'brand': {
          // Deep Red
          'deep-red': '#8E0D3C',
          'deep-red-hover': '#B01048',
          'deep-red-light': 'rgba(142, 13, 60, 0.1)',
          'deep-red-dark': '#6A0A2D',
          
          // Blackcurrant (Updated for better visibility)
          'blackcurrant': '#2D2652',
          'blackcurrant-light': '#4A3F7A',
          'blackcurrant-dark': '#1D1842',
          
          // Orange
          'orange': '#EF3B33',
          'orange-hover': '#FF4D44',
          'orange-light': 'rgba(239, 59, 51, 0.1)',
          'orange-dark': '#D42F27',
          
          // Rose Pink
          'rose-pink': '#FDA1A2',
          'rose-pink-hover': '#FEB5B6',
          'rose-pink-light': 'rgba(253, 161, 162, 0.2)',
          'rose-pink-dark': '#FC8D8E',
          
          // Neutral Colors
          'white': '#FFFFFF',
          'off-white': '#FFF8F9',
          'light-gray': '#F8F9FA',
          'gray': {
            DEFAULT: '#E9ECEF',
            50: '#F8F9FA',
            100: '#F1F3F5',
            200: '#E9ECEF',
            300: '#DEE2E6',
            400: '#CED4DA',
            500: '#ADB5BD',
            600: '#6C757D',
            700: '#495057',
            800: '#343A40',
            900: '#212529',
            'darker': '#1A1D20',
          },
          'medium-gray': '#6C757D',
          'dark-gray': '#343A40',
          'text-dark': '#2C3E50',
          'text-gray': '#495057',
        },
        
        // Legacy Spinny colors (mapped to new theme)
        'spinny': {
          'orange': '#EF3B33',
          'orange-hover': '#FF4D44',
          'orange-light': 'rgba(239, 59, 51, 0.1)',
          'orange-dark': '#D42F27',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #8E0D3C 0%, #4A3F7A 100%)',
        'gradient-warm': 'linear-gradient(135deg, #EF3B33 0%, #8E0D3C 100%)',
        'gradient-soft': 'linear-gradient(135deg, #FDA1A2 0%, #EF3B33 100%)',
        'gradient-dark': 'linear-gradient(135deg, #2D2652 0%, #1D1842 100%)',
      },
      boxShadow: {
        'red': '0 4px 20px rgba(142, 13, 60, 0.3)',
        'orange': '0 4px 20px rgba(239, 59, 51, 0.3)',
        'pink': '0 4px 20px rgba(253, 161, 162, 0.3)',
        'soft': '0 2px 8px rgba(29, 24, 66, 0.1)',
        'soft-lg': '0 8px 32px rgba(29, 24, 66, 0.2)',
      },
      borderRadius: {
        'spinny-sm': '8px',
        'spinny-md': '12px',
        'spinny-lg': '16px',
      }
    },
  },
  plugins: [],
}

