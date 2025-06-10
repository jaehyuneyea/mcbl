/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html",
       "./src/**/*.{js,ts,jsx,tsx}",],
  theme: {
    fontFamily: {
      sans: ['Poppins', 'sans-serif']
    },
    extend: {
      colors: {
        text:{
          primary: "#0C0C0CDE",
          primary_invert: "#FFFFFFDE",
          secondary: "#0C0C0C",
          secondary_invert: "#FFFFFF99",
          tertiary: "#0C0C0C61",
          tertiary_invert: "#FFFFFF61",
        },
        beige: '#EDE8D0',
        cookie: '#B3947B',
        light_green: '#BEEBC2',
        dark_green: '#034E0A'
      }
    },
  },
  plugins: [],
}

