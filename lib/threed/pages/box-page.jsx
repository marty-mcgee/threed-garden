// ==============================================================
// RESOURCES

import BoxComponent from '#/lib/threed/components/box'
// import Instructions from '#/lib/threed/pages/Instructions'

import dynamic from 'next/dynamic'

const Box = dynamic(() => import('#/lib/threed/components/box'), {
  ssr: false,
})

// ==============================================================
// COMPONENTS

// create "Instructions" components
const WholePage = (props) => {
  console.debug('%cWholePage BoxPage<JSX>: props', props)
  return (
    <>
      {/* <Instructions /> */}
      <BoxComponent route='/' />
    </>
  )
}

// page fragment ?? page attribute ?? page .r3f ??
WholePage.r3f = (props) => {
  console.debug('%cWholePage.r3f BoxPage<JSX>: props', props)

  return (
    <>
      {/* <Box route='/' /> */}
      <BoxComponent route='/' />
    </>
  )
}

export default WholePage

// ==============================================================
// PROPS + HELPERS

export async function getStaticProps() {
  return {
    props: {
      title: 'Box',
      _name: '[MM]:[THREED] HEY HEY HEY 0',
      _id: '1234567890',
      _ts: 'new Date()',
      _type: 'props_mmWholePageR3F',
      data: {
        title: '[MM] from future WP/GQL API endpoint noun _type "Box"',
      },
    },
  }
}
