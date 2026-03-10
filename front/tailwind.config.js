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
          50: '#eef3ff',
          100: '#d9e5ff',
          200: '#b9ceff',
          300: '#8fafff',
          400: '#5d86f6',
          500: '#3d66dd',
          600: '#274fc3',
          700: '#163f91',
          800: '#12336f',
          900: '#102a59',
        },
        app: {
          bg: '#f3f4f8',
          surface: '#e9ebf3',
          'surface-strong': '#dde2ee',
          'surface-hover': '#d3d9e7',
          border: '#d7dcea',
          'border-strong': '#c8d0e0',
          text: '#1d2433',
          muted: '#6b7280',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
}
