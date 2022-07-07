import { styled } from '~/styles/stitches.config'

export const StyledLinkForm = styled('form', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',

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
        margin: '$md',
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
    color: '$hookers-green',
})
