// ** Next Imports
import dynamic from 'next/dynamic'

// ** Custom Imports
import Annotations from './annotations'

// ** Custom Components Imports
// import Shader from '~/components/fiber/fiber/Shaders/Shader'
// instead..
// Dynamic import is used to prevent a payload when the website start
// that will include threejs r3f etc..
// WARNING ! errors might get obfuscated by using dynamic import.
// If something goes wrong go back to a static import to show the error.
// https://github.com/pmndrs/react-three-next/issues/49
const Shader = dynamic(() => import('~/components/fiber/Shaders/Shader'), {
  ssr: false,
})

// dom components goes here
const Page = (props) => {
  return (
    <>
      <h1 style={{ paddingLeft: 48 }}>Marty McGee: Senior Web Developer</h1>
      {/* <Annotations /> */}
      <progress value="0" max="100" id="progressBar"></progress>
      <div id="annotationsPanel"></div>
    </>
  )
}

// canvas components goes here
// It will receive same props as Page component (from getStaticProps, etc.)
Page.r3f = (props) => (
  <>
    <Shader />
  </>
)

export default Page

export async function getStaticProps() {
  return {
    props: {
      title: 'Index',
    },
  }
}
