import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FAFAFA',
        accent: {
          DEFAULT: '#E11D48', // Rose/Red - primary accent
          hover: '#BE123C',
        },
        border: {
          DEFAULT: '#000000',
        },
        // Supporting neutrals for the brutalist palette
        ink: '#000000',
        surface: '#FFFFFF',
      },
      borderWidth: {
        DEFAULT: '1px',
        3: '3px',
      },
      boxShadow: {
        // Classic Neo-Brutalist hard-edge "offset" shadow
        brutal: '4px 4px 0px 0px #000000',
        'brutal-sm': '2px 2px 0px 0px #000000',
        'brutal-lg': '8px 8px 0px 0px #000000',
        'brutal-red': '4px 4px 0px 0px #E11D48',
      },
      fontFamily: {
        // Bound to next/font variables set in app/layout.tsx — do not
        // hardcode font names here, or next/font's optimized loading
        // and fallback metrics get bypassed.
        display: ['var(--font-display)', 'Arial', 'sans-serif'],
        body: ['var(--font-body)', 'Helvetica', 'sans-serif'],
      },
      borderRadius: {
        // Neo-brutalism favors sharp corners; keep radii minimal/none
        none: '0px',
        brutal: '0px',
      },
    },
  },
  plugins: [],
};

export default config;
