# Remix.run URL shortener ft. stitches, pulumi and AWS

This was a 'simple' crack at getting a remix app to work on an AWS lambda based stack via Pulumi. I tried hard to follow the docs and use as mage 'remix magic' as possible to do all the form control, mutations and data loading. It is very much a WIP... I might even come back to finish it off one day :shrug:

A few key things of note:
- It requires a double bundle as I am wrapping the build files in a handler in `server/index.ts`. This allows me to leverage the `@remix-run/architect` `createRequestHandler` function that acts as an adapter between the lambda events and the events remix expects to receive.
- Remix has lots of magic and didn't like me having their `Form` component styled in the shared components lib outside the route. I didn't investigate too much into this and moved it to `index.styled.ts`.
- Stitches dev xp with tokens is pretty rad
- This took quite a bit of trial and error to get working. Considering I have never used a framework or CloudFront, this was probably to be expected :joy:

Live Deploy: https://link.dh.wtf

## Stack

-   Typescript
-   Remix
-   React
-   Stitches
-   Pulumi

## Scripts

- `pnpm dev` - uses `concurrently` to run `dynalite` and `remix dev`
- `pnpm deploy:prod` - ups the prod stack to AWS
