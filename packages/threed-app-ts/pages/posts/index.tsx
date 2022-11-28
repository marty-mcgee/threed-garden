import Head from 'next/head'
import { GetStaticProps } from 'next'
import Container from '~/components/blog/container'
import MoreStories from '~/components/blog/more-stories'
import HeroPost from '~/components/blog/hero-post'
import Intro from '~/components/blog/intro'
import Layout from '~/components/blog/layout'
import { getAllPostsForHome } from '#/lib/api'
import { CMS_NAME } from '~/lib/constants'

export default function Index({ allPosts: { edges }, preview }: { allPosts: { edges: any }; preview: any }) {
  const heroPost = edges[0]?.node
  const morePosts = edges.slice(1)

  return (
    <Layout preview={preview}>
      <Head>
        <title>Next.js Blog Example with {CMS_NAME}</title>
      </Head>
      <Container>
        <Intro />
        {heroPost && (
          <HeroPost
            title={heroPost.title}
            coverImage={heroPost.featuredImage}
            date={heroPost.date}
            author={heroPost.author}
            slug={heroPost.slug}
            excerpt={heroPost.excerpt}
          />
        )}
        {morePosts.length > 0 && <MoreStories posts={morePosts} />}
      </Container>
    </Layout>
  )
}

export const getStaticProps: GetStaticProps = async ({ preview = false }) => {
  const allPosts = await getAllPostsForHome(preview)

  return {
    props: { allPosts, preview },
    revalidate: 10,
  }
}

/*
import React from "react"
import Router from "next/router"

export default function Index() {
  React.useEffect(() => {
    Router.push("/admin/dashboard")
  })

  return <div />
}
*/
