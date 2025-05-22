import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],

	safelist: [
		'data-[state=checked]:bg-blue-700',
		'data-[state=checked]:border-blue-700',
		'data-[state=checked]:text-white',
		'data-[state=checked]:bg-white',
		'data-[state=checked]:bg-blue-600',
		'data-[state=unchecked]:bg-white',
		'data-[state=unchecked]:border-gray-300',
		'data-[state=unchecked]:text-transparent',
		'peer-data-[state=checked]:bg-white',
		'data-[state=open]',
		'data-[state=closed]',
		'data-[side=bottom]',
		'data-[side=top]',
		'data-[side=left]',
		'data-[side=right]',
		'slide-in-from-top-2',
		'slide-in-from-bottom-2',
		'slide-in-from-left-2',
		'slide-in-from-right-2',
		'fade-in-0',
		'fade-out-0',
		'zoom-in-95',
		'zoom-out-95',
		'animate-in',
		'animate-out'
	],

	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// Updated color scheme to standardize on blue-700
				hrflow: {
					'primary': '#1d4ED8', // Updated to blue-700
					'secondary': '#3b82f6', // blue-500
					'blue': '#1d4ED8', // Same as primary
					'accent': '#FF64DA',
					'dark': '#2D2B55',
					'light': '#F8F7FF',
					'gray': '#A0A0B0',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			boxShadow: {
				'sm': '0 4px 8px rgba(0,0,0,0.05)',
				DEFAULT: '0 6px 16px rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.04)',
				'md': '0 12px 24px -4px rgba(0,0,0,0.12), 0 6px 12px -6px rgba(0,0,0,0.08)',
				'lg': '0 20px 32px -8px rgba(0,0,0,0.16), 0 10px 16px -8px rgba(0,0,0,0.08)',
				'xl': '0 24px 48px -12px rgba(0,0,0,0.24)',
				'2xl': '0 32px 64px -16px rgba(0,0,0,0.32)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'fade-in-up': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'pulse-subtle': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.85' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'spin-slow': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.6s ease-out',
				'fade-in-up': 'fade-in-up 0.6s ease-out',
				'slide-in-right': 'slide-in-right 0.5s ease-out',
				'pulse-subtle': 'pulse-subtle 3s infinite ease-in-out',
				'float': 'float 6s infinite ease-in-out',
				'spin-slow': 'spin-slow 10s linear infinite'
			},
			fontFamily: {
				'sans': ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				'display': ['Montserrat', 'sans-serif'],
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'hero-pattern': 'linear-gradient(to right bottom, rgba(255, 255, 255, 0.9), rgba(29, 78, 216, 0.05))',
				'card-pattern': 'linear-gradient(to right bottom, rgba(255, 255, 255, 1), rgba(248, 247, 255, 1))',
				'cta-pattern': 'linear-gradient(to right, #1d4ED8, #3b82f6, #93C5FD)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
