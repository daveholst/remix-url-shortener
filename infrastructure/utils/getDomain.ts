export function getDomainAndSubdomain(domain: string): {
    subdomain: string
    parentDomain: string
} {
    const parts = domain.split('.')
    if (parts.length < 2) {
        throw new Error(`No TLD found on ${domain}`)
    }
    // No subdomain, e.g. awesome-website.com.
    if (parts.length === 2) {
        return { subdomain: '', parentDomain: domain }
    }

    const subdomain = parts[0]
    parts.shift() // Drop first element.
    return {
        subdomain,
        // Trailing "." to canonicalize domain.
        parentDomain: parts.join('.') + '.',
    }
}
