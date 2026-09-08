/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,less}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        primary: '#667eea',
        'primary-gradient': '#764ba2',
        success: '#07c160',
        info: '#1890ff',
        warning: '#fa8c16',
        danger: '#e64340',
      },
    },
  },
  plugins: [],
}
