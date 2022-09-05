import Head from 'next/head'

const titleDefault = 'ThreeD.AI'
const url = 'https://threed.ai/'
const description =
  'The easiest and fastest way to create a 3D website using React Three Fiber and NextJS'
const author = 'Marty McGee'

const Header = ({ title = titleDefault }) => {
  return (
    <>
      <Head>
        {/* Recommended Meta Tags */}
        <meta charSet='utf-8' />
        <meta name='language' content='english' />
        <meta httpEquiv='content-type' content='text/html' />
        <meta name='author' content={author} />
        <meta name='designer' content={author} />
        <meta name='publisher' content={author} />

        {/* Search Engine Optimization Meta Tags */}
        <title>{title}</title>
        <meta name='description' content={description} />
        <meta name='keywords' content='React, Three, React Three Fiber, NextJS' />
        <meta name='robots' content='index,follow' />
        <meta name='distribution' content='web' />

        {/* 
          Facebook Open Graph Meta Tags
          docs: https://developers.facebook.com/docs/sharing/opengraph 
        */}
        <meta name='og:title' content={title} />
        <meta name='og:type' content='site' />
        <meta name='og:url' content={url} />
        <meta name='og:image' content={'/favicon/apple-touch-icon.png'} />
        <meta name='og:site_name' content={title} />
        <meta name='og:description' content={description} />

        {/* Favicons */}
        <link rel='shortcut icon' href='/favicon/favicon.ico' />
        <link rel='apple-touch-icon' href='/favicon/apple-touch-icon.png' />
        <link
          rel='apple-touch-icon'
          sizes='16x16'
          href='/favicon/favicon-16x16.png'
        />
        <link
          rel='apple-touch-icon'
          sizes='32x32'
          href='/favicon/favicon-32x32.png'
        />
        <link
          rel='apple-touch-icon'
          sizes='180x180'
          href='/favicon/apple-touch-icon.png'
        />
        <link
          rel='mask-icon'
          color='#000000'
          href='/favicon/safari-pinned-tab.svg'
        />
        <link rel='apple-touch-startup-image' href='/favicon/apple-touch-icon.png' />

        {/* Manifest */}
        <link rel='manifest' href='/favicon/site.webmanifest' />

        {/* Meta Tags for HTML pages on Mobile */}
        {/* <meta name="format-detection" content="telephone=yes"/>
        <meta name="HandheldFriendly" content="true"/>  */}
        <meta
          name='viewport'
          content='width=device-width, minimum-scale=1, initial-scale=1.0'
        />
        <meta name='theme-color' content='#222' />

        {/* 
      Twitter Summary card
        documentation: https://dev.twitter.com/cards/getting-started
        Be sure validate your Twitter card markup on the documentation site. */}
        <meta name='twitter:card' content='summary' />
        <meta name='twitter:site' content='@martymcgee' />
      </Head>
    </>
  )
}

export default Header
