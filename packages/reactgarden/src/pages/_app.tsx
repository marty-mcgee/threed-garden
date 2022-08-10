// import { AppProps } from 'next/app'
// import '../styles/index.css'

// function MyApp({ Component, pageProps }: AppProps) {
//   return <Component {...pageProps} />
// }

// export default MyApp

import React from "react"
import ReactDOM from "react-dom"
import App from "next/app"
import Head from "next/head"
import Router from "next/router"

import PageChange from "components/PageChange/PageChange.js"

import "assets/css/nextjs-material-dashboard.css?v=1.1.0"

Router.events.on("routeChangeStart", (url) => {
  console.log(`Loading: ${url}`)
  document.body.classList.add("body-page-transition")
  ReactDOM.render(
    <PageChange path={url} />,
    document.getElementById("page-transition")
  )
})
Router.events.on("routeChangeComplete", () => {
  ReactDOM.unmountComponentAtNode(document.getElementById("page-transition"))
  document.body.classList.remove("body-page-transition")
})
Router.events.on("routeChangeError", () => {
  ReactDOM.unmountComponentAtNode(document.getElementById("page-transition"))
  document.body.classList.remove("body-page-transition")
})

export default class MyApp extends App {
  componentDidMount() {
    const comment = document.createComment(`HEY HEY HEY`)
    document.insertBefore(comment, document.documentElement)
  }

  static async getInitialProps({ Component, router, ctx }) {
    let pageProps = {}

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx)
    }

    return { pageProps }
  }

  render() {
    const { Component, pageProps } = this.props
    console.log("Component", Component)

    const Layout = Component.layout || (({ children }) => <>({children})</>)

    return (
      <>
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, shrink-to-fit=no"
          />
          <title>React Garden</title>
          {/* <script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}`} /> */}
        </Head>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </>
    )
  }
}
