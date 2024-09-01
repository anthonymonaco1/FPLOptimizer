/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      height: {
        '1/8': '12.5%',
        '7/8': '87.5%',
        '11/12': '91.666667%',
        '1/12': '8.333333%',
        '1/10': '10%'
      },
      width: {
        '3/8': '37.5%'
      },
      minWidth: {
        '1/4': '25%',
        '1/5': '20%'
      },
      maxWidth: {
        '1/4': '25%',
        '1/5': '20%',
        '1/3': '33%'
      },
      borderColor: {
        'silver': '#BFBFBF'
      }
    },
  },
  plugins: [],
}

