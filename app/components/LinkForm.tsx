import { useState } from 'react'
import { GeneratedLink, StyledLinkForm } from './LinkForm.styled'

export const LinkForm: React.FC = () => {
    const [linkInput, setLinkInput] = useState<string>()
    const [generatedLink, setGeneratedLink] = useState<string>()

    return (
        <>
            <StyledLinkForm>
                <input
                    type="text"
                    value={linkInput}
                    placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    onChange={e => setLinkInput(e.target.value)}
                />
                {/* TODO does an api exist that listens to the paste event??? */}
                <button>bill shorten</button>
                {/* TODO just a placeholder for now */}
                <GeneratedLink href={'https://link.dh.wtf/K7Tl'}>
                    https://link.dh.wtf/K7Tl
                </GeneratedLink>
            </StyledLinkForm>
        </>
    )
}
