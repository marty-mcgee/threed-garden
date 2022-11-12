import React, { useEffect, useState } from 'react'

import objects from '~/assets/demo/objects/objects-1'

function DataGrabber(props) {
  const { id = 2 } = props
  const [data, setData] = useState(null)

  useEffect(() => {
    // console.debug("objects", objects)
    console.debug('objects', Object.keys(objects).length)

    try {
      Object.keys(objects).forEach((key) => {
        // for (let key in objects) {
        // console.debug("key", key)

        // const fetchData = async () => {
        //   const response = await fetch(`https://homeidea3d.seanwasere.com/objects/${key}.png`)
        //   const newData = await response.json()
        //   setData(newData)
        // }

        const fetchData = async () => {
          // (A) FETCH FILE
          // const response = await fetch(`https://homeidea3d.seanwasere.com/objects/${key}/${key}.obj`)
          const response = await fetch(`https://homeidea3d.seanwasere.com/objects/${key}/${key}.mtl`)
            // const response = await fetch(`https://homeidea3d.seanwasere.com/objects/${key}_top.png`)
            // const response = await fetch(`https://homeidea3d.seanwasere.com/objects/${key}.png`)
            // (B) RETURN AS BLOB
            .then((result) => {
              if (result.status !== 200) {
                throw new Error('Bad server response')
              }
              return result.blob()
            })
            // (C) BLOB DATA
            .then((data) => {
              // (C1) FILE DATA IS "READY FOR USE"
              console.log(data)

              // (C2) TO "FORCE DOWNLOAD"
              const url = window.URL.createObjectURL(data)
              const anchor = document.createElement('a')
              anchor.href = url
              // anchor.download = `${key}.obj`
              anchor.download = `${key}.mtl`
              // anchor.download = `${key}.png`
              // anchor.download = `${key}_top.png`
              anchor.click()

              // (C3) CLEAN UP
              window.URL.revokeObjectURL(url)
              document.removeChild(anchor)
            })

            // (D) HANDLE ERRORS - OPTIONAL
            .catch((error) => {
              console.log(error)
            })
        }

        // BE CAREFUL
        // fetchData()
      })
    } catch (err) {
      console.debug(`err ${err}`)
    }
  }, [id])

  if (data) {
    return <div>{data.name}</div>
  } else {
    return null
  }
}

export default DataGrabber
