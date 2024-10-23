import * as THREE from 'three'
import state from '../state'

const sharedStyles = {
  height: 50,
  width: 50,
  borderRadius: '50%',
  cursor: 'pointer'
}

const ColorPicker = props => {
  const handleClick = e => {
    if (!state.activeMesh) return
    state.activeMesh.material.color = new THREE.Color(e.target.style.background)
  }
  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 1,
        left: 0,
        right: 0,
        margin: 'auto',
        width: 'fit-content',
        display: 'flex',
        top: '20px'
      }}
    >
      <div
        onClick={handleClick}
        style={{
          background: 'rgb(243, 246, 247)',
          ...sharedStyles
        }}
      />
      <div
        onClick={handleClick}
        style={{
          background: 'black',
          ...sharedStyles
        }}
      />
      <div
        onClick={handleClick}
        style={{
          background: 'red',
          ...sharedStyles
        }}
      />
      <div
        onClick={handleClick}
        style={{
          background: 'rgb(30, 75, 93)',
          ...sharedStyles
        }}
      />
      <div
        onClick={handleClick}
        style={{
          background: '#000d89',
          ...sharedStyles
        }}
      />
      <div
        onClick={handleClick}
        style={{
          background: '#175421',
          ...sharedStyles
        }}
      />
    </div>
  )
}

export default ColorPicker
