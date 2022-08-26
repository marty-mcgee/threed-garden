import { useRef, useEffect, useState, MouseEventHandler } from "react"

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

// do this from _app.tsx
// import "~/assets/demo/css/Demo.module.css"
// import "~/assets/demo/css/all.css"
// import "~/assets/demo/css/jquery.minicolors.css"
// import "~/assets/demo/css/style.css"

// no no no, never
// import * as $ from "jquery"

// ======================================================

const AboutModal = (): JSX.Element => {
  // console.debug("AboutModal")
  useEffect(() => {
    console.debug('AboutModal onMount')
    return () => {
      console.debug('AboutModal onUnmount')
    }
  }, [])
  return (
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
          <h3>&copy; <a href="https://threedgarden.com">ThreeDGarden</a></h3>
        </div>
      </div>
    </div>
  )
}

const Model3dModal = (): JSX.Element => {
  // console.debug("Model3dModal")
  useEffect(() => {
    console.debug('Model3dModal onMount')
    return () => {
      console.debug('Model3dModal onUnmount')
    }
  }, [])
  return (
    <div id="model3dModal" className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <span className="close">&times;</span>
          <img
            src="favicon/favicon.png"
            height="54px"
            style={{ float: "left", paddingTop: "6px", paddingRight: "12px" }}
            title="ThreeDGarden"
            alt="ThreeDGarden" />
          <h2>ThreeDGarden</h2>
        </div>
        <div className="modal-body">
          <div id="model3dView">
            <canvas id="model3dViewCanvas"></canvas>
          </div>
          <div id="modalModelDescription">
            <h3>3d Model Properties</h3>
            <table className="propertiesTable" style={{ width: "400px" }}>
              <tr>
                <td width="70">Name</td>
                <td><span id="model3dNameModal"></span></td>
              </tr>
              <tr>
                <td>Author</td>
                <td><span id="model3dAuthorModal"></span></td>
              </tr>
              <tr>
                <td>License</td>
                <td><span id="model3dLicenseModal"></span></td>
              </tr>
              <tr>
                <td colSpan="2">OBJ&nbsp;File&nbsp;Comments</td>
              </tr>
            </table>
            <textarea id="modalModel3dObjHeader"></textarea>
          </div>
        </div>
        <div className="modal-footer">
          <h3>
            <a href="http://threedgarden.com">ThreeDGarden</a> &copy; Company
            Juice.&nbsp;Version 0.1.1.1
          </h3>
        </div>
      </div>
    </div>
  )
}

const LoadingModal = (): JSX.Element => {
  // console.debug("LoadingModal")
  useEffect(() => {
    console.debug('LoadingModal onMount')
    return () => {
      console.debug('LoadingModal onUnmount')
    }
  }, [])
  return (
    <div id="loadingModal" className="smallModal">
      <div className="smallModal-content">
        <div className="smallModal-header">
          <img
            src="favicon/favicon.png"
            height="54px"
            style={{ float: "left", paddingTop: "6px", paddingRight: "12px" }}
            title="ThreeDGarden"
            alt="ThreeDGarden" />
          <h2>ThreeDGarden</h2>
        </div>
        <div className="smallModal-body">
          <h3>Loading Model Progress</h3>
          <textarea id="modalLoadingDataInfo"></textarea>
        </div>
        <div className="smallModal-footer">
          <h3>
            <a href="http://threedgarden.com">ThreeDGarden</a> &copy; Company
            Juice.&nbsp;Version 1.1.1
          </h3>
        </div>
      </div>
    </div>
  )
}

const ShareModal = (): JSX.Element => {
  // console.debug("ShareModal")
  useEffect(() => {
    console.debug('ShareModal onMount')
    return () => {
      console.debug('ShareModal onUnmount')
    }
  }, [])
  return (
    <div id="shareModal" className="smallModal">
      <div className="smallModal-content">
        <div className="smallModal-header">
          <span className="close">&times;</span>
          <img
            src="favicon/favicon.png"
            height="54px"
            style={{ float: "left", paddingTop: "6px", paddingRight: "12px" }}
            title="ThreeDGarden"
            alt="ThreeDGarden" />
          <h2>ThreeDGarden</h2>
        </div>
        <div className="smallModal-body">
          <h3>Share Plan</h3>
          <button
            id="getShareLinkBtn"
            className="mediumButton"
            onClick="generateShareLink();">
            Generate Share Link
          </button>
          <div style={{ margin: "10px 0px 10px 0px" }}>
            <div style={{ paddingTop: "6px" }}>
              <label htmlFor="shareLinkUrl">Editable Copy</label><br />
              <input
                type="text"
                id="shareLinkUrl"
                placeholder="Press 'Generate Share Link' button"
                style={{
                  width: "580px",
                  backgroundColor: "#4e4e4e",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace",
                  padding: "4px 24px 4px 24px",
                  pointerEvents: "none"
                }} />&nbsp;
              <button
                id="copyShareLinkBtn"
                className="smallButton"
                onClick="copyShareLink();">
                Copy
              </button>
            </div>

            <div style={{ paddingTop: "6px" }}>
              <label htmlFor="shareLinkUrl3d">Read Only 3d View</label><br />
              <input
                type="text"
                id="shareLinkUrl3d"
                placeholder="Press 'Generate Share Link' button"
                style={{
                  width: "580px",
                  backgroundColor: "#4e4e4e",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace",
                  padding: "4px 24px 4px 24px",
                  pointerEvents: "none"
                }} />&nbsp;
              <button
                id="copyShareLinkBtn"
                className="smallButton"
                onClick="copyShareLink3d();">
                Copy
              </button>
            </div>

            <div style={{ paddingTop: "6px" }}>
              <label htmlFor="shareLinkUrlPlan">Read Only Plan View</label><br />
              <input
                type="text"
                id="shareLinkUrlPlan"
                placeholder="Press 'Generate Share Link' button"
                style={{
                  width: "580px",
                  backgroundColor: "#4e4e4e",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace",
                  padding: "4px 24px 4px 24px",
                  pointerEvents: "none"
                }} />&nbsp;
              <button
                id="copyShareLinkBtn"
                className="smallButton"
                onClick="copyShareLinkPlan();">
                Copy
              </button>
            </div>
          </div>
        </div>
        <div className="smallModal-footer">
          <h3>
            <a href="http://threedgarden.com">ThreeDGarden</a> &copy; Company
            Juice.&nbsp;Version 0.1.1.1
          </h3>
        </div>
      </div>
    </div>
  )
}

const ToolBar = (): JSX.Element => {
  // console.debug("ToolBar")
  useEffect(() => {
    console.debug('ToolBar onMount')
    return () => {
      console.debug('ToolBar onUnmount')
    }
  }, [])

  const setNewPlan: MouseEventHandler<HTMLAnchorElement> = (): any => {
    alert("HEY HEY HEY setNewPlan")
    try {
      // resetPlan(),
      //   (planHistory = []),
      //   (planHistoryPosition = 0),
      //   planHistory.push(JSON.stringify(plan)),
      //   setToolMode("pointer"),
      localStorage.clear()
      console.log("[MM] setNewPlan TRY: localStorage.clear()")
      // LINE 1098 B3MM
      localStorage.setItem("plan", JSON.stringify({ "word": "HEY HEY HEY, LINE 1098 setItem plan -- setNewPlan" }))
    } catch (e) {
      console.log("[MM] setNewPlan CATCH e:", e)
    }
  }

  const doUndo: MouseEventHandler<HTMLAnchorElement> = (): any => {
    alert("HEY HEY HEY doUndo")
    try {
      // resetPlan(),
      //   (planHistory = []),
      //   (planHistoryPosition = 0),
      //   planHistory.push(JSON.stringify(plan)),
      //   setToolMode("pointer"),
      localStorage.clear()
      console.log("[MM] doUndo TRY: localStorage.clear()")
      // LINE 1098 B3MM
      localStorage.setItem("plan", JSON.stringify({ "word": "HEY HEY HEY, LINE 1098 setItem plan -- doUndo" }))
    } catch (e) {
      console.log("[MM] doUndo CATCH e:", e)
    }
  }

  const doRedo: MouseEventHandler<HTMLAnchorElement> = (): any => {
    alert("HEY HEY HEY doRedo")
    try {
      // resetPlan(),
      //   (planHistory = []),
      //   (planHistoryPosition = 0),
      //   planHistory.push(JSON.stringify(plan)),
      //   setToolMode("pointer"),
      localStorage.clear()
      console.log("[MM] doRedo TRY: localStorage.clear()")
      // LINE 1098 B3MM
      localStorage.setItem("plan", JSON.stringify({ "word": "HEY HEY HEY, LINE 1098 setItem plan -- doRedo" }))
    } catch (e) {
      console.log("[MM] doRedo CATCH e:", e)
    }
  }

  return (
    <div id="toolBar">
      <ul>
        <li className="dropdown">
          <a className="dropbtn">
            File
          </a>
          <div className="dropdown-content">
            {/* <a onClick="setNewPlan();"> */}
            <a onClick={setNewPlan}>
              New
            </a>
            {/*
            <a
              id="loadBtn"
              onClick="document.getElementById('file').click();">
              Load
            </a>
            <input
              type="file"
              style={{ display: "none" }}
              id="file"
              name="file"
              onChange="loadFileAsText(event)" />
            <a
              id="saveBtn"
              onClick="savePlan();">
              Save
            </a>
            <a
              id="shareBtn"
              onClick="openShareDialog();">
              Share
            </a>
            <hr />
            <a
              id="defaultsBtn"
              onClick="setPropertiesView('defaults');">
              Defaults
            </a>
            <a
              id="groundPropertiesButton"
              onClick="setToolMode('ground');">
              Ground Properties
            </a>
            <a
              id="fullscreenApp"
              onClick="openFullscreen('DEMO');">
              Fullscreen
            </a>
            */}
          </div>
        </li>
        <li className="dropdown">
          <a className="dropbtn">
            Edit
          </a>
          <div className="dropdown-content">
            <a id="undoBtn" onClick={doUndo}>Undo</a>
            <a id="redoBtn" onClick={doRedo}>Redo</a>
          </div>
        </li>
        {/* <li className="dropdown">
          <a className="dropbtn">
            Plan View
          </a>
          <div className="dropdown-content">
            <a onClick="setPropertiesView('planView');">Background Template</a>
            <a onClick="newLevel();">Add Level</a>
            <a onClick="openFullscreen('planView');">Fullscreen</a>
          </div>
        </li> */}
        {/* <li className="dropdown">
          <a className="dropbtn">
            3D View
          </a>
          <div className="dropdown-content">
            <a onClick="setPropertiesView('3dView');">Properties</a>
            <a onClick="openFullscreen('view3d');">Fullscreen</a>
            <a onClick="exportToObj();">Export As OBJ</a>
            <a id="createThumb" onClick="createThumbForHistory();">Create Thumb</a>
          </div>
        </li> */}
        {/* <li>
          <a onClick="doLog()">Log</a>
        </li>
        <li>
          <a onClick="showAbout()">About</a>
        </li> */}
        <li id="deleteme" style={{ width: "auto" }}>
          &nbsp;&nbsp;&nbsp;&nbsp;
          TOOLS:
          &nbsp;&nbsp;
        </li>
        {/*
        <li>
          <a
            id="pointerTool"
            onClick="setToolMode('pointer');"
            className="toolButton activeTool"
            title="Pointer Select"
            alt="Pointer Select">
            <img src="/demo/media/pointericonWhite.png" height="24px" />
          </a>
        </li>
        <li>
          <a
            id="handTool"
            onClick="setToolMode('hand');"
            className="toolButton"
            title="Hand Tool"
            alt="Hand Tool">
            <img src="/demo/media/handIcon.gif" height="24px" />
          </a>
        </li>
        <li>
          <a
            id="addWallTool"
            onClick="setToolMode('walls');"
            className="toolButton"
            title="Add Wall"
            alt="Add Wall">
            <img src="/demo/media/newWallWhite2.png" height="24px" />
          </a>
        </li>
        <li>
          <a
            id="addFloorTool"
            onClick="setToolMode('floor');"
            className="toolButton"
            title="Add Floor"
            alt="Add Floor">
            <img src="/demo/media/newFloorWhite2.png" height="24px" />
          </a>
        </li>
        <li>
          <a
            id="addRoofTool"
            onClick="setToolMode('roof');"
            className="toolButton"
            title="Add Roof"
            alt="Add Roof">
            <img src="/demo/media/newRoofWhite2.png" height="24px" />
          </a>
        </li>
        <li>
          <a
            id="addRulerTool"
            onClick="setToolMode('dimension');"
            className="toolButton"
            title="Add Dimension"
            alt="Add Dimension">
            <img src="/demo/media/newRulerWhite2.png" height="24px" />
          </a>
        </li>
        <li>
          <a
            id="addTextTool"
            onClick="setToolMode('text');"
            className="toolButton"
            title="Add Text Annotation"
            alt="Add Text Annotation">
            <img src="/demo/media/newTextWhite.png" height="24px" />
          </a>
        </li>
        */}
      </ul>
    </div>
  )
}

const CatalogView = (): JSX.Element => {
  // console.debug("CatalogView")
  useEffect(() => {
    console.debug('CatalogView onMount')
    return () => {
      console.debug('CatalogView onUnmount')
    }
  }, [])
  return (
    <div id="catalogView">
      <div id="catalogFilters">
        <input type="text" id="catalogTextFilter" placeholder="Filter" />
      </div>
      <div id="catalogItems"></div>
    </div>
  )
}

const PropertiesView = (): JSX.Element => {
  // console.debug("PropertiesView")
  useEffect(() => {
    console.debug('PropertiesView onMount')
    return () => {
      console.debug('PropertiesView onUnmount')
    }
  }, [])
  return (
    <div id="propertiesView" style={{ paddingLeft: "10px" }}>
      <div id="furniture3DModelPropertiesView" style={{ display: "none" }}>
        <h3>3d Model Properties</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td colSpan="2" style={{ textAlign: "center" }}>
              <div
                onMouseDown="beginDrag(event, modalModel3dFurnitureId);"
                className="disableSelection">
                <img
                  id="model3dLargeThumb"
                  className="disableSelection"
                  style={{ pointerEvents: "none" }} />
              </div>
            </td>
          </tr>
          <tr>
            <td width="70">Name</td>
            <td><span id="model3dName"></span></td>
          </tr>
          <tr>
            <td>Author</td>
            <td><span id="model3dAuthor"></span></td>
          </tr>
          <tr>
            <td>License</td>
            <td><span id="model3dLicense"></span></td>
          </tr>
          <tr>
            <td>3D Model</td>
            <td>
              <button className="moreInfoBtn" onClick="showModel3dView();">
                View
              </button>
            </td>
          </tr>
        </table>
      </div>
      <div id="furniturePropertiesView" style={{ display: "none" }}>
        <h3>Furniture Properties</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td width="70">Id</td>
            <td><span id="objectId"></span></td>
          </tr>
          <tr>
            <td>Name</td>
            <td><span id="objectName"></span></td>
          </tr>
          <tr>
            <td>X</td>
            <td>
              <input
                type="text"
                id="furnitureXProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusOrMinusNumber(this, updateFurniturePosX);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Z</td>
            <td>
              <input
                type="text"
                id="furnitureZProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusOrMinusNumber(this, updateFurniturePosZ);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Y</td>
            <td>
              <input
                type="text"
                id="furnitureYProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusOrMinusNumber(this, updateFurniturePosY);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Width</td>
            <td>
              <input
                type="text"
                id="furnitureWidthProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateFurnitureWidth);"
                maxLength="8" />
              cm
              <input
                type="checkbox"
                id="flipX"
                onChange="flipX(this.checked)" />Flip X
            </td>
          </tr>
          <tr>
            <td>Depth</td>
            <td>
              <input
                type="text"
                id="furnitureDepthProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateFurnitureDepth);"
                maxLength="8" />
              cm
              <input
                type="checkbox"
                id="flipZ"
                onChange="flipZ(this.checked)" />Flip Z
            </td>
          </tr>
          <tr>
            <td>Height</td>
            <td>
              <input
                type="text"
                id="furnitureHeightProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusOrMinusNumber(this, updateFurnitureHeight);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Angle</td>
            <td><span id="furnitureAngleProp"></span>°</td>
          </tr>
          <tr>
            <td>Level</td>
            <td><span id="furnitureLevelProp"></span></td>
          </tr>
          <tr>
            <td>3D Model</td>
            <td>
              <button className="moreInfoBtn" onClick="showModel3dView();">
                View
              </button>
            </td>
          </tr>
        </table>
      </div>
      <div id="defaultsPropertiesView" style={{ display: "none" }}>
        <h3>Default Settings</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td>Compass Heading</td>
            <td>
              <input
                type="range"
                id="compassHdg"
                name="compassHdg"
                min="0"
                max="360"
                step="1"
                value="0"
                onInput="rotateCompass(this.value)"
                onChange="rotateCompass(this.value)" />
              <span id="compassHdgLbl">0°</span>
            </td>
          </tr>
        </table>
      </div>
      <div id="wallDefaultsPropertiesView" style={{ display: "none" }}>
        <h3>Default Wall Settings</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td width="70">Wall Height</td>
            <td>
              <input
                type="text"
                id="defaultWallHeightProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateDefaultWallHeight);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Wall Thickness</td>
            <td>
              <input
                type="text"
                id="defaultWallThicknessProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateDefaultWallThickness);"
                maxLength="8" />
              cm
            </td>
          </tr>
        </table>
      </div>
      <div id="floorDefaultsPropertiesView" style={{ display: "none" }}>
        <h3>Default Floor Settings</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td>Floor Thickness</td>
            <td>
              <input
                type="text"
                id="defaultFloorThicknessProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateDefaultFloorThickness);"
                maxLength="8" />
              cm
            </td>
          </tr>
        </table>
      </div>
      <div id="roofDefaultsPropertiesView" style={{ display: "none" }}>
        <h3>Default Roof Settings</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td>Roof Thickness</td>
            <td>
              <input
                type="text"
                id="defaultRoofThicknessProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateDefaultRoofThickness);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Rise</td>
            <td>
              <input
                type="text"
                id="defaultRoofRiseProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateDefaultRoofRise);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Base Offset</td>
            <td>
              <input
                type="text"
                id="defaultRoofStartHeightProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusOrMinusNumber(this, updateDefaultRoofStartHeight);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Run</td>
            <td>
              <input
                type="text"
                id="defaultRoofWidthProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateDefaultRoofWidth);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Rafter Length</td>
            <td><span id="defaultRafterLengthProp"></span> cm</td>
          </tr>
          <tr>
            <td>Roof Pitch</td>
            <td><span id="defaultRoofPitchProp"></span>°</td>
          </tr>
        </table>
      </div>
      <div id="dimensionDefaultsPropertiesView" style={{ display: "none" }}>
        <h3>Default Dimension Settings</h3>
      </div>
      <div id="textDefaultsPropertiesView" style={{ display: "none" }}>
        <h3>Default Text Settings</h3>
      </div>

      <div id="planViewPropertiesView" style={{ display: "none" }}>
        <h3>Background Template</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td width="70">File</td>
            <td>
              <input
                type="file"
                id="backgroundImageFile"
                name="backgroundImageFile"
                onChange="loadBackgroundImage(event)" />
            </td>
          </tr>
          <tr>
            <td>Opacity</td>
            <td>
              <input
                type="range"
                id="bgTemplateOpacity"
                name="bgTemplateOpacity"
                min="0"
                max="1.0"
                step=".01"
                value="0.33"
                onInput="setBgTemplateOpacity(this.value)"
                onChange="setBgTemplateOpacity(this.value)" />
            </td>
          </tr>
          <tr>
            <td>Flip Horizontal</td>
            <td>
              <input
                type="checkbox"
                id="bgTplFlipX"
                onChange="flipBackgroundTemplateX(this.checked)" />
            </td>
          </tr>
          <tr>
            <td>Flip Vertical</td>
            <td>
              <input
                type="checkbox"
                id="bgTplFlipZ"
                onChange="flipBackgroundTemplateZ(this.checked)" />
            </td>
          </tr>
          <tr>
            <td width="60"></td>
            <td>
              <button
                id="resizeBackgroundImageBtn"
                onClick="enableResizeBackgroundTemplate();"
                className="moreInfoBtn">
                Resize
              </button>
            </td>
          </tr>
          <tr>
            <td width="60"></td>
            <td>
              <button
                id="deleteBackgroundImageBtn"
                onClick="deleteBackgroundImage()"
                className="moreInfoBtn">
                Delete
              </button>
            </td>
          </tr>
        </table>
      </div>
      <div id="3dViewPropertiesView" style={{ display: "none" }}>
        <h3>3d View Properties</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td width="70">Wall Color</td>
            <td>
              <input
                type="hidden"
                id="wallDiffuse"
                value="rgba(255,255,255,0.5)" />
            </td>
          </tr>
          <tr>
            <td width="70">Wall Specular</td>
            <td>
              <input type="hidden" id="wallSpecular" value="#00ff00" />
            </td>
          </tr>
          <tr>
            <td width="70">Wall Emissive</td>
            <td>
              <input type="hidden" id="wallEmissive" value="#ffffff" />
            </td>
          </tr>
          <tr>
            <td width="70">Floor Color</td>
            <td>
              <input
                type="hidden"
                id="floorDiffuse"
                value="rgba(15,15,15,0.5)" />
            </td>
          </tr>
          <tr>
            <td width="70">Floor Specular</td>
            <td>
              <input type="hidden" id="floorSpecular" value="#00ffff" />
            </td>
          </tr>
          <tr>
            <td width="70">Roof Color</td>
            <td>
              <input
                type="hidden"
                id="roofDiffuse"
                value="rgba(255,255,255,0.5)" />
            </td>
          </tr>
          <tr>
            <td width="70">Roof Specular</td>
            <td>
              <input type="hidden" id="roofSpecular" value="#ff0000" />
            </td>
          </tr>
          <tr>
            <td>Ground Color</td>
            <td>
              <input
                type="hidden"
                id="groundDiffuse"
                value="rgba(03,141,221,1.0)" />
            </td>
          </tr>
          <tr>
            <td>Ground Specular</td>
            <td>
              <input type="hidden" id="groundSpecular" value="#f2ff9c" />
            </td>
          </tr>
          <tr>
            <td width="70">Depth Write</td>
            <td>
              <input
                type="checkbox"
                id="depthWriteMode"
                onChange="setDepthWriteMode(this.checked);" />
            </td>
          </tr>
          <tr>
            <td width="70">Sort Objects</td>
            <td>
              <input
                type="checkbox"
                id="sortObjectsMode"
                onChange="setSortObjectsMode(this.checked);" />
            </td>
          </tr>
          <tr>
            <td>Sun Azimuth</td>
            <td>
              <input
                type="range"
                id="sunAzimuth"
                name="sunAzimuth"
                min="0"
                max="1.0"
                step=".01"
                value="0.33"
                onInput="setSunAzimuth(this.value)"
                onChange="setSunAzimuth(this.value)" />
            </td>
          </tr>
          <tr>
            <td>Sun Incline</td>
            <td>
              <input
                type="range"
                id="sunIncline"
                name="sunIncline"
                min="0"
                max="1.0"
                step=".01"
                value="0.0"
                onInput="setSunIncline(this.value)"
                onChange="setSunIncline(this.value)" />
            </td>
          </tr>
          <tr>
            <td>Ambient Intensity</td>
            <td>
              <input
                type="range"
                id="ambientLightBrightness"
                name="ambientLightBrightness"
                min="0.0"
                max="1.0"
                step="0.1"
                onInput="adjustAmbientLightBrightness(this.value)"
                onChange="adjustAmbientLightBrightness(this.value)" />
            </td>
          </tr>
          <tr>
            <td>Directional Intensity</td>
            <td>
              <input
                type="range"
                id="dirLightBrightness"
                name="dirLightBrightness"
                min="0.0"
                max="1.0"
                step="0.1"
                onInput="adjustDirLightBrightness(this.value)"
                onChange="adjustDirLightBrightness(this.value)" />
            </td>
          </tr>
          <tr>
            <td>Hemisphere Intensity</td>
            <td>
              <input
                type="range"
                id="hemiLightBrightness"
                name="hemiLightBrightness"
                min="0.0"
                max="1.0"
                step="0.1"
                onInput="adjustHemiLightBrightness(this.value)"
                onChange="adjustHemiLightBrightness(this.value)" />
            </td>
          </tr>
        </table>
      </div>
      <div id="wallPropertiesView" style={{ display: "none" }}>
        <h3>Wall Properties</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td width="70">Id</td>
            <td>
              <input type="hidden" id="wallIdHidden" />
              <span id="wallIdProp"></span>
            </td>
          </tr>
          <tr>
            <td>Height</td>
            <td>
              <input
                type="text"
                id="wallHeightProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateWallHeight);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Height Start</td>
            <td>
              <input
                type="text"
                id="wallHeight0Prop"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateWallHeight0);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Height End</td>
            <td>
              <input
                type="text"
                id="wallHeight1Prop"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateWallHeight1);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Thickness</td>
            <td>
              <input
                type="text"
                id="wallThicknessProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateWallThickness);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Level</td>
            <td><span id="wallLevelProp"></span></td>
          </tr>
        </table>
      </div>
      <div id="roofPropertiesView" style={{ display: "none" }}>
        <h3>Roof Properties</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td width="70">Id</td>
            <td>
              <input type="hidden" id="roofIdHidden" />
              <span id="roofIdProp"></span>
            </td>
          </tr>
          <tr>
            <td>Thickness</td>
            <td>
              <input
                type="text"
                id="roofThicknessProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateRoofThickness);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Rise</td>
            <td>
              <input
                type="text"
                id="roofRiseProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateRoofRise);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Base Offset</td>
            <td>
              <input
                type="text"
                id="roofStartHeightProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusOrMinusNumber(this, updateRoofStartHeight);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Run</td>
            <td>
              <input
                type="text"
                id="roofWidthProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateRoofWidth);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Rafter Length</td>
            <td><span id="rafterLengthProp"></span> cm</td>
          </tr>
          <tr>
            <td>Roof Pitch</td>
            <td><span id="roofPitchProp"></span>°</td>
          </tr>
          <tr>
            <td>Level</td>
            <td><span id="roofLevelProp"></span></td>
          </tr>
        </table>
      </div>
      <div id="floorPropertiesView" style={{ display: "none" }}>
        <h3>Floor Properties</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td width="70">Id</td>
            <td><span id="floorIdProp"></span></td>
          </tr>
          <tr>
            <td>Area</td>
            <td><span id="floorAreaProp"></span></td>
          </tr>
          <tr>
            <td>Thickness</td>
            <td><span id="floorThicknessProp"></span></td>
          </tr>
          <tr>
            <td>Level</td>
            <td><span id="floorLevelProp"></span></td>
          </tr>
        </table>
      </div>
      <div id="dimensionPropertiesView" style={{ display: "none" }}>
        <h3>Dimension Properties</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td width="70">Id</td>
            <td><span id="dimensionIdProp"></span></td>
          </tr>
          <tr>
            <td>Length</td>
            <td><span id="dimensionLengthProp"></span></td>
          </tr>
          <tr>
            <td>Adjacent</td>
            <td><span id="dimensionAdjacentProp"></span></td>
          </tr>
          <tr>
            <td>Level</td>
            <td><span id="dimensionLevelProp"></span></td>
          </tr>
        </table>
      </div>
      <div id="textPropertiesView" style={{ display: "none" }}>
        <h3>Text Annotation Properties</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td width="70">Id</td>
            <td><span id="textIdProp"></span></td>
          </tr>
          <tr>
            <td>Text</td>
            <td>
              <input
                type="text"
                id="textValueProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onKeyUp="validateText(event, this, updateTextValue);"
                maxLength="100" />
            </td>
          </tr>
          <tr>
            <td>X</td>
            <td>
              <input
                type="text"
                id="textXProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusOrMinusNumber(this, updateTextX);"
                maxLength="8" />
            </td>
          </tr>
          <tr>
            <td>Y</td>
            <td>
              <input
                type="text"
                id="textYProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusOrMinusNumber(this, updateTextY);"
                maxLength="8" />
            </td>
          </tr>
          <tr>
            <td>Level</td>
            <td><span id="textLevelProp"></span></td>
          </tr>
        </table>
        <div>Type<span id="textDataTypeProp"></span></div>
        <div><button id="deleteTextAnnotationBtn" onClick="deleteTextBtnClick()">Delete</button></div>
      </div>
      <div id="levelPropertiesView" style={{ display: "none" }}>
        <h3>Level Properties</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td width="70">Id</td>
            <td><span id="levelIdProp"></span></td>
          </tr>
          <tr>
            <td>Name</td>
            <td><span id="levelNameProp"></span></td>
          </tr>
          <tr>
            <td>Height</td>
            <td>
              <input
                type="text"
                id="levelHeightProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusOrMinusNumber(this, updateLevelHeight);"
                maxLength="8" />
            </td>
          </tr>
        </table>
      </div>
      <div id="groundPropertiesView" style={{ display: "none" }}>
        <h3>Ground Layer Properties</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td>Width</td>
            <td>
              <input
                type="text"
                id="groundWidthProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateGroundWidth);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Legth</td>
            <td>
              <input
                type="text"
                id="groundLengthProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateGroundLength);"
                maxLength="8" />
              cm
            </td>
          </tr>
        </table>
      </div>
    </div>
  )
}

const PlanView = (): JSX.Element => {
  // console.debug("PlanView")
  useEffect(() => {
    console.debug('PlanView onMount')
    return () => {
      console.debug('PlanView onUnmount')
    }
  }, [])
  return (
    <div id="planView">
      <canvas id="planCanvas" width="1024" height="450"></canvas>
      <div id="overlayLogoPlanView" className="overlayLogo">
        <a
          href="https://threedgarden.com"
          style={{ float: "left", padding: "0px", marginTop: "0px" }}>
          <img
            src="favicon/favicon.png"
            height="77px"
            title="ThreeDGarden"
            alt="ThreeDGarden" />
        </a>
        <a
          href="https://threedgarden.com"
          style={{ paddingLeft: "10px", textDecoration: "none", fontSize: "32px" }}
        >ThreeDGarden</a>
      </div>
      <div id="overlayMenuPlanView">
        <button
          id="overlayPlanViewRecenterBtn"
          onClick="recenterPlanView()"
          className="smallButton">
          Recenter
        </button>
        <button
          id="overlayPlanViewGoto3dViewBtn"
          onClick="goto3dView()"
          className="smallButton">
          3d View
        </button>
      </div>
    </div>
  )
}

const TheBottom = (): JSX.Element => {
  // console.debug("MyComponent")
  useEffect(() => {
    console.debug('MyComponent onMount')
    return () => {
      console.debug('MyComponent onUnmount')
    }
  }, [])
  return (
    <div>
      <canvas
        id="rulerLeft"
        width="30"
        height="500"
        onMouseDown="addVerticalGuide();"
        onMouseUp="removeVerticalGuide()"></canvas>
      <canvas
        id="rulerBottom"
        width="1024"
        height="20"
        onMouseDown="addHorizontalGuide();"
        onMouseUp="removeHorizontalGuide()"></canvas>

      <div id="mouseIndicatorY"></div>
      <div id="mouseIndicatorX"></div>

      <div id="compass"></div>

      <div id="view3d">
        <canvas id="threeCanvas"></canvas>
        <div id="overlayLogo3dView" className="overlayLogo">
          <a
            href="/"
            style={{ float: "left", padding: "0px", marginTop: "0px" }}
          ><img
              src="favicon/favicon.png"
              height="77px"
              title="ThreeDGarden"
              alt="ThreeDGarden" /></a>&nbsp;
          <a
            href="/"
            style={{ paddingLeft: "10px", textDecoration: "none", fontSize: "32px" }}
          >ThreeDGarden</a>
        </div>
        <div id="overlayMenu3dView">
          <button
            id="overlay3dviewRecenterBtn"
            onClick="recenter3dview()"
            className="smallButton">
            Recenter
          </button>
          <button
            id="overlay3dviewGotoPlanViewBtn"
            onClick="gotoPlanView()"
            className="smallButton">
            Plan View
          </button>
        </div>
      </div>
      <div id="verticalSlider"></div>
      <div id="horizontalSliderLeft"></div>
      <div id="horizontalSliderRight"></div>

      <div id="furnitureDragDiv"></div>

      <img
        id="fullscreenPlanViewBtn"
        src="/demo/media/fullscreen.png"
        width="30"
        height="30"
        onClick="openFullscreen('planView');" />
      <img
        id="fullscreen3dViewBtn"
        src="/demo/media/fullscreen.png"
        width="30"
        height="30"
        onClick="openFullscreen('view3d');" />

      <progress value="50" max="100" className="center" id="progressBar"></progress>
    </div>
  )
}

const ReactThreeFiberView = (): JSX.Element => {
  // console.debug("MyComponent")
  useEffect(() => {
    console.debug('MyComponent onMount')
    return () => {
      console.debug('MyComponent onUnmount')
    }
  }, [])
  return (
    <div id="canvas-container">
      <Canvas>
        <mesh>
          <boxBufferGeometry />
          <meshBasicMaterial />
        </mesh>
      </Canvas>
    </div>
  )
}

const MyComponent = (): JSX.Element => {
  // console.debug("MyComponent")
  useEffect(() => {
    console.debug('MyComponent onMount')
    return () => {
      console.debug('MyComponent onUnmount')
    }
  }, [])
  return (
    <div>...MyComponent [returns] JSX here...</div>
  )
}

const ThreeDGarden = (): JSX.Element => {
  const word = `[MM] HEY HEY HEY @ ${new Date().toISOString()}`
  const title = useRef()
  // const root = useRef()
  // const scene = new THREE.Scene()
  useEffect(() => {
    console.debug('ThreeDGarden onMount', word)
    // bootManager()
    return () => {
      console.debug('ThreeDGarden onUnmount', word)
    }
  }, [])
  return (
    <div id="threedgarden-div" style={{ width: "100%" }}>
      {/* <div ref={title}>ThreeDGarden: {word}</div> */}
      {/* <div ref={root}>Three root</div> */}

      {/* jQuery Three Messy Happy */}
      <div id="DEMO">
        {/* <AboutModal /> */}
        {/* <Model3dModal /> */}
        {/* <LoadingModal /> */}
        {/* <ShareModal /> */}
        <ToolBar />

        {/* React Three Fiber - View */}
        {/* <ReactThreeFiberView /> */}

        {/* <CatalogView /> */}
        {/* <PropertiesView /> */}
        {/* <PlanView /> */}

        {/* <TheBottom /> */}
      </div>
    </div >
  )
}

export default ThreeDGarden
