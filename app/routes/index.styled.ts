import { Form } from '@remix-run/react'
import { keyframes } from '@stitches/react'
import { styled } from '~/styles/stitches.config'

const shake = keyframes({
    '10%, 90%': {
        transform: 'translate3d(-1px, 1px, 0)',
    },

    '20%, 80%': {
        transform: 'translate3d(2px, -2px, 0)',
    },
    '30%, 50%, 70%': {
        transform: 'translate3d(-5px, 5px, 0',
    },
    '40%, 60%': {
        transform: 'translate3d(4px, -4px, 0)',
    },
})

export const StyledLinkForm = styled(Form, {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',

    '& fieldset': {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: 0,
    },

    '& input': {
        width: '90vw',
        maxWidth: 800,
        fontFamily: '$mono',
        border: 'none',
        borderBottom: 'solid 2px $dark-sea-green',
    },

    '& input:focus': {
        outline: 'none',
    },

    '& button': {
        cursor: 'pointer',
        margin: '$lg auto',
        width: 300,
        height: '40px',
        fontFamily: '$mono',
        fontSize: '1.25rem',
        fontWeight: 500,
        border: 'solid 2px $charcoal',
        borderRadius: '4px',
        backgroundColor: '$ash-gray',

        '&:hover': {
            backgroundColor: '$dark-sea-green',
            animation: `${shake} 0.08s cubic-bezier(.36, .07, .19, .97) infinite`,
            transform: 'translate3d(0, 0, 0)',
            perspective: '1000px',
        },
    },
})

export const GeneratedLink = styled('a', {
    fontFamily: '$sans',
    fontSize: '1.4rem',
    color: '$hookers-green',
})

export const StyledSubTitle = styled('h2', {
    fontFamily: '$mono',
    display: 'flex',
    justifyContent: 'center',
    margin: '$md',
})
