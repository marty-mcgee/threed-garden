

// ==============================================================
// ** COMPONENTS

const ThreeDAnimations = () => {

  let loadNextAnim = function (loader) {
    let anim = anims.pop()
    console.debug("anim-------------------", anim)
    loader.load( `${params.assetsPath}fbx/anims2/${anim}.fbx`, function(object) {
      console.debug("object-----------------", object)
      animations[anim] = object.animations[0]
      if (anims.length > 0){
        loadNextAnim(loader)
      } 
      else {
        anims = []
        setAction("Idle")
        animate()
      }
    })	
  }

  // ==============================================================
  // ANIMATIONS (FOR ALL CHARACTERS)

  // useFrame(({ clock }) => {
  //   const a = clock.getElapsedTime()
  //   // THREEDCHARACTER.ref.current.rotation.x = a
  // })

  // return R3F JSX
  return (
    <>
      {true && (
        <>
        
        </>
      )}
    </>
  )
}

export default ThreeDAnimations