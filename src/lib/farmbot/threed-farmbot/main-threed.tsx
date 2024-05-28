// @ts-nocheck /* OR @ ts-expect-error */

// import React from "react"
// import ReactDOM from "react-dom/client"

import { ElectronicsBoxModel } from "./box-threed"
// import { Garden } from "./garden-threed"

const ThreeDFarmBotGardenMain = () => {
  return (
    <group>
      {/* <Garden /> */}
      <ElectronicsBoxModel
        isEditing={false}
        dispatch={() => { }}
        resources={{}}
        firmwareHardware={"arduino"}
        bot={{
          hardware: {
            informational_settings: {
              locked: false,
              sync_status: "synced",
            }
          }
        }}
        botOnline={true} 
      />
    </group>
  )
}
export default ThreeDFarmBotGardenMain

// ** from main repo
// ReactDOM.createRoot(document.getElementById("root")!).render(
//   <React.StrictMode>
//     <Garden />
//     {/* <ElectronicsBoxModel
//       isEditing={false}
//       dispatch={() => { }}
//       resources={{}}
//       firmwareHardware={"arduino"}
//       bot={{
//         hardware: {
//           informational_settings: {
//             locked: false,
//             sync_status: "synced",
//           }
//         }
//       }}
//       botOnline={true} /> */}
//   </React.StrictMode>,
// )
