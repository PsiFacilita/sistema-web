/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#245B36',
          dark: '#1A4530'
        },
        danger: {
          DEFAULT: '#903A1D',  
          dark: '#7A2E16'      
        }
      }
    }
  },
  plugins: [],
}