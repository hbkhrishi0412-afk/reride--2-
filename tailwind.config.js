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
        // ONLY 4 Brand Colors - User Palette
        'brand': {
          // Cream
          'cream': '#FAF8F1',
          'cream-hover': '#FCFAF6',
          'cream-light': 'rgba(250, 248, 241, 0.5)',
          'cream-dark': '#F5F3EB',
          
          // Gold
          'gold': '#FAEAB1',
          'gold-hover': '#FBF0C8',
          'gold-light': 'rgba(250, 234, 177, 0.3)',
          'gold-dark': '#F5DF8D',
          
          // Teal
          'teal': '#34656D',
          'teal-hover': '#4A7C85',
          'teal-light': 'rgba(52, 101, 109, 0.1)',
          'teal-dark': '#2A5159',
          
          // Slate
          'slate': '#334443',
          'slate-hover': '#4A5E5C',
          'slate-light': 'rgba(51, 68, 67, 0.1)',
          'slate-dark': '#1F2928',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #34656D 0%, #4A7C85 100%)',
        'gradient-warm': 'linear-gradient(135deg, #FAEAB1 0%, #34656D 100%)',
        'gradient-soft': 'linear-gradient(135deg, #FAF8F1 0%, #FAEAB1 100%)',
        'gradient-dark': 'linear-gradient(135deg, #334443 0%, #1F2928 100%)',
      },
      boxShadow: {
        'teal': '0 4px 20px rgba(52, 101, 109, 0.25)',
        'gold': '0 4px 20px rgba(250, 234, 177, 0.4)',
        'slate': '0 4px 20px rgba(51, 68, 67, 0.2)',
        'soft': '0 2px 8px rgba(51, 68, 67, 0.1)',
        'soft-lg': '0 8px 32px rgba(51, 68, 67, 0.15)',
      },
      borderRadius: {
        'brand-sm': '8px',
        'brand-md': '12px',
        'brand-lg': '16px',
      }
    },
  },
  plugins: [],
}
