/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
         sage: {
          25: '#e1fde1ff',
          50: '#f7f8f7',
          100: '#eef1ee',
          200: '#d9e0d8',
          300: '#a8d3a2ff',
          400: '#7caf80ff',
          500: '#5f915fff',
          600: '#49754cff',
          700: '#3f6947ff',
          800: '#355c36ff',
          900: '#2c4d2dff',
        },
        primary: {
          50: '#f0f7f4',
          100: '#dcefe4',
          200: '#bce0cd',
          300: '#8dc993ff',
          400: '#5ead5aff',
          500: '#3a9169',
          600: '#2a7554',
          700: '#245B36',    
          800: '#1f4a2e',
          900: '#1A4530',    
        },
        danger: {
          50: '#fdf3f1',
          100: '#fbe5e0',
          200: '#f8d0c6',
          300: '#f1b09e',
          400: '#e88468',
          500: '#de6140',
          600: '#ca4a2c',
          700: '#903A1D',  
          800: '#7A2E16',    
          900: '#5a2311',
        }
      },
      backgroundImage: {
        'gradient-sage': 'linear-gradient(135deg, var(--tw-gradient-stops))',
      }
    }
  },
  plugins: [],
}