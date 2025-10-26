import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/articles/**/*.md',
  ],
  // @ts-expect-error Tailwind 型定義が safelist を認識しない場合がある
  safelist: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'strong', 'em',
  ],
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
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
