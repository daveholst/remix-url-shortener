import { Link, NavLink } from '@remix-run/react'
import { styled } from '~/styles/stitches.config'

export const StyledListedLinkWrapper = styled('div', {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    margin: '$sm',
})

export const StyledShortLink = styled(Link, {
    fontFamily: '$mono',
})

export const StyledLongLink = styled('a', {
    fontFamily: '$mono',
})
