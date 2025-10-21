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
        // Premium App Theme - Modern & Vibrant
        'app': {
          'primary': '#FF6B35',
          'primary-dark': '#E85A2B',
          'primary-light': '#FF8555',
          'secondary': '#6366F1',
          'secondary-light': '#818CF8',
          'secondary-dark': '#4F46E5',
          'accent-pink': '#EC4899',
          'accent-cyan': '#06B6D4',
          'accent-green': '#10B981',
        },
        
        // Spinny-Inspired Theme - Updated with Premium Colors
        'spinny': {
          // Primary Orange (Main Brand Color)
          'orange': '#FF6B35',
          'orange-hover': '#FF8555',
          'orange-light': 'rgba(255, 107, 53, 0.12)',
          'orange-dark': '#E85A2B',
          
          // Secondary Purple/Blue (Trust & Info)
          'blue': '#6366F1',
          'blue-hover': '#818CF8',
          'blue-light': 'rgba(99, 102, 241, 0.12)',
          'blue-dark': '#4F46E5',
          
          // Neutral Colors - Clean & Modern
          'white': '#FFFFFF',
          'off-white': '#FAFAFA',
          'light-gray': '#F5F5F5',
          'gray': '#E0E0E0',
          'medium-gray': '#9E9E9E',
          'dark-gray': '#616161',
          
          // Text Colors - High Contrast
          'text': {
            DEFAULT: '#2C2C2C',
            dark: '#1A1A1A',
            medium: '#616161',
            light: '#9E9E9E',
          },
          
          // Status Colors
          'success': '#4CAF50',
          'warning': '#FFC107',
          'error': '#F44336',
          'info': '#1E88E5',
        },
        
        // Backward compatibility aliases
        'brand': {
          'orange': '#2563EB',
          'orange-hover': '#3B82F6',
          'orange-light': 'rgba(37, 99, 235, 0.1)',
          'white': '#FFFFFF',
          'text': {
            DEFAULT: '#2C2C2C',
            dark: '#1A1A1A',
          },
          'gray': {
            50: '#FAFAFA',
            100: '#F5F5F5',
            200: '#E0E0E0',
            300: '#BDBDBD',
            400: '#9E9E9E',
            500: '#757575',
            600: '#616161',
            700: '#424242',
            800: '#2C2C2C',
            900: '#1A1A1A',
          },
        },
      },
      backgroundImage: {
        'gradient-orange': 'linear-gradient(135deg, #FF6B35 0%, #FF8555 100%)',
        'gradient-hero': 'linear-gradient(135deg, #FF6B35 0%, #6366F1 100%)',
        'gradient-subtle': 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
        'gradient-primary': 'linear-gradient(135deg, #FF6B35 0%, #FF8555 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
        'gradient-warm': 'linear-gradient(135deg, #FF6B35 0%, #EC4899 100%)',
        'gradient-cool': 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
      },
      boxShadow: {
        'spinny': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'spinny-md': '0 4px 16px rgba(0, 0, 0, 0.1)',
        'spinny-lg': '0 8px 32px rgba(0, 0, 0, 0.15)',
        'orange': '0 8px 24px rgba(255, 107, 53, 0.3)',
        'blue': '0 8px 24px rgba(99, 102, 241, 0.3)',
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'spinny-sm': '6px',
        'spinny-md': '8px',
        'spinny-lg': '12px',
        'spinny-xl': '16px',
        'brand-sm': '6px',
        'brand-md': '8px',
        'brand-lg': '12px',
      },
      fontFamily: {
        sans: ['Nunito Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
