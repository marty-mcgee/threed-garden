import Box from './Box'

export default function Boxes() {
  return (
    <>
      <Box position={[10, 0, 0]} />
      <Box position={[-10, 0, 0]} />
      <Box position={[0, 10, 0]} />
      <Box position={[0, -10, 0]} />
    </>
  )
}
