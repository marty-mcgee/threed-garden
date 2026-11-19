# Inter font

Inter v4.1 variable upright font, distributed under the SIL Open Font License 1.1; see [OFL.txt](OFL.txt).

Source: [official Inter v4.1 font](https://github.com/rsms/inter/blob/v4.1/docs/font-files/InterVariable.woff2) and [license](https://github.com/rsms/inter/blob/v4.1/LICENSE.txt).

`src/app/fonts.js` loads this file through `next/font/local`, preserving the Inter export, `--font-inter` variable, normal style, swap display and 400/500/600 weight coverage. This avoids a build-time Google Fonts request and the reported Next.js/Turbopack Google font URL parsing failure. App layout and global CSS ownership are unchanged.
