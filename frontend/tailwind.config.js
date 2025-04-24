module.exports = {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "./index.html"
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
    },
  },
  plugins: [],
}