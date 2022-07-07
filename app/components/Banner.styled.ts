import { styled } from '~/styles/stitches.config'

export const StyledBanner = styled('div', {
    display: 'flex',
    justifyContent: 'center',
    alignContent: 'center',
    margin: '$sm',
    padding: '$sm',
    '& h1': {
        fontFamily: '$mono',
        fontSize: '2rem',
    },
})
