/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/articles/**/*.md',
  ],
  corePlugins: {
    preflight: false, // これで base layer 無効化
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      colors: {
        brand: {
          light: '#FFDAB9',
          DEFAULT: '#FFA500',
          dark: '#FF8C00',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            h2: {
              fontSize: '2rem',         // 文字サイズ
              fontWeight: '600',        // 太さ
              color: '#1f2937',         // 文字色
              backgroundColor: '#f3f4f6', // 薄いグレー
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              marginTop: '1em',
              marginBottom: '1em',
            },
            p: { marginTop: '1em', marginBottom: '1em' },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

module.exports = config;
