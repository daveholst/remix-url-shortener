import {
    StyledListedLinkWrapper,
    StyledLongLink,
    StyledShortLink,
} from './ListedLink.styled'

export interface ListedLinkProps {
    short: string
    long: string
}

export function ListedLink({ short, long }: ListedLinkProps) {
    function shortenLongUrl(url: string) {
        url.split('.')
        return
    }

    return (
        <StyledListedLinkWrapper>
            <StyledShortLink
                to={short}
            >{`https://link.dh.wtf/${short}`}</StyledShortLink>
            <span>{' == '}</span>
            <StyledLongLink href={long}>
                {long.split('.')[1] || '???'}
            </StyledLongLink>
        </StyledListedLinkWrapper>
    )
}
