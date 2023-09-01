import Head from 'next/head'
import { GetStaticProps } from 'next'
import Container from '#/ui/blog/container'
import MoreStories from '#/ui/blog/more-stories'
import HeroPost from '#/ui/blog/hero-post'
import Intro from '#/ui/blog/intro'
import Layout from '#/ui/blog/layout'
import { getAllPostsForHome } from '#/lib/api/api'
import { CMS_NAME } from '#/lib/data/constants'

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
