import { Form } from '@remix-run/react'
import { styled } from '~/styles/stitches.config'

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
        margin: '$lg',
        width: 300,
        height: '40px',
        fontFamily: '$mono',
        fontSize: '1.25rem',
        fontWeight: 500,
        border: 'solid 2px $charcoal',
        borderRadius: '4px',
        backgroundColor: '$ash-gray',
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
