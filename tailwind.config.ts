import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Figma Brand Colors
      colors: {
        // Additional brand colors from Figma
        brand: {
          cream: '#f5f5e7', // Logo/white text from Figma
          'dark-green': {
            50: '#e6e9e8',
            100: '#b5beb9',
            200: '#9ca8a2',
            300: '#83928b',
            400: '#6b7c74',
            500: '#52665d',
            600: '#395145',
            700: '#213b2e',
            800: '#082517',
          },
          'lighter-green': {
            50: '#dae8db',
            100: '#c7ddc9',
            200: '#b5d2b7',
            300: '#a3c7a5',
            400: '#90bb93',
            500: '#7eb081',
            600: '#6ba56f',
            700: '#59995d',
            800: '#468e4b',
          },
          'lightest-green': {
            50: '#e6f0dc',
            100: '#d9e8cb',
            200: '#cde0ba',
            300: '#c0d8a8',
            400: '#b3d197',
            500: '#a7c98c',
            600: '#9ac175',
            700: '#8eba63',
            800: '#81b252',
          },
          blue: {
            50: '#e2eefb',
            100: '#d3e5f9',
            200: '#c5dcf7',
            300: '#b6d4f5',
            400: '#a8cbf3',
            500: '#99c2f1',
            600: '#8bbaef',
            700: '#7cb1ed',
            800: '#6ea9eb',
          },
        },
        // Semantic colors mapped to brand colors
        primary: {
          50: '#dae8db',
          100: '#c7ddc9',
          200: '#b5d2b7',
          300: '#a3c7a5',
          400: '#90bb93',
          500: '#7eb081',
          600: '#6ba56f',
          700: '#59995d',
          800: '#468e4b',
          DEFAULT: '#7eb081',
          foreground: '#ffffff',
        },
        secondary: {
          50: '#e6e9e8',
          100: '#b5beb9',
          200: '#9ca8a2',
          300: '#83928b',
          400: '#6b7c74',
          500: '#52665d',
          600: '#395145',
          700: '#213b2e',
          800: '#082517',
          DEFAULT: '#52665d',
          foreground: '#ffffff',
        },
        neutral: {
          50: '#e6e9e8',
          100: '#b5beb9',
          200: '#9ca8a2',
          300: '#83928b',
          400: '#6b7c74',
          500: '#52665d',
          600: '#395145',
          700: '#213b2e',
          800: '#082517',
        },
        information: {
          50: '#e2eefb',
          100: '#d3e5f9',
          200: '#c5dcf7',
          300: '#b6d4f5',
          400: '#a8cbf3',
          500: '#99c2f1',
          600: '#8bbaef',
          700: '#7cb1ed',
          800: '#6ea9eb',
          DEFAULT: '#99c2f1',
        },
        // Additional Figma semantic colors
        success: {
          DEFAULT: '#8eba63', // Icons/success from Figma
          foreground: '#ffffff',
        },
        error: {
          DEFAULT: '#a31b1b', // Text/error from Figma
          foreground: '#ffffff',
        },
        disabled: {
          DEFAULT: '#6b7c74', // Text/disabled from Figma
          surface: '#e6e9e8', // Surface/disabled from Figma
          border: '#b5beb9', // Border/disabled from Figma
        },
        // Legacy shadcn/ui colors for compatibility
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      // Typography from Figma tokens
      fontFamily: {
        'display': ['Lato', 'serif'], // For headings and semibold text from Figma
        'body': ['Lato', 'system-ui', 'sans-serif'], // For body text
        'sans': ['Lato', 'system-ui', 'sans-serif'], // Default sans
      },
      fontSize: {
        // Figma heading sizes
        'display-1': ['44px', { lineHeight: '44px', letterSpacing: '0px' }],
        'display-2': ['40px', { lineHeight: '40px', letterSpacing: '0px' }],
        'display-3': ['33px', { lineHeight: '27px', letterSpacing: '0px' }],
        'display-4': ['27px', { lineHeight: '27px', letterSpacing: '0px' }],
        'display-5': ['23px', { lineHeight: '23px', letterSpacing: '0px' }],
        'display-6': ['19px', { lineHeight: '19px', letterSpacing: '0px' }],
        // Body text sizes matching Figma
        'body-xs': ['11px', { lineHeight: '16px' }],
        'body-sm': ['14px', { lineHeight: '20px' }],
        'body-base': ['16px', { lineHeight: '12.8px' }], // Updated to match Figma line height
        'body-lg': ['18px', { lineHeight: '28px' }],
      },
      fontWeight: {
        'regular': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      // Figma spacing scale
      spacing: {
        '0': '0px',
        '0.25': '1px',
        '0.5': '2px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        // Extended spacing for larger layouts
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      borderRadius: {
        'none': '0px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        'full': '9999px',
        // Legacy shadcn/ui compatibility
        'legacy-lg': "var(--radius)",
        'legacy-md': "calc(var(--radius) - 2px)",
        'legacy-sm': "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
