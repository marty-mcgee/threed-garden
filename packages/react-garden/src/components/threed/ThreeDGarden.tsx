import { useRef, useEffect, useState } from "react"

import Head from "next/head"
import dynamic from "next/dynamic"
import Script from "next/script"

import paper from "paper"

import * as THREE from "three"
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js"
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader"
import { Sky } from "three/examples/jsm/objects/Sky.js"

// import { TWEEN } from "three/examples/jsm/libs/tween.module.min"
import TWEEN from "@tweenjs/tween.js"
import { Canvas, useFrame } from '@react-three/fiber'

// import "~/assets/demo/css/Demo.module.css"
// import "~/assets/demo/css/all.css"
// import "~/assets/demo/css/jquery.minicolors.css"
// import "~/assets/demo/css/style.css"

// import * as $ from "jquery"

const MyComponent = () => {
  useEffect(() => {
    console.debug('MyComponent onMount')
    return () => {
      console.debug('MyComponent onUnmount')
    }
  }, [])
  return (
    <div>...my Component [returns] JSX here...</div>
  )
}

const ThreeDGarden = (): JSX.Element => {
  const word = "HEY HEY HEY"
  const title = useRef()
  // const root = useRef()
  // const scene = new THREE.Scene()
  useEffect(() => {
    console.debug('ThreeDGarden onMount')
    // bootManager()
    return () => {
      console.debug('ThreeDGarden onUnmount')
    }
  }, [])
  return (
    <div style={{ textAlign: "center" }}>
      <div ref={title}>ThreeDGarden: {word}</div>
      {/* <div ref={root}>Three root</div> */}
      <MyComponent />
      {/* React Three Fiber
      <div id="canvas-container">
        <Canvas>
          <mesh>
            <boxBufferGeometry />
            <meshBasicMaterial />
          </mesh>
        </Canvas>
      </div> */}
      <div id="DEMO">
        <div id="aboutModal" className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <span className="close">&times;</span>
              <img src="favicon/favicon.png"
                height="54px"
                style={{ float: "left", paddingTop: "6px", paddingRight: "12px" }}
                alt="ThreeDGarden"
                title="ThreeDGarden" />
              <h2>ThreeDGarden</h2>
            </div>
            <div className="modal-body">

              <div className="tab">
                <button className="tablinks active" onClick="openTab('tab1')" id="tab1">Intro</button>
                <button className="tablinks" onClick="openTab('tab2')" id="tab2">Models</button>
                <button className="tablinks" onClick="openTab('tab3')" id="tab3">Examples</button>
                <button className="tablinks" onClick="openTab('tab4')" id="tab4">FAQ</button>
                <button className="tablinks" onClick="openTab('tab5')" id="tab5">Contact</button>
                <button className="tablinks" onClick="openTab('tab6')" id="tab6">Other</button>
                <button className="tablinks" onClick="openTab('tab7')" id="tab7">
                  <i className="far fa-laugh"></i> Supporters
                </button>
              </div>

              <div id="tab1Content" className="tabcontent" style={{ display: "block" }}>
                <h3>ThreeDGarden Introduction</h3>
                <p>Plan + Share Ideas for your Home + Garden in 2D + 3D</p>
                <div style={{ border: "1px solid #2a2a2a", paddingLeft: "12px", paddingRight: "12px" }}>
                  <p>Save Plan Edits to local web storage : <input type="checkbox" id="saveEditsToLocalStorage" onChange="handleSaveEditsLocalStorageOption()" />
                    <span className="tooltip"><img src="/demo/media/info.png" className="tooltip" />
                      <span className="tooltiptext">Any edits you make to the plan will be saved to your browsers local web storage so that you don't lose any work between saves.<br />The plan may be removed if you clean your browsers cookies and history, so to save your work long term, use the "File->Save" option in the main <a href="http://threedgarden.com">ThreeDGarden</a> toolbar.<br />More info about <a href="https://www.w3schools.com/HTML/html5_webstorage.asp" target="_blank" rel="noreferrer">Local Web Storage</a>.</span>
                    </span>
                    <div id="localStoragePlanDiv">
                      <hr />
                      <table>
                        <tr>
                          <td style={{ textAlign: "center" }}>
                            Most Recent Edit saved in Local Web Storage.<br />
                            <button onClick="loadFromLocalStorage()" id="loadLocalStoragePlanBtn">Load Plan</button>
                            <br /><br /><span id="localStoragePlanLastSavedDate"></span>
                          </td>
                          <td>
                            <div><img id="localStoragePlanImage" onClick="loadFromLocalStorage();" /></div>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </p>
                  <div id="featuredPlan">
                    <table>
                      <tr>
                        <td style={{ textAlign: "center", width: "300px" }}>
                          <button onClick="loadExamplePlan()" id="loadFeaturedPlanBtn"
                            className="largeButton">Load
                            Example Plan</button><br />
                          or<br />
                          <button onClick="closeAllModals()" className="largeButton">Start New Plan</button>
                        </td>
                        <td>
                          <div><img id="featuredPlanImage" onClick="loadExamplePlan();" /></div>
                        </td>
                      </tr>
                    </table>
                  </div>
                </div>
              </div>

              <div id="tab2Content" className="tabcontent">
                <h3>Models</h3>
                <p>ThreeDGarden uses many 3D models which can be found on the internet as public domain, Free Art or Creative Commons.</p>
                <p>If you would like a model added to the catalogue, please send a zipped file  to <span className="supportEmail"></span>.</p>
                <p>Models ideally should be:
                  <ul>
                    <li>Saved as .obj format along with the .mtl file, plus any texture files used. Blender OBJ default export options work very well.</li>
                    <li>1 unit in Blender = 1cm in ThreeDGarden. Eg, a cube with X:100, Y:100, Z:100, will display as 1 Meter cubed box in the 3d and Plan views.</li>
                    <li>If using Blender, Y-Axis in your OBJ export should be UP. Blender IDE defaults with the Z-Axis being UP in normal creatiion mode, but the OBJ export plugin defaults to convert the exported OBJ with the Y-Axis being UP. This is good.</li>
                    <li>Try to keep model low poly and the total download size smaller than 1Mb. Not totally essential but it helps.</li>
                    <li>Your model should be released as public domain or licensed with a non restrictive open source license such as a Free Art or Creative Commons.</li>
                    <li>Before sending your model, if the model you provide was not already in the public domain, or had an open source license, then you should own the copyright on the 3d model and textures, or have the permission of the copyight holder, and provide the model to add to the catalogue for unrestricted use as either Public Domain, Free Art or Creative Commons.</li>
                    <li>Add the authors name, copyright year and attribution url if known.</li>
                    <li>All models will be reviewed and maybe optimised before adding. A comment will be added to OBJ file for any modifications.</li>
                    <li>Models with restrictive licenses cannot be added.</li>
                  </ul>
                </p>
              </div>

              <div id="tab3Content" className="tabcontent">
                <h3>Tutorial Videos</h3>
                <div style={{ border: "1px solid #2a2a2a", paddingLeft: "12px", paddingRight: "12px" }}>
                  <table>
                    <tr>
                      <td style={{ width: "400px" }} valign="top">
                        <h3>Mansard</h3>
                        <p>
                          <a href="#https://www.youtube.com/watch?v=Ppqp-dLwKIE" target="_blank"
                            rel="noopener" className="largeButton">
                            Watch Video
                          </a>&nbsp;<button onClick="loadPlan('42fbd8ff0f5a37fa1285ae8b6c6ca36529b930c2')"
                            className="largeButton">Load Plan</button>
                        </p>
                      </td>
                      <td>
                        <a href="#https://www.youtube.com/watch?v=Ppqp-dLwKIE" target="_blank"
                          rel="noopener">
                          <img src="/demo/tuts/mansard.png" style={{ border: "2px solid #2a2a2a" }} />
                        </a>
                      </td>
                    </tr>
                  </table>
                </div>
                <br />
                <div style={{ border: "1px solid #2a2a2a", paddingLeft: "12px", paddingRight: "12px" }}>
                  <table>
                    <tr>
                      <td style={{ width: "400px" }} valign="top">
                        <h3>Gable with Valley Roof</h3>
                        <p>
                          <a href="#https://www.youtube.com/watch?v=DUaBywAS6Ik" target="_blank"
                            rel="noopener" className="largeButton">
                            Watch Video
                          </a>&nbsp;<button onClick="loadPlan('0d371f9acad19a943f38c3a32f6d5d140bc6c913')"
                            className="largeButton">Load Plan</button>
                        </p>
                      </td>
                      <td>
                        <a href="#https://www.youtube.com/watch?v=DUaBywAS6Ik" target="_blank"
                          rel="noopener">
                          <img src="/demo/tuts/gableWithValley.png" style={{ border: "2px solid #2a2a2a" }} />
                        </a>
                      </td>
                    </tr>
                  </table>
                </div>
                <br />
                <div style={{ border: "1px solid #2a2a2a", paddingLeft: "12px", paddingRight: "12px" }}>
                  <table>
                    <tr>
                      <td style={{ width: "400px" }} valign="top">
                        <h3>Modern Dutch Gable (Hip with Gable)</h3>
                        <p>
                          <a href="#https://www.youtube.com/watch?v=0cmjXmp7D_E" target="_blank"
                            rel="noopener" className="largeButton">
                            Watch Video
                          </a>&nbsp;<button onClick="loadPlan('c0300edf03b952872c37744bf570a588184dd3d5')"
                            className="largeButton">Load Plan</button>
                        </p>
                      </td>
                      <td>
                        <a href="#https://www.youtube.com/watch?v=0cmjXmp7D_E" target="_blank"
                          rel="noopener">
                          <img src="/demo/tuts/modernDutchGable.png" style={{ border: "2px solid #2a2a2a" }} />
                        </a>
                      </td>
                    </tr>
                  </table>
                </div>
                <p>More Coming Soon</p>
              </div>

              <div id="tab4Content" className="tabcontent">
                <h3>FAQ</h3>
              </div>

              <div id="tab5Content" className="tabcontent">
                <h3>Contact</h3>
                <p><span className="supportEmail"></span></p>
              </div>

              <div id="tab6Content" className="tabcontent">
                <h3>Tab 6 Content</h3>
                <p>Paragraphs of words here..</p>
                <p>The application is made available online in the hope that it will be useful,
                  but without any warranty or implied warranty of fitness for any particular purpose.</p>
              </div>

              <div id="tab7Content" className="tabcontent">
                <h3>Tab 7 Content</h3>
                <p>Paragraphs of words here..</p>
                <p><span className="supportEmail"></span></p>
              </div>

            </div>
            <div className="modal-footer">
              <h3><a href="https://threedgarden.com">ThreeDGarden</a> &copy; Company Juice.&nbsp;Version 0.1.1.1</h3>
            </div>
          </div>
        </div >
      </div>
    </div >
  )
}

export default ThreeDGarden
