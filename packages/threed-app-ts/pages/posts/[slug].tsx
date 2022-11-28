import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import Head from 'next/head'
import { GetStaticPaths, GetStaticProps } from 'next'
import Container from '#/lib/components/blog/container'
import PostBody from '#/lib/components/blog/post-body'
import MoreStories from '#/lib/components/blog/more-stories'
import Header from '#/lib/components/blog/header'
import PostHeader from '#/lib/components/blog/post-header'
import SectionSeparator from '#/lib/components/blog/section-separator'
import Layout from '#/lib/components/blog/layout'
import PostTitle from '#/lib/components/blog/post-title'
import Tags from '#/lib/components/blog/tags'
import { getAllPostsWithSlug, getPostAndMorePosts } from '#/api/api'
import { CMS_NAME } from '#/lib/constants'

export default function Post({ post, posts, preview }: { post: any; posts: any; preview: any }) {
  const router = useRouter()
  const morePosts = posts?.edges

  if (!router.isFallback && !post?.slug) {
    return <ErrorPage statusCode={404} />
  }

  return (
    <Layout preview={preview}>
      <Container>
        <Header />
        {router.isFallback ? (
          <PostTitle>Loading…</PostTitle>
        ) : (
          <>
            <article>
              <Head>
                <title>
                  {post.title} | Next.js Blog Example with {CMS_NAME}
                </title>
                <meta
                  property='og:image'
                  content={post.featuredImage?.sourceUrl}
                />
              </Head>
              <PostHeader
                title={post.title}
                coverImage={post.featuredImage}
                date={post.date}
                author={post.author}
                categories={post.categories}
              />
              <PostBody content={post.content} />
              <footer>{post.tags.edges.length > 0 && <Tags tags={post.tags} />}</footer>
            </article>

            <SectionSeparator />
            {morePosts.length > 0 && <MoreStories posts={morePosts} />}
          </>
        )}
      </Container>
    </Layout>
  )
}

export const getStaticProps: GetStaticProps = async ({ params, preview = false, previewData }) => {
  const data = await getPostAndMorePosts(params?.slug, preview, previewData)

  return {
    props: {
      preview,
      post: data.post,
      posts: data.posts,
    },
    revalidate: 10,
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const allPosts = await getAllPostsWithSlug()

  return {
    paths: allPosts.edges.map(({ node }: any) => `/posts/${node.slug}`) || [],
    fallback: true,
  }
}
