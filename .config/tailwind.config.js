/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  safelist: [
    // Gradient classes for meal types
    'bg-gradient-to-br',
    'from-[#fde68a]',
    'to-[#fbcf5d]',
    'from-[#7dd3fc]',
    'to-[#5eead4]',
    'from-[#6ee7b7]',
    'to-[#a7f3d0]',
    'from-[#e879f9]',
    'to-[#fda4af]',
    // Additional safelist for dynamic classes
    'gradient-meal-breakfast',
    'gradient-meal-lunch',
    'gradient-meal-snack',
    'gradient-meal-dinner',
  ],
  theme: {
  	extend: {
  		colors: {
  			glass: {
  				'surface-light': 'rgba(255, 255, 255, 0.65)',
  				'surface-dark': 'rgba(24, 24, 27, 0.55)',
  				primary: {
  					light: 'rgba(255, 255, 255, 0.15)',
  					DEFAULT: 'rgba(255, 255, 255, 0.08)',
  					dark: 'rgba(255, 255, 255, 0.05)'
  				},
  				secondary: {
  					light: 'rgba(255, 255, 255, 0.25)',
  					DEFAULT: 'rgba(255, 255, 255, 0.12)',
  					dark: 'rgba(255, 255, 255, 0.08)'
  				},
  				interactive: {
  					light: 'rgba(255, 255, 255, 0.35)',
  					DEFAULT: 'rgba(255, 255, 255, 0.18)',
  					dark: 'rgba(255, 255, 255, 0.12)'
  				},
  				border: {
  					light: 'rgba(255, 255, 255, 0.3)',
  					DEFAULT: 'rgba(255, 255, 255, 0.15)',
  					dark: 'rgba(255, 255, 255, 0.1)'
  				},
  				ultralight: 'rgba(255, 255, 255, 0.03)',
  				feather: 'rgba(255, 255, 255, 0.05)',
  				soft: 'rgba(255, 255, 255, 0.12)',
  				subtle: 'rgba(255, 255, 255, 0.08)',
  				medium: 'rgba(255, 255, 255, 0.16)',
  				heavy: 'rgba(255, 255, 255, 0.20)',
  				strong: 'rgba(255, 255, 255, 0.9)',
  				ultra: 'rgba(255, 255, 255, 0.25)',
  				solid: 'rgba(255, 255, 255, 0.30)'
  			},
  			liquid: {
  				sunrise: {
  					from: '#FF6B6B',
  					via: '#FFE66D',
  					to: '#4ECDC4'
  				},
  				aurora: {
  					from: '#667EEA',
  					via: '#764BA2',
  					to: '#F093FB'
  				},
  				ocean: {
  					from: '#2E3192',
  					to: '#1BFFFF'
  				},
  				forest: {
  					from: '#11998E',
  					to: '#38EF7D'
  				},
  				sunset: {
  					from: '#FC466B',
  					to: '#3F5EFB'
  				}
  			},
  			food: {
  				fresh: {
  					'50': '#f0fdf4',
  					'100': '#dcfce7',
  					'200': '#bbf7d0',
  					'300': '#86efac',
  					'400': '#4ade80',
  					'500': '#22c55e',
  					'600': '#16a34a',
  					'700': '#15803d',
  					'800': '#166534',
  					'900': '#14532d',
  					DEFAULT: '#22c55e',
  					dark: '#15803d'
  				},
  				warm: {
  					'50': '#fff7ed',
  					'100': '#ffedd5',
  					'200': '#fed7aa',
  					'300': '#fdba74',
  					'400': '#fb923c',
  					'500': '#f97316',
  					'600': '#ea580c',
  					'700': '#c2410c',
  					'800': '#9a3412',
  					'900': '#7c2d12',
  					DEFAULT: '#f97316',
  					dark: '#c2410c'
  				},
  				rich: {
  					'50': '#faf5ff',
  					'100': '#f3e8ff',
  					'200': '#e9d5ff',
  					'300': '#d8b4fe',
  					'400': '#c084fc',
  					'500': '#a855f7',
  					'600': '#9333ea',
  					'700': '#7c3aed',
  					'800': '#6b21a8',
  					'900': '#581c87',
  					DEFAULT: '#a855f7',
  					dark: '#7c3aed'
  				},
  				golden: {
  					'50': '#fffbeb',
  					'100': '#fef3c7',
  					'200': '#fde68a',
  					'300': '#fcd34d',
  					'400': '#fbbf24',
  					'500': '#f59e0b',
  					'600': '#d97706',
  					'700': '#b45309',
  					'800': '#92400e',
  					'900': '#78350f'
  				}
  			},
  			meal: {
  				desayuno: {
  					light: '#fbbf24', // amber-400
  					DEFAULT: '#f59e0b', // amber-500
  					dark: '#d97706' // amber-600
  				},
  				almuerzo: {
  					light: '#38bdf8', // sky-400
  					DEFAULT: '#0ea5e9', // sky-500
  					dark: '#0284c7' // sky-600
  				},
  				cena: {
  					light: '#4ade80', // green-400
  					DEFAULT: '#22c55e', // green-500
  					dark: '#16a34a' // green-600
  				},
  				snack: {
  					light: '#f472b6', // pink-400
  					DEFAULT: '#ec4899', // pink-500
  					dark: '#db2777' // pink-600
  				}
  			},
  			neutral: {
  				'50': '#fafafa',
  				'100': '#f5f5f5',
  				'200': '#e5e5e5',
  				'300': '#d4d4d4',
  				'400': '#a3a3a3',
  				'500': '#737373',
  				'600': '#525252',
  				'700': '#404040',
  				'800': '#262626',
  				'900': '#171717',
  				'950': '#0a0a0a'
  			},
  			success: {
  				'50': '#f0fdf4',
  				'500': '#22c55e',
  				'600': '#16a34a',
  				'700': '#15803d'
  			},
  			warning: {
  				'50': '#fffbeb',
  				'500': '#f59e0b',
  				'600': '#d97706',
  				'700': '#b45309'
  			},
  			error: {
  				'50': '#fef2f2',
  				'500': '#ef4444',
  				'600': '#dc2626',
  				'700': '#b91c1c',
  				DEFAULT: '#ef4444'
  			},
  			info: {
  				'50': '#eff6ff',
  				'500': '#3b82f6',
  				'600': '#2563eb',
  				'700': '#1d4ed8'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			],
  			display: [
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		fontSize: {
  			'2xs': [
  				'0.625rem',
  				{
  					lineHeight: '0.75rem'
  				}
  			],
  			xs: [
  				'0.75rem',
  				{
  					lineHeight: '1rem'
  				}
  			],
  			sm: [
  				'0.875rem',
  				{
  					lineHeight: '1.25rem'
  				}
  			],
  			base: [
  				'1rem',
  				{
  					lineHeight: '1.5rem'
  				}
  			],
  			lg: [
  				'1.125rem',
  				{
  					lineHeight: '1.75rem'
  				}
  			],
  			xl: [
  				'1.25rem',
  				{
  					lineHeight: '1.75rem'
  				}
  			],
  			'2xl': [
  				'1.5rem',
  				{
  					lineHeight: '2rem'
  				}
  			],
  			'3xl': [
  				'1.875rem',
  				{
  					lineHeight: '2.25rem'
  				}
  			],
  			'4xl': [
  				'2.25rem',
  				{
  					lineHeight: '2.5rem'
  				}
  			],
  			'5xl': [
  				'3rem',
  				{
  					lineHeight: '1'
  				}
  			],
  			'6xl': [
  				'3.75rem',
  				{
  					lineHeight: '1'
  				}
  			],
  			'7xl': [
  				'4.5rem',
  				{
  					lineHeight: '1'
  				}
  			]
  		},
  		spacing: {
  			'18': '4.5rem',
  			'88': '22rem',
  			'112': '28rem',
  			'128': '32rem'
  		},
  		borderRadius: {
  			'4xl': '2rem',
  			'5xl': '2.5rem'
  		},
  		backdropBlur: {
  			xs: '2px',
  			sm: '8px',
  			md: '12px',
  			lg: '14px',
  			'4xl': '72px',
  			'0': '0px',
  			'1': '1px',
  			'2': '2px',
  			'3': '3px',
  			'4': '4px',
  			'5': '5px',
  			'6': '6px',
  			'7': '7px',
  			'8': '8px',
  			'9': '9px',
  			'10': '10px',
  			'11': '11px',
  			'12': '12px',
  			'13': '13px',
  			'14': '14px',
  			'15': '15px',
  			'16': '16px',
  			'17': '17px',
  			'18': '18px',
  			'19': '19px',
  			'20': '20px'
  		},
  		boxShadow: {
  			'glass-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
  			glass: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
  			'glass-md': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
  			'glass-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
  			'glass-xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
  			'glow-sm': '0 0 8px rgba(34, 197, 94, 0.3)',
  			glow: '0 0 16px rgba(34, 197, 94, 0.4)',
  			'glow-lg': '0 0 24px rgba(34, 197, 94, 0.5)'
  		},
  		animation: {
  			'zoom-in-card': 'zoomInCard 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
  			'glass-hover-pulse': 'glassHoverPulse 2s ease-in-out infinite',
  			'slide-week': 'slideWeek 0.3s ease-out',
  			'fade-in': 'fadeIn 0.5s ease-in-out',
  			'slide-up': 'slideUp 0.3s ease-out',
  			'slide-down': 'slideDown 0.3s ease-out',
  			'slide-in-left': 'slideInLeft 0.3s ease-out',
  			'slide-in-right': 'slideInRight 0.3s ease-out',
  			'scale-in': 'scaleIn 0.2s ease-out',
  			'bounce-gentle': 'bounceGentle 2s infinite',
  			float: 'float 3s ease-in-out infinite',
  			'pulse-glow': 'pulseGlow 2s ease-in-out infinite alternate',
  			shimmer: 'shimmer 1.5s infinite',
  			'spin-slow': 'spin 3s linear infinite',
  			'gradient-x': 'gradientX 6s ease infinite',
  			'gradient-y': 'gradientY 6s ease infinite',
  			'gradient-xy': 'gradientXY 6s ease infinite',
  			'text-shimmer': 'textShimmer 3s ease-in-out infinite',
  			'bounce-soft': 'bounceSoft 1s ease-in-out infinite',
  			wiggle: 'wiggle 1s ease-in-out infinite',
  			heartbeat: 'heartbeat 1.5s ease-in-out infinite',
  			'liquid-morph': 'liquidMorph 8s ease-in-out infinite',
  			'liquid-wave': 'liquidWave 4s ease-in-out infinite',
  			'liquid-ripple': 'liquidRipple 1s ease-out',
  			'liquid-glow': 'liquidGlow 2s ease-in-out infinite',
  			'liquid-shimmer': 'liquidShimmer 3s linear infinite',
  			'refraction-shift': 'refractionShift 20s ease-in-out infinite',
  			'glass-breathe': 'glassBreathe 3s ease-in-out infinite',
  			'glass-float': 'glassFloat 6s ease-in-out infinite',
  			'gradient-flow': 'gradientFlow 15s ease infinite',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in-up': 'fadeInUp 0.5s ease-out',
  			'slide-x': 'slideX 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  			'scale-in': 'scaleIn 0.2s ease-out',
  			'scale-out': 'scaleOut 0.2s ease-in',
  			'fade-in-up': 'fadeInUp 0.5s ease-out',
  			'slide-x-week': 'slideXWeek 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  			'glass-hover': 'glassHover 0.3s ease-out'
  		},
  		keyframes: {
  			zoomInCard: {
  				'0%': {
  					opacity: '0',
  					transform: 'scale(0.9)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'scale(1)'
  				}
  			},
  			glassHoverPulse: {
  				'0%': {
  					boxShadow: '0 4px 24px rgba(0,0,0,.05)'
  				},
  				'50%': {
  					boxShadow: '0 4px 32px rgba(0,0,0,.08)'
  				},
  				'100%': {
  					boxShadow: '0 4px 24px rgba(0,0,0,.05)'
  				}
  			},
  			slideWeek: {
  				'0%': {
  					transform: 'translateX(100%)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateX(0)',
  					opacity: '1'
  				}
  			},
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			slideUp: {
  				'0%': {
  					transform: 'translateY(10px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			slideDown: {
  				'0%': {
  					transform: 'translateY(-10px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			slideInLeft: {
  				'0%': {
  					transform: 'translateX(-10px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateX(0)',
  					opacity: '1'
  				}
  			},
  			slideInRight: {
  				'0%': {
  					transform: 'translateX(10px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateX(0)',
  					opacity: '1'
  				}
  			},
  			scaleIn: {
  				'0%': {
  					transform: 'scale(0.95)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			bounceGentle: {
  				'0%, 100%': {
  					transform: 'translateY(0)'
  				},
  				'50%': {
  					transform: 'translateY(-4px)'
  				}
  			},
  			float: {
  				'0%, 100%': {
  					transform: 'translateY(0px)'
  				},
  				'50%': {
  					transform: 'translateY(-8px)'
  				}
  			},
  			pulseGlow: {
  				'0%': {
  					boxShadow: '0 0 8px rgba(34, 197, 94, 0.3)'
  				},
  				'100%': {
  					boxShadow: '0 0 24px rgba(34, 197, 94, 0.6)'
  				}
  			},
  			shimmer: {
  				'0%': {
  					transform: 'translateX(-100%)'
  				},
  				'100%': {
  					transform: 'translateX(100%)'
  				}
  			},
  			gradientX: {
  				'0%, 100%': {
  					transform: 'translateX(0%)'
  				},
  				'50%': {
  					transform: 'translateX(100%)'
  				}
  			},
  			gradientY: {
  				'0%, 100%': {
  					transform: 'translateY(0%)'
  				},
  				'50%': {
  					transform: 'translateY(100%)'
  				}
  			},
  			gradientXY: {
  				'0%, 100%': {
  					transform: 'translate(0%, 0%)'
  				},
  				'25%': {
  					transform: 'translate(100%, 0%)'
  				},
  				'50%': {
  					transform: 'translate(100%, 100%)'
  				},
  				'75%': {
  					transform: 'translate(0%, 100%)'
  				}
  			},
  			textShimmer: {
  				'0%': {
  					backgroundPosition: '0% 50%'
  				},
  				'50%': {
  					backgroundPosition: '100% 50%'
  				},
  				'100%': {
  					backgroundPosition: '0% 50%'
  				}
  			},
  			bounceSoft: {
  				'0%, 100%': {
  					transform: 'translateY(-2%)',
  					animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)'
  				},
  				'50%': {
  					transform: 'translateY(0)',
  					animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)'
  				}
  			},
  			wiggle: {
  				'0%, 100%': {
  					transform: 'rotate(-3deg)'
  				},
  				'50%': {
  					transform: 'rotate(3deg)'
  				}
  			},
  			heartbeat: {
  				'0%': {
  					transform: 'scale(1)'
  				},
  				'14%': {
  					transform: 'scale(1.1)'
  				},
  				'28%': {
  					transform: 'scale(1)'
  				},
  				'42%': {
  					transform: 'scale(1.1)'
  				},
  				'70%': {
  					transform: 'scale(1)'
  				}
  			},
  			liquidMorph: {
  				'0%, 100%': {
  					borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
  					transform: 'rotate(0deg) scale(1)'
  				},
  				'25%': {
  					borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%',
  					transform: 'rotate(90deg) scale(1.02)'
  				},
  				'50%': {
  					borderRadius: '50% 50% 50% 50% / 50% 50% 50% 50%',
  					transform: 'rotate(180deg) scale(1)'
  				},
  				'75%': {
  					borderRadius: '70% 30% 50% 50% / 30% 70% 50% 50%',
  					transform: 'rotate(270deg) scale(0.98)'
  				}
  			},
  			liquidWave: {
  				'0%, 100%': {
  					transform: 'translateY(0) rotate(0deg)'
  				},
  				'20%': {
  					transform: 'translateY(-5px) rotate(1deg)'
  				},
  				'40%': {
  					transform: 'translateY(3px) rotate(-1deg)'
  				},
  				'60%': {
  					transform: 'translateY(-3px) rotate(0.5deg)'
  				},
  				'80%': {
  					transform: 'translateY(2px) rotate(-0.5deg)'
  				}
  			},
  			liquidRipple: {
  				'0%': {
  					transform: 'scale(0)',
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'scale(4)',
  					opacity: '0'
  				}
  			},
  			liquidGlow: {
  				'0%, 100%': {
  					opacity: '0.6',
  					transform: 'scale(1)'
  				},
  				'50%': {
  					opacity: '0.8',
  					transform: 'scale(1.05)'
  				}
  			},
  			liquidShimmer: {
  				'0%': {
  					transform: 'translateX(-150%) translateY(-150%) rotate(30deg)'
  				},
  				'100%': {
  					transform: 'translateX(150%) translateY(150%) rotate(30deg)'
  				}
  			},
  			refractionShift: {
  				'0%, 100%': {
  					transform: 'translate(0, 0) scale(1)'
  				},
  				'33%': {
  					transform: 'translate(10px, -10px) scale(1.1)'
  				},
  				'66%': {
  					transform: 'translate(-10px, 10px) scale(0.9)'
  				}
  			},
  			glassBreathe: {
  				'0%, 100%': {
  					transform: 'scale(1)',
  					filter: 'brightness(1)'
  				},
  				'50%': {
  					transform: 'scale(1.02)',
  					filter: 'brightness(1.1)'
  				}
  			},
  			glassFloat: {
  				'0%, 100%': {
  					transform: 'translateY(0px) rotate(0deg)'
  				},
  				'33%': {
  					transform: 'translateY(-10px) rotate(1deg)'
  				},
  				'66%': {
  					transform: 'translateY(5px) rotate(-1deg)'
  				}
  			},
  			gradientFlow: {
  				'0%': {
  					backgroundPosition: '0% 50%'
  				},
  				'50%': {
  					backgroundPosition: '100% 50%'
  				},
  				'100%': {
  					backgroundPosition: '0% 50%'
  				}
  			},
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
  			fadeInUp: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(20px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			slideX: {
  				'0%': {
  					transform: 'translateX(-100%)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateX(0)',
  					opacity: '1'
  				}
  			},
  			scaleIn: {
  				'0%': {
  					transform: 'scale(0.9)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			scaleOut: {
  				'0%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'scale(0.9)',
  					opacity: '0'
  				}
  			},
  			slideXWeek: {
  				'0%': {
  					transform: 'translateX(100%)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateX(0)',
  					opacity: '1'
  				}
  			},
  			glassHover: {
  				'0%': {
  					transform: 'scale(1)',
  					boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  				},
  				'100%': {
  					transform: 'scale(1.02)',
  					boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15)'
  				}
  			}
  		},
  		maxWidth: {
  			'8xl': '88rem',
  			'9xl': '96rem'
  		},
  		transitionTimingFunction: {
  			glass: 'cubic-bezier(0.4, 0, 0.2, 1)',
  			'bounce-gentle': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  			elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  			smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  		},
  		screens: {
  			xs: '475px',
  			sm: '640px',
  			md: '768px',
  			lg: '1024px',
  			xl: '1280px',
  			'2xl': '1400px',
  			'3xl': '1600px'
  		}
  	}
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('tailwindcss-animate'),
  ],
};