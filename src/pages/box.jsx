import dynamic from 'next/dynamic'

const Box = dynamic(() => import('~/components/fiber/canvas/Box'), {
  ssr: false,
})

// Step 5 - delete Instructions components
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
