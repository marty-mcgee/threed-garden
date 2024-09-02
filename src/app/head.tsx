// 'use client'
// ==============================================================
// RESOURCES
// this is your SEO metadata !!!

// import type { Metadata } from 'next'

// ** Metadata Components
// import { DefaultTags } from '#/layout/ui/playground/DefaultTags';
// import HeadMeta from '#/layout/ui/head'
// import meta from './meta.json'

const meta = {
  title: '🥕 ThreeD Garden on threed.ai',
  url: 'https://threedgarden.com',
  favicon: '/favicon/favicon.png',
  author: 'Marty McGee <mcgee.marty@gmail.com> (https://github.com/marty-mcgee)',
  description:
    'threed-garden demonstrates active development use of the threed-ai platform. threed-ai is a functioning, legit, low-dependency app, a package supporting a monorepo of workspaces that utilize/depend on ThreeJS, WebGL, React, TypeScript <Fiber>, GraphQL, in active development.',
  keywords:
    'Architecture, Planning, 3D Plans, Home Ideas, Floor Plans, Garden Planning, 3D Design, Building Plans, Landscaping Design, Landscaping, Design, 3D Design App, React 3D, ThreeD Garden',
}

const HeadMeta = ({ title = meta.title }) => {
// const HeadMeta = ({ title = meta.title }): Metadata => {

  // ** Metadata
  return (
    <>
      {/* Recommended Meta Tags */}
      <meta charSet='utf-8' />
      <meta name='language' content='english' />
      <meta httpEquiv='content-type' content='text/html' />
      <meta name='author' content={meta.author} />
      <meta name='designer' content={meta.author} />
      <meta name='publisher' content={meta.author} />

      {/* Search Engine Optimization Meta Tags */}
      <title>{title}</title>
      <meta name='description' content={meta.description} />
      <meta name='keywords' content={meta.keywords} />
      {/* <meta name='robots' content='index,follow' /> */}
      {/* <meta name='distribution' content='web' /> */}

      {/* Favicons */}
      <link rel='shortcut icon' href={meta.favicon} />
      <link rel='apple-touch-icon' href='/favicon/apple-touch-icon.png' />
      <link rel='apple-touch-icon' sizes='16x16' href='/favicon/favicon-16x16.png' />
      <link rel='apple-touch-icon' sizes='32x32' href='/favicon/favicon-32x32.png' />
      <link rel='apple-touch-icon' sizes='180x180' href='/favicon/apple-touch-icon.png' />
      <link rel='mask-icon' color='#000000' href='/favicon/safari-pinned-tab.svg' />
      <link rel='apple-touch-startup-image' href='/favicon/apple-touch-icon.png' />
      <meta name='msapplication-TileColor' content='#da532c' />

      {/* Manifest */}
      <link rel='manifest' href='/favicon/site.webmanifest' />

      {/* Meta Tags for HTML pages on Mobile */}
      {/* <meta name='format-detection' content='telephone=yes'/> */}
      {/* <meta name='HandheldFriendly' content='true'/> */}
      <meta name='viewport' content='initial-scale=1.0, minimum-scale=1.0, width=device-width, viewport-fit=cover' />
      <meta name='theme-color' content='#222' />

      {/*
        Facebook Open Graph Meta Tags
        docs: https://developers.facebook.com/docs/sharing/opengraph
      */}
      <meta property='og:title' content={title} />
      <meta property='og:type' content='website' />
      <meta property='og:description' content={meta.description} />
      <meta property='og:url' content={meta.url} />
      <meta property='og:image' content='/favicon/android-chrome-512x512.png' />
      <meta property='og:image:width' content='512' />
      <meta property='og:image:height' content='512' />

      {/*
        Twitter Summary Card
        docs: https://dev.twitter.com/cards/getting-started
      */}
      <meta name='twitter:card' content='Design your home and garden plans in 2D and 3D' />
      <meta name='twitter:site' content='@companyjuice' />
      <meta name='twitter:creator' content='@martymcgee' />
    </>
  )
}

export default function Head() {
  return (
    <>
      <HeadMeta />
      
      {/* <!-- Google tag (gtag.js) --> */}
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-B6H82RQ83V"></script>
      <script>
        {/* Google tag (gtag.js) */}
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-B6H82RQ83V');
      </script>

    </>
  )
}
