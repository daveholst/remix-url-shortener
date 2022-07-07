import { createStitches } from '@stitches/react'

export const {
    styled,
    css,
    globalCss,
    keyframes,
    getCssText,
    theme,
    createTheme,
    config,
} = createStitches({
    theme: {
        colors: {
            'ash-gray': 'rgba(202, 210, 197, 1)',
            'dark-sea-green': 'rgba(132, 169, 140, 1)',
            'hookers-green': 'rgba(82, 121, 111, 1)',
            'dark-slate-gray': 'rgba(53, 79, 82, 1)',
            charcoal: 'rgba(47, 62, 70, 1)',
        },
        space: {
            xs: '0.25rem',
            sm: '0.5rem',
            md: '1rem',
        },
        fonts: {
            sans: 'Rockwell, apple-system, sans-serif',
            mono: 'PT Mono, menlo, monospace',
        },
    },

    media: {
        bp1: '(min-width: 480px)',
    },
    utils: {
        marginX: (value: number) => ({ marginLeft: value, marginRight: value }),
    },
})
