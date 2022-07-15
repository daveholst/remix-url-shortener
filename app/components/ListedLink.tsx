import { getShortName } from './helpers/getShortName'
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
    return (
        <StyledListedLinkWrapper>
            <StyledShortLink
                to={short}
            >{`https://link.dh.wtf/${short}`}</StyledShortLink>
            <span>{' == '}</span>
            <StyledLongLink href={long}>{getShortName(long)}</StyledLongLink>
        </StyledListedLinkWrapper>
    )
}
