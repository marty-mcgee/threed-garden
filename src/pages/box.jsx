import dynamic from 'next/dynamic'

const Box = dynamic(() => import('~/components/fiber/BoxExample'), {
  ssr: false,
})

const Page = (props) => {
  return (
    <>
      {/* <SomePageComponent /> */}
    </>
  )
}

Page.r3f = (props) => (
  <>
    <Box route='/' />
  </>
)

export default Page

export async function getStaticProps() {
  return {
    props: {
      title: 'Box',
    },
  }
}
