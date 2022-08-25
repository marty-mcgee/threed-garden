// "use strict"
console.log("[MM] HEY HEY HEY -- B3 -- export function x()")
export function deselectAll() {
  try {
    ;(mouseMode = -1),
      selectedItem &&
        selectedItem.data &&
        (selectedItem.data.toolsRectangleInner &&
          (selectedItem.data.toolsRectangleInner.visible = !1),
        selectedItem.data.boxHelper &&
          (selectedItem.data.boxHelper.visible = !1),
        "dimension" === selectedItem.data.type &&
          ((Dimensions[selectedItem.data.id].text.selected = !1),
          (Dimensions[selectedItem.data.id].line.selected = !1)),
        (selectedItem.selected = !1),
        (selectedItem = null),
        (toolsGroup.visible = !1),
        updateObjectPropertiesWindow()),
      wallHelperPath && (wallHelperPath.visible = !1),
      roofHelperPath && (roofHelperPath.visible = !1),
      movePointIcons.forEach(function (e) {
        e.remove()
      }),
      (movePointIcons = []),
      (offsetMousePoint = new paper.Point(0, 0))
  } catch (e) {
    console.log(e)
  }
}
function addVerticalGuide() {
  const e = paper.view.viewToProject(
    new paper.Point(
      event.pageX - planView.offsetLeft,
      event.pageY - planView.offsetTop
    )
  )
  const t = new paper.Point(e.x, -100)
  const o = new paper.Point(e.x, 100)
  const a = new paper.Path.Line(t, o)
  ;(a.strokeColor = "#00ff88"),
    (a.strokeWidth = 1),
    (a.strokeScaling = !1),
    (a.data.type = "verticalGuide"),
    (a.data.level = -1),
    guideCounter++,
    (a.data.id = guideCounter),
    (verticalGuides[guideCounter] = a),
    guidesGroup.addChild(a),
    (selectedGuideId = guideCounter),
    redrawGrid(),
    (draggingNewGuide = !0),
    (mouseMode = 9),
    (plan.verticalGuides = verticalGuides)
}
function addHorizontalGuide() {
  let e = paper.view.viewToProject(
      new paper.Point(
        event.pageX - planView.offsetLeft,
        event.pageY - planView.offsetTop
      )
    ),
    t = new paper.Point(-100, e.y),
    o = new paper.Point(100, e.y),
    a = new paper.Path.Line(t, o)
  ;(a.strokeColor = "#00ff88"),
    (a.strokeWidth = 1),
    (a.strokeScaling = !1),
    (a.data.type = "horizontalGuide"),
    (a.data.level = -1),
    guideCounter++,
    (a.data.id = guideCounter),
    (horizontalGuides[guideCounter] = a),
    guidesGroup.addChild(a),
    (selectedGuideId = guideCounter),
    redrawGrid(),
    (draggingNewGuide = !0),
    (mouseMode = 10),
    (plan.horizontalGuides = horizontalGuides)
}
function removeVerticalGuide() {
  try {
    selectedGuideId > 0 &&
      (verticalGuides[selectedGuideId].remove(),
      delete verticalGuides[selectedGuideId],
      delete plan.verticalGuides[selectedGuideId])
  } catch (e) {
    console.log("removeVerticalGuide " + e)
  }
}
function removeHorizontalGuide() {
  try {
    selectedGuideId > 0 &&
      (horizontalGuides[selectedGuideId].remove(),
      delete horizontalGuides[selectedGuideId],
      delete plan.horizontalGuides[selectedGuideId])
  } catch (e) {
    console.log("removeHorizontalGuide " + e)
  }
}
function resizePlanView() {
  if ("3dView" != UILayout) {
    let e = planCanvas.parentNode.getBoundingClientRect().width,
      t = planCanvas.parentNode.getBoundingClientRect().height
    ;(planCanvas.width = e),
      (planCanvas.height = t),
      (rulerBottom.width = e),
      (rulerLeft.height = t),
      (rulerBottomCtx.font = "12px Courier"),
      (rulerBottomCtx.textAlign = "center"),
      (rulerBottomCtx.fillStyle = "white"),
      (rulerLeftCtx.font = "12px Courier"),
      (rulerLeftCtx.textAlign = "right"),
      (rulerLeftCtx.fillStyle = "white"),
      (paper.view.viewSize.width = e),
      (paper.view.viewSize.height = t),
      redrawGrid()
  }
}
function onCanvasResize() {
  ;(camera.aspect = window.innerWidth / window.innerHeight),
    camera.updateProjectionMatrix(),
    renderer.setSize(window.innerWidth, window.innerHeight)
}
function initThreeJS() {
  ;(scene = new THREE.Scene()), (scene.background = new THREE.Color(0))
  let e = new THREE.PlaneBufferGeometry(100 * groundWidth, 100 * groundLength)
  ;(groundMat = new THREE.MeshPhongMaterial({ transparent: !0, opacity: 1 })),
    (groundMat.color = new THREE.Color(2304293)),
    (groundMat.specular = new THREE.Color(15925148)),
    (ground = new THREE.Mesh(e, groundMat)),
    (ground.rotation.x = -Math.PI / 2),
    (ground.position.y = -2),
    (ground.name = "groundLayer"),
    "3dView" === UILayout && (ground.visible = !1),
    scene.add(ground),
    (clickableObjectsCounter = 0),
    (clickableObjects[clickableObjectsCounter] = ground),
    (renderer = new THREE.WebGLRenderer({
      antialias: !0,
      preserveDrawingBuffer: !0,
      logarithmicDepthBuffer: !0,
      canvas: threeCanvas,
    })),
    renderer.setClearColor(0),
    renderer.setPixelRatio(window.devicePixelRatio),
    (container = document.getElementById("view3d")),
    renderer.setSize(
      parseInt(container.clientWidth),
      parseInt(container.clientHeight)
    ),
    (renderer.autoClear = !1),
    (renderer.sortObjects = !1),
    (renderer.domElement.ondblclick = onDoubleClick),
    (camera = new THREE.PerspectiveCamera(
      45,
      container.innerWidth / container.innerHeight,
      10,
      25e3
    )),
    (camera.position.x = 0),
    (camera.position.y = 265),
    (camera.position.z = 1e3),
    camera.lookAt(new THREE.Vector3(0, 0, 0)),
    (controls = new THREE.TrackballControls(camera, container)),
    (controls.rotateSpeed = 4),
    (controls.zoomSpeed = 5),
    (controls.panSpeed = 1.5),
    (controls.noZoom = !1),
    (controls.noPan = !1),
    (controls.staticMoving = !0),
    (controls.dynamicDampingFactor = 0.3),
    (controls.keys = [65, 83, 68]),
    controls.addEventListener("change", render),
    (sky = new THREE.Sky()),
    sky.scale.setScalar(45e4),
    scene.add(sky),
    (sunSphere = new THREE.Mesh(
      new THREE.SphereBufferGeometry(2e4, 16, 8),
      new THREE.MeshBasicMaterial({ color: 16777215 })
    )),
    (sunSphere.position.y = -7e5),
    (sunSphere.visible = !1),
    scene.add(sunSphere)
  let t = sky.material.uniforms
  ;(t.turbidity.value = 14.6),
    (t.rayleigh.value = 0),
    (t.luminance.value = 1),
    (t.mieCoefficient.value = 0.008),
    (t.mieDirectionalG.value = 0.54),
    (inclination = 0),
    (azimuth = 0.33)
  let o = Math.PI * (inclination - 0.5),
    a = 2 * Math.PI * (azimuth - 0.5),
    n = 4e5
  ;(sunSphere.position.x = n * Math.cos(a)),
    (sunSphere.position.y = n * Math.sin(a) * Math.sin(o)),
    (sunSphere.position.z = n * Math.sin(a) * Math.cos(o)),
    (sunSphere.visible = !0),
    t.sunPosition.value.copy(sunSphere.position),
    (ambientLight = new THREE.AmbientLight(16777215, 0.3)),
    scene.add(ambientLight),
    (hemiLight = new THREE.HemisphereLight(16777215, 16777215, 0.2)),
    hemiLight.color.setHSL(0.6, 1, 0.6),
    hemiLight.groundColor.setHSL(0.095, 1, 0.75),
    hemiLight.position.copy(sunSphere.position),
    scene.add(hemiLight),
    (dirLight = new THREE.DirectionalLight(16777215, 0.9)),
    dirLight.color.setHSL(0.1, 1, 0.95),
    dirLight.position.copy(sunSphere.position),
    scene.add(dirLight)
  let l = new THREE.BoxGeometry(
      defaultWallThickness,
      defaultWallHeight,
      defaultWallThickness
    ),
    i = new THREE.MeshStandardMaterial({
      color: 0,
      transparent: !0,
      opacity: 0.25,
    })
  ;(wallHelper3dCube = new THREE.Mesh(l, i)),
    (wallHelper3dCube.position.y = defaultWallHeight / 2),
    (wallHelper3dCube.visible = !1),
    scene.add(wallHelper3dCube),
    (l = new THREE.BoxGeometry(
      defaultRoofWidth,
      defaultRoofThickness,
      defaultRoofWidth
    )),
    (i = new THREE.MeshStandardMaterial({
      color: 0,
      transparent: !0,
      opacity: 0.25,
    })),
    (roofHelper3dCube = new THREE.Mesh(l, i)),
    (roofHelper3dCube.position.y = defaultRoofThickness / 2),
    (roofHelper3dCube.visible = !1),
    scene.add(roofHelper3dCube),
    window.addEventListener("resize", resizeViews, !1),
    (model3dViewContainer = document.getElementById("model3dView")),
    (model3dSceneCamera = new THREE.PerspectiveCamera(60, 2, 1, 1e4)),
    (model3dSceneCamera.position.x = 0),
    (model3dSceneCamera.position.y = 50),
    (model3dSceneCamera.position.z = 200),
    model3dSceneCamera.lookAt(new THREE.Vector3(0, 0, 0)),
    (model3dScene = new THREE.Scene())
  let r = new THREE.AmbientLight(16777215, 0.5)
  ;(model3dScene = new THREE.Scene()), model3dScene.add(r)
  let s = new THREE.HemisphereLight(16777215, 16777215, 0.2)
  s.color.setHSL(0.6, 1, 0.6),
    s.groundColor.setHSL(0.095, 1, 0.75),
    s.position.set(0, 50, 0),
    model3dScene.add(s)
  let d = new THREE.DirectionalLight(16777215, 0.9)
  d.color.setHSL(0.1, 1, 0.95),
    d.position.set(-3, 1.75, 3),
    d.position.multiplyScalar(30),
    model3dScene.add(d),
    model3dScene.add(model3dSceneCamera),
    (model3dViewCanvas = document.getElementById("model3dViewCanvas")),
    (model3dSceneRenderer = new THREE.WebGLRenderer({
      canvas: model3dViewCanvas,
      antialias: !0,
      alpha: !0,
    })),
    model3dSceneRenderer.setPixelRatio(window.devicePixelRatio),
    model3dSceneRenderer.setSize(1024, 512),
    model3dSceneRenderer.setClearColor(0, 0),
    (model3dSceneRenderer.gammaInput = !0),
    (model3dSceneRenderer.gammaOutput = !0),
    renderModel3d(),
    (wallMaterial = new THREE.MeshPhongMaterial()),
    (wallMaterial.color = new THREE.Color(16777215)),
    (wallMaterial.specular = new THREE.Color(65280)),
    (wallMaterial.transparent = !0),
    (wallMaterial.opacity = 0.5),
    (wallMaterial.depthWrite = !1),
    (wallMaterial.side = THREE.DoubleSide),
    (roofMaterial = new THREE.MeshPhongMaterial()),
    (roofMaterial.color = new THREE.Color(16777215)),
    (roofMaterial.specular = new THREE.Color(16711680)),
    (roofMaterial.transparent = !0),
    (roofMaterial.opacity = 0.5),
    (roofMaterial.lights = !0),
    (roofMaterial.depthWrite = !1),
    (roofMaterial.side = THREE.DoubleSide),
    (floorMaterial = new THREE.MeshPhongMaterial()),
    (floorMaterial.color = new THREE.Color(986895)),
    (floorMaterial.specular = new THREE.Color(65535)),
    (floorMaterial.transparent = !0),
    (floorMaterial.opacity = 0.5),
    (floorMaterial.depthWrite = !1),
    (floorMaterial.side = THREE.DoubleSide)
}
function showModel3dView() {
  let e = modalModel3dFurnitureId
  e !== -1 &&
    (model3dObjectRef && model3dScene.remove(model3dObjectRef),
    new THREE.MTLLoader()
      .setPath("objects/")
      .load(e + "/" + e + ".mtl", function (t) {
        ;(t.baseUrl = "objects/" + e + "/"),
          t.preload(),
          new THREE.OBJLoader()
            .setMaterials(t)
            .setPath("objects/")
            .load(
              e + "/" + e + ".obj",
              function (t) {
                try {
                  let o = new THREE.Box3().setFromObject(t)
                  ;(t.userData.width = o.max.x - o.min.x),
                    (t.userData.height = o.max.y - o.min.y),
                    (t.userData.depth = o.max.z - o.min.z)
                  for (let a = 0; a < t.children.length; a++) {
                    let n = o.min.x + (o.max.x - o.min.x) / 2,
                      l =
                        o.min.y +
                        (o.max.y - o.min.y) / 2 -
                        (o.max.y - o.min.y) / 2,
                      i = o.min.z + (o.max.z - o.min.z) / 2
                    t.children[a].translateX(-n),
                      t.children[a].translateY(-l),
                      t.children[a].translateZ(-i)
                  }
                  ;(t.position.x = 80),
                    (t.position.y = -(t.userData.height / 2)),
                    (t.position.z = 0),
                    model3dScene.add(t),
                    (model3dObjectRef = t),
                    renderModel3d()
                  let r = "",
                    s = new XMLHttpRequest()
                  ;(s.onreadystatechange = function () {
                    if (4 == this.readyState && 200 == this.status) {
                      let e = this.responseText,
                        t = e.split("\n")
                      t.forEach(function (e) {
                        e.startsWith("#") && (r += e + "\n")
                      }),
                        (document.getElementById(
                          "modalModel3dObjHeader"
                        ).value = r)
                    }
                  }),
                    s.open("GET", "objects/" + e + "/" + e + ".obj", !0),
                    s.send()
                } catch (e) {
                  console.dir(e)
                }
                setModalModelDescription(e),
                  $("#model3dModal").show(),
                  hideMouseIndicators(),
                  (model3dViewOpen = !0),
                  (progressBar.style.display = "none")
              },
              onProgress,
              onError
            )
      }))
}
function onDoubleClick(e) {
  if ((e.preventDefault(), 0 == e.button)) {
    ;(mouse.x = (e.offsetX / renderer.domElement.clientWidth) * 2 - 1),
      (mouse.y = 2 * -(e.offsetY / renderer.domElement.clientHeight) + 1),
      raycaster.setFromCamera(mouse, camera)
    let t = raycaster.intersectObjects(Object.values(clickableObjects), !0),
      o = !1
    t.forEach(function (e) {
      if (!o) {
        let t = "furniture"
        if (e.distance > 1) {
          if (parseInt(e.object.parent.name)) {
            parseInt(e.object.parent.name)
            o = !0
          } else if (e.object.name.startsWith("floor")) {
            let a = parseInt(e.object.name.substring(5))
            Floors[a].data.level === project.activeLayer.data.id &&
              ((o = !0), (t = "floor"))
          } else if (e.object.name.startsWith("roof")) {
            let n = parseInt(e.object.name.substring(4))
            Roofs[n].data.level === project.activeLayer.data.id &&
              ((o = !0), (t = "roof"))
          } else "groundLayer" === e.object.name && ((o = !0), (t = "ground"))
          if (
            o &&
            ((tween = new TWEEN.Tween(controls.target)
              .to({ x: e.point.x, y: e.point.y, z: e.point.z }, 500)
              .onUpdate(render)
              .start()),
            deselectAll(),
            "furniture" === t)
          ) {
            let l = Furniture[e.object.parent.name]
            setLevel(l.data.level),
              (selectedItem = Furniture[e.object.parent.name]),
              (mouseMode = 0),
              selectedItem.bringToFront(),
              l.data.toolsRectangleInner && l.data.toolsRectangleInner.remove(),
              (l.rotation = 0)
            let i = new paper.Path.Rectangle(l.bounds)
            ;(l.rotation = l.data.angle),
              (i.data.type = "toolsRectangle"),
              (i.strokeColor = "#b19064"),
              (i.strokeWidth = 1),
              (i.strokeScaling = !1),
              (i.locked = !0),
              i.rotate(l.data.angle),
              (l.data.toolsRectangleInner = i),
              (i.visible = !0),
              (Furniture[e.object.parent.name].data.boxHelper.visible = !0),
              redrawGrid(),
              (rotateIcon.visible = !0),
              (resizeIcon.visible = !0),
              (elevateIcon.visible = !0),
              (heightIcon.visible = !0),
              (toolsGroup.position = selectedItem.bounds.center),
              (toolsGroup.visible = !0),
              toolsGroup.bringToFront(),
              rotateIcon.bringToFront(),
              resizeIcon.bringToFront(),
              elevateIcon.bringToFront(),
              heightIcon.bringToFront(),
              (rotateIcon.data.level = project.activeLayer.data.id),
              (resizeIcon.data.level = project.activeLayer.data.id),
              (elevateIcon.data.level = project.activeLayer.data.id),
              (heightIcon.data.level = project.activeLayer.data.id),
              (toolsGroup.data.level = project.activeLayer.data.id),
              (modalModel3dFurnitureId = selectedItem.data.fid),
              updateObjectPropertiesWindow(),
              render(),
              (focusPoint = paper.view.center),
              (focusPoint.zoom = paper.view.zoom),
              (tween = new TWEEN.Tween(focusPoint)
                .to(
                  {
                    x: selectedItem.bounds.center.x,
                    y: selectedItem.bounds.center.y,
                    zoom: 1,
                  },
                  500
                )
                .onUpdate(function () {
                  reFocus()
                })
                .start())
          }
        }
      }
    })
  }
  return !1
}
function showAbout() {
  $(".supportEmail").text("support@companyjuice.com"),
    $("#aboutModal").show(),
    hideMouseIndicators()
}
function rotateCompass(e) {
  let t = "rotate(" + parseInt(e) + "deg)"
  ;(document.getElementById("compass").style.transform = t),
    (document.getElementById("compassHdgLbl").innerText = parseInt(e) + "°")
}
function enableResizeBackgroundTemplate() {
  deselectAll(),
    backgroundRaster &&
      ((backgroundRaster.selected = !0),
      (selectedItem = backgroundRaster),
      (backgroundRaster.data.toolsRectangleInner.visible = !0),
      (toolsGroup.position = selectedItem.bounds.center),
      (toolsGroup.visible = !0),
      toolsGroup.bringToFront(),
      (resizeIcon.bounds.width = paper.view.bounds.width / 40),
      (resizeIcon.bounds.height = paper.view.bounds.height / 15),
      (resizeIcon.position =
        backgroundRaster.data.toolsRectangleInner.segments[3].point),
      (rotateIcon.visible = !1),
      (resizeIcon.visible = !0),
      resizeIcon.bringToFront(),
      (elevateIcon.visible = !1),
      (heightIcon.visible = !1),
      (rotateIcon.data.level = project.activeLayer.data.id),
      (toolsGroup.data.level = project.activeLayer.data.id),
      setToolMode("background"),
      redrawGrid())
}
function openFullscreen(e) {
  let t = document.getElementById(e)
  t.requestFullscreen
    ? t.requestFullscreen()
    : t.mozRequestFullScreen
    ? t.mozRequestFullScreen()
    : t.webkitRequestFullscreen
    ? t.webkitRequestFullscreen()
    : t.msRequestFullscreen && t.msRequestFullscreen()
}
function openTab(e) {
  let t, o, a
  for (
    o = document.getElementsByClassName("tabcontent"), t = 0;
    t < o.length;
    t++
  )
    o[t].style.display = "none"
  for (
    a = document.getElementsByClassName("tablinks"), t = 0;
    t < a.length;
    t++
  )
    a[t].className = a[t].className.replace(" active", "")
  ;(document.getElementById(e + "Content").style.display = "block"),
    document.getElementById(e).classList.add("active")
}
function doCopy() {
  selectedItem && selectedItem.data && "furniture" === selectedItem.data.type
    ? ((idToCopyPaste = selectedItem.data.id),
      (lastPasteX = selectedItem.position.x),
      (lastPasteY = selectedItem.position.y))
    : console.log("copy this not supproted")
}
function doPaste() {
  if (idToCopyPaste >= 0) {
    let e = JSON.parse(JSON.stringify(plan.furniture[idToCopyPaste]))
    ;(lastPasteX += 20),
      (lastPasteY += 20),
      (e.position.x = lastPasteX),
      (e.position.z = lastPasteY),
      clickableObjectsCounter++,
      (e.id = clickableObjectsCounter),
      loadFurniture(e, !0, !0)
  } else console.log("nothing to paste")
}
function doUndo() {
  if (planHistoryPosition > 0) {
    planHistoryPosition--, deselectAll()
    let e = JSON.parse(planHistory[planHistoryPosition])
    plan.furnitureAddedKey
      ? (deleteFurnitureByKey(plan.furnitureAddedKey), updatePlan(e))
      : plan.furnitureDirtyKey
      ? (editFurnitureByKey(e.furniture[plan.furnitureDirtyKey]), updatePlan(e))
      : plan.furnitureDeletedKey
      ? (loadFurniture(e.furniture[plan.furnitureDeletedKey], !1, !1),
        updatePlan(e))
      : plan.wallAddedKey || 0 === plan.wallAddedKey
      ? (deleteWallByKey(plan.wallAddedKey), updatePlan(e))
      : plan.wallDirtyKey || 0 === plan.wallDirtyKey
      ? (deleteWallByKey(plan.wallDirtyKey),
        loadWall(e.walls[plan.wallDirtyKey]),
        updatePlan(e))
      : plan.wallDeletedKey || 0 === plan.wallDeletedKey
      ? (loadWall(e.walls[plan.wallDeletedKey]), updatePlan(e))
      : plan.roofAddedKey || 0 === plan.roofAddedKey
      ? (deleteRoofByKey(plan.roofAddedKey), updatePlan(e))
      : plan.roofDirtyKey || 0 === plan.roofDirtyKey
      ? (deleteRoofByKey(plan.roofDirtyKey),
        loadRoof(e.roofs[plan.roofDirtyKey]),
        updatePlan(e))
      : plan.roofDeletedKey || 0 === plan.roofDeletedKey
      ? (loadRoof(e.roofs[plan.roofDeletedKey]), updatePlan(e))
      : plan.floorAddedKey
      ? ("floor" != toolMode && setToolMode("floor"),
        setEndDrawingFloors(),
        deleteFloorByKey(plan.floorAddedKey),
        updatePlan(e))
      : plan.floorDirtyKey
      ? (setEndDrawingFloors(),
        deleteFloorByKey(plan.floorDirtyKey),
        loadFloor(e.floors[plan.floorDirtyKey]),
        Floors[plan.floorDirtyKey].segments.length > 1 &&
          ("floor" != toolMode && setToolMode("floor"),
          (startedDrawingFloor = !0),
          (floorHelperPath.visible = !0),
          (floorHelperPath.segments[0].point =
            Floors[plan.floorDirtyKey].segments[
              Floors[plan.floorDirtyKey].segments.length - 1
            ].point),
          (floorHelperPath.segments[1].point = lastMousePoint),
          (Floors[plan.floorDirtyKey].closed = !1)),
        updatePlan(e))
      : plan.floorDeletedKey
      ? (loadFloor(e.floors[plan.floorDeletedKey]),
        2 === Floors[plan.floorDeletedKey].segments.length &&
          ("floor" != toolMode && setToolMode("floor"),
          (floorHelperPath.visible = !0),
          (floorHelperPath.segments[0].point =
            Floors[plan.floorDeletedKey].segments[
              Floors[plan.floorDeletedKey].segments.length - 1
            ].point),
          (floorHelperPath.segments[1].point = lastMousePoint),
          (Floors[plan.floorDeletedKey].closed = !1)),
        updatePlan(e))
      : plan.dimensionAddedKey
      ? (deleteDimensionByKey(plan.dimensionAddedKey), updatePlan(e))
      : plan.dimensionEditedKey ||
        (plan.dimensionDeletedKey
          ? (loadDimension(e.dimensions[plan.dimensionDeletedKey]),
            updatePlan(e))
          : plan.textAddedKey
          ? (deleteTextByKey(plan.textAddedKey), updatePlan(e))
          : plan.textEditedKey
          ? (deleteTextByKey(plan.textEditedKey),
            loadText(e.texts[plan.textEditedKey]),
            updatePlan(e))
          : plan.textDeletedKey
          ? (loadText(e.texts[plan.textDeletedKey]), updatePlan(e))
          : console.log("nothing to undo"))
  }
}
function doRedo() {
  if (planHistory.length > planHistoryPosition + 1) {
    planHistoryPosition++, deselectAll()
    let e = JSON.parse(planHistory[planHistoryPosition])
    if (e.furnitureAddedKey)
      loadFurniture(e.furniture[e.furnitureAddedKey], !1, !1), updatePlan(e)
    else if (e.furnitureDirtyKey)
      editFurnitureByKey(e.furniture[e.furnitureDirtyKey]), updatePlan(e)
    else if (e.furnitureDeletedKey)
      deleteFurnitureByKey(e.furnitureDeletedKey), updatePlan(e)
    else if (e.wallAddedKey || 0 === e.wallAddedKey)
      loadWall(e.walls[e.wallAddedKey]), updatePlan(e)
    else if (e.wallDirtyKey || 0 === e.wallDirtyKey)
      deleteWallByKey(e.wallDirtyKey),
        loadWall(e.walls[e.wallDirtyKey]),
        updatePlan(e)
    else if (e.wallDeletedKey || 0 === e.wallDeletedKey)
      deleteWallByKey(e.wallDeletedKey), updatePlan(e)
    else if (e.roofAddedKey || 0 === e.roofAddedKey)
      loadRoof(e.roofs[e.roofAddedKey]), updatePlan(e)
    else if (e.roofDirtyKey || 0 === e.roofDirtyKey)
      deleteRoofByKey(e.roofDirtyKey),
        loadRoof(e.roofs[e.roofDirtyKey]),
        updatePlan(e)
    else if (e.roofDeletedKey || 0 === e.roofDeletedKey)
      deleteRoofByKey(e.roofDeletedKey), updatePlan(e)
    else if (e.floorAddedKey)
      "floor" != toolMode && setToolMode("floor"),
        loadFloor(e.floors[e.floorAddedKey]),
        (startedDrawingFloor = !0),
        2 === Floors[e.floorAddedKey].segments.length &&
          ((floorHelperPath.visible = !0),
          (floorHelperPath.segments[0].point =
            Floors[e.floorAddedKey].segments[
              Floors[e.floorAddedKey].segments.length - 1
            ].point),
          (floorHelperPath.segments[1].point = lastMousePoint),
          (Floors[e.floorAddedKey].closed = !1)),
        updatePlan(e)
    else if (e.floorDirtyKey) {
      "floor" != toolMode && setToolMode("floor"),
        deleteFloorByKey(e.floorDirtyKey),
        loadFloor(e.floors[e.floorDirtyKey])
      let t
      planHistory.length > planHistoryPosition + 1
        ? ((t = JSON.parse(planHistory[planHistoryPosition + 1])),
          null === t.floorDirtyKey
            ? ((startedDrawingFloor = !1), (floorHelperPath.visible = !1))
            : ((startedDrawingFloor = !0),
              (toolMode = "floor"),
              (floorHelperPath.visible = !0),
              (floorHelperPath.segments[0].point =
                Floors[e.floorDirtyKey].segments[
                  Floors[e.floorDirtyKey].segments.length - 1
                ].point),
              (floorHelperPath.segments[1].point = lastMousePoint),
              (Floors[e.floorDirtyKey].closed = !1)))
        : ((startedDrawingFloor = !0),
          (toolMode = "floor"),
          (floorHelperPath.visible = !0),
          (floorHelperPath.segments[0].point =
            Floors[e.floorDirtyKey].segments[
              Floors[e.floorDirtyKey].segments.length - 1
            ].point),
          (floorHelperPath.segments[1].point = lastMousePoint),
          (Floors[e.floorDirtyKey].closed = !1)),
        updatePlan(e)
    } else
      e.floorDeletedKey
        ? ("floor" != toolMode && setToolMode("floor"),
          deleteFloorByKey(e.floorDeletedKey),
          updatePlan(e))
        : e.dimensionAddedKey
        ? (loadDimension(e.dimensions[e.dimensionAddedKey]), updatePlan(e))
        : e.dimensionEditedKey ||
          (e.dimensionDeletedKey
            ? (deleteDimensionByKey(e.dimensionDeletedKey), updatePlan(e))
            : e.textAddedKey
            ? (loadText(e.texts[e.textAddedKey]), updatePlan(e))
            : e.textEditedKey
            ? (deleteTextByKey(e.textEditedKey),
              loadText(e.texts[e.textEditedKey]),
              updatePlan(e))
            : e.textDeletedKey
            ? (deleteTextByKey(e.textDeletedKey), updatePlan(e))
            : console.log("nothing to redo"))
  }
}
function updatePlan(e) {
  ;(plan = e),
    repointPlan(),
    relinkWallReferences(project.activeLayer.data.id),
    relinkRoofReferences(project.activeLayer.data.id)
}
function repointPlan() {
  Object.keys(plan.furniture).forEach(function (e) {
    let t = plan.furniture[e]
    "object" == typeof t &&
      (clickableObjects[e]
        ? ((plan.furniture[e].position = clickableObjects[e].position),
          (plan.furniture[e].scale = clickableObjects[e].scale),
          (plan.furniture[e].rotation = clickableObjects[e].rotation))
        : console.log("repointing plan : key " + e + " not foiund " + typeof e))
  }),
    Object.keys(plan.walls).forEach(function (e) {
      let t = plan.walls[e]
      "object" == typeof t && t && Walls[e] && (t.wallPath = Walls[e])
    }),
    Object.keys(plan.roofs).forEach(function (e) {
      let t = plan.roofs[e]
      "object" == typeof t && t && Roofs[e] && (t.roofPath = Roofs[e])
    }),
    Object.keys(plan.floors).forEach(function (e) {
      let t = plan.floors[e]
      "object" == typeof t && t && Floors[e] && (t.floorPath = Floors[e])
    })
}
function deleteSelectedItem() {
  try {
    if (!readOnly && selectedItem && selectedItem.data.id)
      if ("furniture" === selectedItem.data.type) {
        let e = selectedItem.data.id
        deselectAll(),
          deleteFurnitureByKey(e),
          updatePlanHistory(
            plan,
            null,
            null,
            e,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
          ),
          console.log("deleted furniture " + e)
      } else if ("wallPath" === selectedItem.data.type) {
        let e = selectedItem.data.id
        deselectAll(),
          deleteWallByKey(e),
          relinkWallReferences(project.activeLayer.data.id),
          updatePlanHistory(
            plan,
            null,
            null,
            null,
            null,
            null,
            e,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
          ),
          console.log("deleted wall " + e)
      } else if ("roofPath" === selectedItem.data.type) {
        let e = selectedItem.data.id
        deselectAll(),
          deleteRoofByKey(e),
          relinkRoofReferences(project.activeLayer.data.id),
          updatePlanHistory(
            plan,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            e
          ),
          console.log("deleted roof " + e)
      } else if ("floor" === selectedItem.data.type) {
        let e = selectedItem.data.id
        deselectAll(),
          deleteFloorByKey(e),
          updatePlanHistory(
            plan,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            e,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
          )
      } else if ("dimension" === selectedItem.data.type) {
        let e = selectedItem.data.id
        deselectAll(),
          deleteDimensionByKey(e),
          updatePlanHistory(
            plan,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            e,
            null,
            null,
            null,
            null,
            null,
            null
          ),
          console.log("deleted dimension " + e)
      } else if ("text" === selectedItem.data.type) {
        let e = selectedItem.data.id
        deselectAll(),
          deleteTextByKey(e),
          updatePlanHistory(
            plan,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            e,
            null,
            null,
            null
          ),
          console.log("deleted text " + e)
      } else
        console.log("delete not implemented for : " + selectedItem.data.type)
  } catch (e) {
    console.log("deleteSelectedItem : " + e)
  }
}
function deleteTextByKey(e) {
  if (!readOnly)
    try {
      Object.keys(Texts).forEach(function (t) {
        let o = Texts[t]
        "object" == typeof o &&
          o.data.id.toString() == e.toString() &&
          (Texts[t].remove(), delete Texts[t])
      }),
        delete plan.texts[e]
    } catch (e) {
      console.log("deleteTextByKey : " + e)
    }
}
function deleteDimensionByKey(e) {
  if (!readOnly)
    try {
      Object.keys(Dimensions).forEach(function (t) {
        let o = Dimensions[t]
        "object" == typeof o &&
          o.id.toString() == e.toString() &&
          (Dimensions[t].line.remove(),
          Dimensions[t].text.remove(),
          Dimensions[t].dimensionPath.remove(),
          delete Dimensions[t])
      }),
        delete plan.dimensions[e]
    } catch (e) {
      console.log("deleteDimensionByKey : " + e)
    }
}
function deleteWallByKey(e) {
  if (!readOnly)
    try {
      ;(wallPath = null),
        Object.keys(Walls).forEach(function (t) {
          let o = Walls[t]
          "object" == typeof o &&
            o.data.id.toString() == e.toString() &&
            (Walls[t].remove(), delete Walls[t])
        }),
        Object.keys(wallsRectangles).forEach(function (t) {
          let o = wallsRectangles[t]
          "object" == typeof o &&
            o.data.id.toString() === e.toString() &&
            (wallsRectangles[t].remove(), delete wallsRectangles[t])
        }),
        Object.keys(wallsRectangles3d).forEach(function (t) {
          let o = wallsRectangles3d[t]
          "object" == typeof o &&
            o.userData.id.toString() === e.toString() &&
            (scene.remove(wallsRectangles3d[t]), delete wallsRectangles3d[t])
        }),
        Object.keys(maskObjectsApplied).forEach(function (t) {
          "object" == typeof maskObjectsApplied[t] &&
            maskObjectsApplied[t].userData.id.toString() === e.toString() &&
            (scene.remove(maskObjectsApplied[t]), delete maskObjectsApplied[t])
        }),
        delete plan.walls[e]
    } catch (e) {
      console.log("deleteWallByKey : " + e)
    }
}
function deleteRoofByKey(e) {
  if (!readOnly)
    try {
      ;(roofPath = null),
        Object.keys(Roofs).forEach(function (t) {
          let o = Roofs[t]
          "object" == typeof o &&
            o.data.id.toString() == e.toString() &&
            (Roofs[t].remove(), delete Roofs[t])
        }),
        Object.keys(roofsRectangles).forEach(function (t) {
          let o = roofsRectangles[t]
          "object" == typeof o &&
            o.data.id.toString() === e.toString() &&
            (roofsRectangles[t].remove(), delete roofsRectangles[t])
        }),
        Object.keys(roofsRectangles3d).forEach(function (t) {
          let o = roofsRectangles3d[t]
          "object" == typeof o &&
            o.userData.id.toString() === e.toString() &&
            (scene.remove(roofsRectangles3d[t]), delete roofsRectangles3d[t])
        }),
        Object.keys(maskObjectsAppliedRoof).forEach(function (t) {
          "object" == typeof maskObjectsAppliedRoof[t] &&
            maskObjectsAppliedRoof[t].userData.id.toString() === e.toString() &&
            (scene.remove(maskObjectsAppliedRoof[t]),
            delete maskObjectsAppliedRoof[t])
        }),
        delete plan.roofs[e]
    } catch (e) {
      console.log("deleteRoofByKey : " + e)
    }
}
function deleteFloorByKey(e) {
  if (!readOnly)
    try {
      scene.remove(Floors3d[e]),
        delete Floors3d[e],
        Floors[e].remove(),
        delete Floors[e],
        delete plan.floors[e],
        deselectAll(),
        render()
    } catch (e) {
      console.log("deleteFurnitureByKey : " + e)
    }
}
function deleteFurnitureByKey(e) {
  if (!readOnly)
    try {
      scene.remove(maskObjects[e]),
        Object.keys(maskObjects).forEach(function (t) {
          let o = maskObjects[t]
          "object" == typeof o &&
            o.name.toString() === "mask" + e.toString() &&
            delete maskObjects[t]
        }),
        scene.remove(clickableObjects[e]),
        Object.keys(clickableObjects).forEach(function (t) {
          let o = clickableObjects[t]
          "object" == typeof o &&
            o.name.toString() === e.toString() &&
            delete clickableObjects[t]
        }),
        Object.keys(Furniture).forEach(function (t) {
          let o = Furniture[t]
          "object" == typeof o &&
            o.data.id.toString() == e.toString() &&
            (Furniture[t].data.toolsRectangleInner &&
              Furniture[t].data.toolsRectangleInner.remove(),
            Furniture[t].remove(),
            delete Furniture[t])
        }),
        delete plan.furniture[e],
        deselectAll(),
        render()
    } catch (e) {
      console.log("deleteFurnitureByKey : " + e)
    }
}
function updatePlanHistory(
  e,
  t,
  o,
  a,
  n,
  l,
  i,
  r,
  s,
  d,
  c,
  u,
  p,
  m,
  g,
  y,
  f,
  h,
  v
) {
  ;(e.furnitureAddedKey = t),
    (e.furnitureDirtyKey = o),
    (e.furnitureDeletedKey = a),
    (e.wallAddedKey = n),
    (e.wallDirtyKey = l),
    (e.wallDeletedKey = i),
    (e.roofAddedKey = f),
    (e.roofDirtyKey = h),
    (e.roofDeletedKey = v),
    (e.floorAddedKey = r),
    (e.floorDirtyKey = s),
    (e.floorDeletedKey = d),
    (e.dimensionAddedKey = c),
    (e.dimensionEditedKey = u),
    (e.dimensionDeletedKey = p),
    (e.textAddedKey = m),
    (e.textEditedKey = g),
    (e.textDeletedKey = y),
    (e.wallDiffuse = wallMaterial.color),
    (e.wallOpacity = wallMaterial.opacity),
    (e.wallSpecular = wallMaterial.specular),
    (e.roofDiffuse = roofMaterial.color),
    (e.roofOpacity = roofMaterial.opacity),
    (e.roofSpecular = roofMaterial.specular),
    (e.floorDiffuse = floorMaterial.color),
    (e.floorOpacity = floorMaterial.opacity),
    (e.floorSpecular = floorMaterial.specular),
    (e.groundDiffuse = groundMat.color.getHexString()),
    (e.groundOpacity = groundMat.opacity),
    (e.groundSpecular = groundMat.specular.getHexString()),
    (e.depthWrite = document.getElementById("depthWriteMode").checked),
    (e.sortObjects = document.getElementById("sortObjectsMode").checked),
    (e.compassHdg = document.getElementById("compassHdg").value),
    (e.azimuth = azimuth),
    (e.inclination = inclination),
    planHistoryPosition++,
    (planHistory.length = planHistoryPosition + 1),
    (planHistory[planHistoryPosition] = JSON.stringify(e))
  try {
    ;(document.getElementById("shareLinkUrl").value = ""),
      (document.getElementById("shareLinkUrl3d").value = ""),
      (document.getElementById("shareLinkUrlPlan").value = ""),
      localStorage.setItem("plan", JSON.stringify(e))
  } catch (e) {
    console.log("creating hash : " + e)
  }
}
function createThumbForHistory() {
  try {
    hideMouseIndicators()
    let e = 16 / 9,
      t = getHeightFromRatio(360, e),
      o = getWidthFromRatio(t, e),
      a = document.createElement("canvas")
    ;(a.width = o), (a.height = t)
    let n = a.getContext("2d")
    n.clearRect(0, 0, o, t), n.drawImage(renderer.domElement, 0, 0, o, t)
    let l = a.toDataURL("image/png", 0.1)
    ;(plan.thumb = l), showMouseIndicators()
  } catch (e) {
    console.log("failed to create thumb. " + e)
  }
}
function getHeightFromRatio(e, t) {
  let o = e / Math.sqrt(Math.pow(t, 2) + 1)
  return Math.round(o)
}
function getWidthFromRatio(e, t) {
  let o = e / Math.sqrt(1 / (Math.pow(t, 2) + 1))
  return Math.round(o)
}
function savePlan() {
  try {
    createThumbForHistory()
    let e = document.createElement("a")
    ;(e.download = "HomeIdea3D.dat"),
      (e.innerHTML = "Download File"),
      (e.href = window.URL.createObjectURL(
        new Blob([JSON.stringify(plan)], { type: "text/plain" })
      )),
      (e.onclick = destroyClickedElement),
      (e.style.display = "none"),
      document.body.appendChild(e),
      e.click()
  } catch (e) {
    console.dir(e)
  }
}
function destroyClickedElement(e) {
  document.body.removeChild(e.target)
}
function loadFileAsText(e) {
  try {
    let t = e.target,
      o = new FileReader()
    ;(o.onload = function () {
      let e = o.result
      setNewPlan(),
        (loadingProgressTxt = "Plan decoding\n" + loadingProgressTxt),
        (document.getElementById("modalLoadingDataInfo").innerHTML =
          loadingProgressTxt),
        drawPlan(JSON.parse(e)),
        clearFileInput(document.getElementById("file"))
    }),
      (loadingProgressTxt = "Loading Saved Plan"),
      (document.getElementById("modalLoadingDataInfo").innerHTML =
        loadingProgressTxt),
      $("#loadingModal").show(),
      hideMouseIndicators(),
      o.readAsText(t.files[0])
  } catch (e) {
    console.log("loadFileAsText : " + e)
  }
}
function clearFileInput(e) {
  try {
    e.value = null
  } catch (e) {}
  e.value && e.parentNode.replaceChild(e.cloneNode(!0), e)
}
function resetPlan() {
  try {
    Object.keys(Texts).forEach(function (e) {
      let t = Texts[e]
      "object" == typeof t && deleteTextByKey(e)
    }),
      (textIdCounter = 0)
  } catch (e) {
    console.log("resetPlan : 1 : " + e)
  }
  try {
    Object.keys(Dimensions).forEach(function (e) {
      let t = Dimensions[e]
      "object" == typeof t && deleteDimensionByKey(e)
    }),
      (dimensionIdCounter = 0)
  } catch (e) {
    console.log("resetPlan : 2 : " + e)
  }
  try {
    Object.keys(Furniture).forEach(function (e) {
      let t = Furniture[e]
      "object" == typeof t &&
        (Furniture[e].data.toolsRectangleInner &&
          Furniture[e].data.toolsRectangleInner.remove(),
        Furniture[e].remove(),
        delete Furniture[e])
    })
  } catch (e) {
    console.log("resetPlan : 3 : " + e)
  }
  try {
    Object.keys(Floors).forEach(function (e) {
      let t = Floors[e]
      "object" == typeof t && (Floors[e].remove(), delete Floors[e])
    }),
      Object.keys(Floors3d).forEach(function (e) {
        let t = Floors3d[e]
        "object" == typeof t && (scene.remove(Floors3d[e]), delete Floors3d[e])
      }),
      (floorIdCounter = 0)
  } catch (e) {
    console.log("resetPlan : 4 : " + e)
  }
  try {
    Object.keys(Walls).forEach(function (e) {
      let t = Walls[e]
      "object" == typeof t && (Walls[e].remove(), delete Walls[e])
    })
    for (let e in wallsRectangles) wallsRectangles[e].remove()
  } catch (e) {
    console.log("resetPlan : 5 : " + e)
  }
  try {
    Object.keys(wallsRectangles3d).forEach(function (e) {
      let t = wallsRectangles3d[e]
      "object" == typeof t && scene.remove(wallsRectangles3d[e])
    })
  } catch (e) {
    console.log("resetPlan : 6 : " + e)
  }
  try {
    Object.keys(Roofs).forEach(function (e) {
      "object" == typeof Roofs[e] && (Roofs[e].remove(), delete Roofs[e])
    })
    for (let t in roofsRectangles) roofsRectangles[t].remove()
  } catch (e) {
    console.log("resetPlan : 5.1 : " + e)
  }
  try {
    Object.keys(roofsRectangles3d).forEach(function (e) {
      "object" == typeof roofsRectangles3d[e] &&
        scene.remove(roofsRectangles3d[e])
    })
  } catch (e) {
    console.log("resetPlan : 6.1 : " + e)
  }
  try {
    Object.keys(maskObjectsApplied).forEach(function (e) {
      "object" == typeof maskObjectsApplied[e] &&
        scene.remove(maskObjectsApplied[e])
    })
  } catch (e) {
    console.log("resetPlan : 6.5 : " + e)
  }
  try {
    Object.keys(maskObjectsAppliedRoof).forEach(function (e) {
      "object" == typeof maskObjectsAppliedRoof[e] &&
        scene.remove(maskObjectsAppliedRoof[e])
    })
  } catch (e) {
    console.log("resetPlan : 6.6 : " + e)
  }
  try {
    Object.keys(clickableObjects).forEach(function (e) {
      let t = clickableObjects[e]
      "object" == typeof t &&
        "groundLayer" != t.name &&
        (scene.remove(clickableObjects[e]), delete clickableObjects[e])
    })
  } catch (e) {
    console.log("resetPlan : 7 : " + e)
  }
  try {
    Object.keys(maskObjects).forEach(function (e) {
      let t = maskObjects[e]
      "object" == typeof t &&
        (scene.remove(maskObjects[e]), delete maskObjects[e])
    }),
      (clickableObjectsCounter = 0)
  } catch (e) {
    console.log("resetPlan : 8 : " + e)
  }
  try {
    backgroundRaster &&
      backgroundRaster.data &&
      (backgroundRaster.data.toolsRectangleInner &&
        backgroundRaster.data.toolsRectangleInner.remove(),
      backgroundRaster.remove(),
      (backgroundRaster = null),
      clearFileInput(document.getElementById("backgroundImageFile")))
  } catch (e) {
    console.log("resetPlan : 9 : " + e)
  }
  try {
    Object.keys(verticalGuides).forEach(function (e) {
      verticalGuides[e].remove(), delete verticalGuides[e]
    }),
      Object.keys(horizontalGuides).forEach(function (e) {
        horizontalGuides[e].remove(), delete horizontalGuides[e]
      }),
      (guideCounter = 0)
  } catch (e) {
    console.log("resetPlan : 10 : " + e)
  }
  try {
    ;(furnitureToLoadCount = 0),
      (loadedFurnitureCount = 0),
      (wallIdCounter = 0),
      (wallsRectangles = {}),
      (wallsRectangles3d = {}),
      (maskObjectsApplied = {}),
      (maskObjectsAppliedRoof = {}),
      (roofIdCounter = 0),
      (roofsRectangles = {}),
      (roofsRectangles3d = {}),
      (Furniture = {}),
      (Walls = {}),
      (Roofs = {}),
      (Floors = {}),
      (Floors3d = {}),
      (Dimensions = {}),
      (Texts = {}),
      (plan = {}),
      (plan.furniture = {}),
      (plan.walls = {}),
      (plan.roofs = {}),
      (plan.levels = {}),
      (plan.levels[0] = { id: 0, height: 0 }),
      (plan.floors = {}),
      (plan.dimensions = {}),
      (plan.texts = {}),
      (plan.verticalGuides = {}),
      (plan.horizontalGuides = {}),
      (plan.furnitureAddedKey = null),
      (plan.furnitureDirtyKey = null),
      (plan.furnitureDeletedKey = null),
      (plan.wallAddedKey = null),
      (plan.wallDirtyKey = null),
      (plan.wallDeletedKey = null),
      (plan.roofAddedKey = null),
      (plan.roofDirtyKey = null),
      (plan.roofDeletedKey = null),
      (plan.floorAddedKey = null),
      (plan.floorDirtyKey = null),
      (plan.floorDeletedKey = null),
      (plan.dimensionAddedKey = null),
      (plan.dimensionEditedKey = null),
      (plan.dimensionDeletedKey = null),
      (plan.textAddedKey = null),
      (plan.textEditedKey = null),
      (plan.textDeletedKey = null),
      (plan.wallDiffuse = wallMaterial.color),
      (plan.wallOpacity = wallMaterial.opacity),
      (plan.wallSpecular = wallMaterial.specular),
      (plan.roofDiffuse = roofMaterial.color),
      (plan.roofOpacity = roofMaterial.opacity),
      (plan.roofSpecular = roofMaterial.specular),
      (plan.floorDiffuse = floorMaterial.color),
      (plan.floorOpacity = floorMaterial.opacity),
      (plan.floorSpecular = floorMaterial.specular),
      (plan.groundDiffuse = groundMat.color.getHexString()),
      (plan.groundOpacity = groundMat.opacity),
      (plan.groundSpecular = groundMat.specular.getHexString()),
      (plan.depthWrite = document.getElementById("depthWriteMode").checked),
      (plan.sortObjects = document.getElementById("sortObjectsMode").checked),
      (plan.azimuth = azimuth),
      (plan.inclination = inclination)
  } catch (e) {
    console.log("resetPlan : 11 : " + e)
  }
  try {
    otherLayerWallsRasters &&
      otherLayerWallsRasters.length > 0 &&
      (otherLayerWallsRasters.forEach(function (e) {
        e.remove()
      }),
      (otherLayerWallsRasters = [])),
      otherLayerFurnitureRasters &&
        otherLayerFurnitureRasters.length > 0 &&
        (otherLayerFurnitureRasters.forEach(function (e) {
          e.remove()
        }),
        (otherLayerFurnitureRasters = []))
  } catch (e) {
    console.log("resetPlan : 12 : " + e)
  }
  try {
    levelButtons || addNewLevel("0"), setLevel("0")
  } catch (e) {
    console.log("resetPlan : 13 : " + e)
  }
  try {
    Object.keys(levelButtons).forEach(function (e) {
      "0" !== e.toString() &&
        (levelButtons[e].parentNode.removeChild(levelButtons[e]),
        delete levelButtons[e],
        project.layers["level" + e].remove())
    })
  } catch (e) {
    console.log("resetPlan : 14 : " + e)
  }
  try {
    project.layers.forEach(function (e) {
      "0" === !e.data.id && e.remove()
    })
  } catch (e) {
    console.log("resetPlan : 15 : " + e)
  }
  ;(project.activeLayer.name = "level0"),
    (project.activeLayer.data = { id: "0", height: 0 })
  try {
    ;(floorsGroup = {}),
      (floorsGroup[0] = new paper.Group()),
      (roofsGroup = {}),
      (roofsGroup[0] = new paper.Group()),
      (wallsGroup = {}),
      (wallsGroup[0] = new paper.Group()),
      (dimensionsGroup = {}),
      (dimensionsGroup[0] = new paper.Group()),
      (furnitureGroup = {}),
      (furnitureGroup[0] = new paper.Group()),
      (textsGroup = {}),
      (textsGroup[0] = new paper.Group()),
      (guidesGroup = new paper.Group()),
      deselectAll(),
      render()
  } catch (e) {
    console.log("resetPlan : 15 : " + e)
  }
}
export function setNewPlan() {
  try {
    resetPlan(),
      (planHistory = []),
      (planHistoryPosition = 0),
      planHistory.push(JSON.stringify(plan)),
      setToolMode("pointer"),
      localStorage.clear()
  } catch (e) {
    console.log("setNewPlan : " + e)
  }
}
function drawPlan(e) {
  setInterfacePropertiesFromPlan(e),
    e.levels
      ? ((plan.levels = e.levels),
        Object.keys(e.levels).forEach(function (t) {
          "object" == typeof e.levels[t] &&
            ((levelButtons && levelButtons[t]) || addNewLevel(t))
        }))
      : levelButtons || addNewLevel("0"),
    e.furniture &&
      Object.keys(e.furniture).forEach(function (t) {
        let o = e.furniture[t]
        "object" == typeof o &&
          (furnitureToLoadCount++,
          (loadingProgressTxt =
            "Loading Furniture id : " +
            o.id +
            " (" +
            camelCaseToSentence(o.fid) +
            ")\n" +
            loadingProgressTxt),
          (document.getElementById("modalLoadingDataInfo").innerHTML =
            loadingProgressTxt),
          loadFurniture(o, !1, !1))
      }),
    console.log("loading " + furnitureToLoadCount + " furnitures"),
    e.walls &&
      Object.keys(e.walls).forEach(function (t) {
        let o = e.walls[t]
        "object" == typeof o &&
          ((loadingProgressTxt =
            "Loading Wall Id : " + o.id + "\n" + loadingProgressTxt),
          (document.getElementById("modalLoadingDataInfo").innerHTML =
            loadingProgressTxt),
          loadWall(o))
      }),
    e.roofs &&
      Object.keys(e.roofs).forEach(function (t) {
        let o = e.roofs[t]
        "object" == typeof o &&
          ((loadingProgressTxt =
            "Loading Roof Id : " + o.id + "\n" + loadingProgressTxt),
          (document.getElementById("modalLoadingDataInfo").innerHTML =
            loadingProgressTxt),
          loadRoof(o))
      }),
    e.floors &&
      Object.keys(e.floors).forEach(function (t) {
        let o = e.floors[t]
        "object" == typeof o &&
          ((loadingProgressTxt =
            "Loading Floor Id : " + o.id + "\n" + loadingProgressTxt),
          (document.getElementById("modalLoadingDataInfo").innerHTML =
            loadingProgressTxt),
          loadFloor(o))
      }),
    e.dimensions &&
      Object.keys(e.dimensions).forEach(function (t) {
        let o = e.dimensions[t]
        "object" == typeof o &&
          ((loadingProgressTxt =
            "Loading Dimension Id : " + o.id + "\n" + loadingProgressTxt),
          (document.getElementById("modalLoadingDataInfo").innerHTML =
            loadingProgressTxt),
          loadDimension(o))
      }),
    e.texts &&
      Object.keys(e.texts).forEach(function (t) {
        let o = e.texts[t]
        "object" == typeof o &&
          ((loadingProgressTxt =
            "Loading Text Id : " + o.id + "\n" + loadingProgressTxt),
          (document.getElementById("modalLoadingDataInfo").innerHTML =
            loadingProgressTxt),
          loadText(o))
      }),
    e.verticalGuides &&
      "default" === UILayout &&
      Object.keys(e.verticalGuides).forEach(function (t) {
        let o = e.verticalGuides[t],
          a = new paper.Point(o[1].segments[0][0], o[1].segments[0][1]),
          n = new paper.Point(o[1].segments[1][0], o[1].segments[1][1]),
          l = new paper.Path.Line(a, n)
        ;(l.strokeColor = "#00ff88"),
          (l.strokeWidth = 1),
          (l.strokeScaling = !1),
          (l.data.type = "verticalGuide"),
          (l.data.level = -1),
          guideCounter++,
          (l.data.id = guideCounter),
          (verticalGuides[guideCounter] = l),
          guidesGroup.addChild(l),
          (plan.verticalGuides[guideCounter] = l),
          redrawGrid()
      }),
    e.horizontalGuides &&
      "default" === UILayout &&
      Object.keys(e.horizontalGuides).forEach(function (t) {
        let o = e.horizontalGuides[t],
          a = new paper.Point(o[1].segments[0][0], o[1].segments[0][1]),
          n = new paper.Point(o[1].segments[1][0], o[1].segments[1][1]),
          l = new paper.Path.Line(a, n)
        ;(l.strokeColor = "#00ff88"),
          (l.strokeWidth = 1),
          (l.strokeScaling = !1),
          (l.data.type = "horizontalGuide"),
          (l.data.level = -1),
          guideCounter++,
          (l.data.id = guideCounter),
          (horizontalGuides[guideCounter] = l),
          guidesGroup.addChild(l),
          (plan.horizontalGuides[guideCounter] = l),
          redrawGrid()
      }),
    render(),
    console.log("furnitureToLoadCount = " + furnitureToLoadCount),
    0 === furnitureToLoadCount && doLoadFinished()
}
function doLoadFinished() {
  ;(plan.furnitureAddedKey = null),
    (plan.furnitureDirtyKey = null),
    (plan.furnitureDeletedKey = null),
    (plan.wallAddedKey = null),
    (plan.wallDirtyKey = null),
    (plan.wallDeletedKey = null),
    (plan.roofAddedKey = null),
    (plan.roofDirtyKey = null),
    (plan.roofDeletedKey = null),
    (plan.floorAddedKey = null),
    (plan.floorDirtyKey = null),
    (plan.floorDeletedKey = null),
    (plan.dimensionAddedKey = null),
    (plan.dimensionEditedKey = null),
    (plan.dimensionDeletedKey = null),
    (plan.textAddedKey = null),
    (plan.textEditedKey = null),
    (plan.textDeletedKey = null),
    (planHistory = []),
    (planHistoryPosition = 0),
    planHistory.push(JSON.stringify(plan)),
    project.layers.forEach(function (e) {
      ;(loadingProgressTxt =
        "Linking Walls : level " + e.data.id + "\n" + loadingProgressTxt),
        (document.getElementById("modalLoadingDataInfo").innerHTML =
          loadingProgressTxt),
        relinkWallReferences(e.data.id),
        (loadingProgressTxt =
          "Linking Roofs : level " + e.data.id + "\n" + loadingProgressTxt),
        (document.getElementById("modalLoadingDataInfo").innerHTML =
          loadingProgressTxt),
        relinkRoofReferences(e.data.id),
        redrawLevelsFloors(e.data.id)
    }),
    setLevel("0"),
    recenterPlanView(),
    recenter3dview(),
    zoomRectangle.remove(),
    (loadingProgressTxt = "Loading Finished\n" + loadingProgressTxt),
    (document.getElementById("modalLoadingDataInfo").innerHTML =
      loadingProgressTxt),
    setTimeout(function () {
      $("#loadingModal").hide(), showMouseIndicators()
    }, 100)
}
function reFocus() {
  ;(paper.view.center = focusPoint),
    (paper.view.zoom = focusPoint.zoom),
    redrawGrid(),
    redrawTexts(),
    (cumulclick = getBaseLog(1.1, focusPoint.zoom))
}
function getBaseLog(e, t) {
  return Math.log(t) / Math.log(e)
}
function relinkWallReferences(e) {
  e = e.toString()
  try {
    Object.keys(Walls).forEach(function (t) {
      let o = Walls[t]
      if ("object" == typeof o && o.data.level === e) {
        let a = 0
        o.segments.forEach(function (e) {
          let t = !1
          Object.keys(Walls).forEach(function (n) {
            let l = Walls[n]
            if (
              "object" == typeof o &&
              o.data.id !== l.data.id &&
              o.data.level === l.data.level
            ) {
              let i = 0
              2 === l.segments.length &&
                l.segments.forEach(function (n) {
                  parseInt(e.point.x) === parseInt(n.point.x) &&
                    parseInt(e.point.y) === parseInt(n.point.y) &&
                    ((t = !0),
                    0 === a
                      ? (Walls[o.data.id].data.join0 = {
                          id: l.data.id,
                          seg: i,
                        })
                      : (Walls[o.data.id].data.join1 = {
                          id: l.data.id,
                          seg: i,
                        })),
                    (i += 1)
                })
            }
          }),
            t ||
              (0 === a
                ? (Walls[o.data.id].data.join0 = { id: null, seg: null })
                : (Walls[o.data.id].data.join1 = { id: null, seg: null })),
            (a += 1)
        })
      }
    })
  } catch (e) {
    console.log("relinkWallReferences : part 1 : " + e)
  }
  try {
    Object.keys(Walls).forEach(function (t) {
      Walls[t].data.level === e && reDrawWallCorners(Walls[t])
    }),
      render()
  } catch (e) {
    console.log("relinkWallReferences : part 2 : " + e)
  }
  applyMasksToWalls(e)
}
function applyMasksToWalls(e) {
  try {
    Object.keys(wallsRectangles3d).forEach(function (t) {
      "object" == typeof wallsRectangles3d[t] &&
        wallsRectangles3d[t].userData.level === e &&
        applyMasksToWall(t, wallsRectangles3d[t], e)
    }),
      render()
  } catch (e) {
    console.log("applyMasksToWalls : part 3 : " + e)
  }
}
function applyMasksToWall(e, t, o) {
  let a,
    n = new THREE.Box3().setFromObject(t),
    l = null,
    i = !1
  if (
    (Object.keys(Furniture).forEach(function (e) {
      if (Furniture[e].useMask && Furniture[e].data.level === o) {
        let r = new THREE.Box3().setFromObject(maskObjects[e])
        if (n.intersectsBox(r)) {
          i = !0
          let s = new ThreeBSP(maskObjects[e])
          if (null === l) l = new ThreeBSP(t)
          else {
            let d = new THREE.Mesh(a)
            d.position.copy(t.position), (l = new ThreeBSP(d))
          }
          a = l.subtract(s).toGeometry()
        }
      }
    }),
    i)
  ) {
    let r = new THREE.Mesh(a, wallMaterial)
    r.position.copy(t.position),
      maskObjectsApplied[e] && scene.remove(maskObjectsApplied[e]),
      (r.userData.id = e),
      scene.add(r),
      (maskObjectsApplied[e] = r),
      (t.visible = !1)
  } else
    (t.visible = !0),
      maskObjectsApplied[e] &&
        (scene.remove(maskObjectsApplied[e]), delete maskObjectsApplied[e])
}
function relinkRoofReferences(e) {
  e = e.toString()
  try {
    Object.keys(Roofs).forEach(function (t) {
      let o = Roofs[t]
      if ("object" == typeof o && o.data.level === e) {
        let a = 0
        o.segments.forEach(function (e) {
          let t = !1
          Object.keys(Roofs).forEach(function (n) {
            let l = Roofs[n]
            if (
              "object" == typeof o &&
              o.data.id !== l.data.id &&
              o.data.level === l.data.level
            ) {
              let i = 0
              2 === l.segments.length &&
                l.segments.forEach(function (n) {
                  parseInt(e.point.x) === parseInt(n.point.x) &&
                    parseInt(e.point.y) === parseInt(n.point.y) &&
                    ((t = !0),
                    0 === a
                      ? (Roofs[o.data.id].data.join0 = {
                          id: l.data.id,
                          seg: i,
                        })
                      : (Roofs[o.data.id].data.join1 = {
                          id: l.data.id,
                          seg: i,
                        })),
                    (i += 1)
                })
            }
          }),
            t ||
              (0 === a
                ? (Roofs[o.data.id].data.join0 = { id: null, seg: null })
                : (Roofs[o.data.id].data.join1 = { id: null, seg: null })),
            (a += 1)
        })
      }
    })
  } catch (e) {
    console.log("relinkRoofReferences : part 1 : " + e)
  }
  try {
    Object.keys(Roofs).forEach(function (t) {
      Roofs[t].data.level === e && reDrawRoofCorners(Roofs[t])
    }),
      render()
  } catch (e) {
    console.log("relinkRoofReferences : part 2 : " + e)
  }
  applyMasksToRoofs(e)
}
function applyMasksToRoofs(e) {
  try {
    Object.keys(roofsRectangles3d).forEach(function (t) {
      "object" == typeof roofsRectangles3d[t] &&
        roofsRectangles3d[t].userData.level === e &&
        applyMasksToRoof(t, roofsRectangles3d[t], e)
    }),
      render()
  } catch (e) {
    console.log("applyMasksToRoofs : part 3 : " + e)
  }
}
function applyMasksToRoof(e, t, o) {
  let a,
    n = new THREE.Box3().setFromObject(t),
    l = null,
    i = !1
  if (
    (Object.keys(Furniture).forEach(function (e) {
      if (Furniture[e].useMask && Furniture[e].data.level === o) {
        let r = new THREE.Box3().setFromObject(maskObjects[e])
        if (n.intersectsBox(r)) {
          i = !0
          let s = new ThreeBSP(maskObjects[e])
          if (null === l) l = new ThreeBSP(t)
          else {
            let d = new THREE.Mesh(a)
            d.position.copy(t.position), (l = new ThreeBSP(d))
          }
          a = l.subtract(s).toGeometry()
        }
      }
    }),
    i)
  ) {
    let r = new THREE.Mesh(a, roofMaterial)
    r.position.copy(t.position),
      maskObjectsAppliedRoof[e] && scene.remove(maskObjectsAppliedRoof[e]),
      (r.userData.id = e),
      scene.add(r),
      (maskObjectsAppliedRoof[e] = r),
      (t.visible = !1)
  } else
    (t.visible = !0),
      maskObjectsAppliedRoof[e] &&
        (scene.remove(maskObjectsAppliedRoof[e]),
        delete maskObjectsAppliedRoof[e])
}
function loadText(e) {
  e.id > textIdCounter && (textIdCounter = e.id)
  let t = new paper.PointText({})
  ;(t.fontFamily = "Courier New"),
    (t.fillColor = "white"),
    (t.point = new paper.Point(e.data.x, e.data.y)),
    (t.justification = "center"),
    (t.fontSize = screenScale / 1.5),
    (t.data.id = e.id),
    (t.data.type = "text"),
    (t.data.value = e.data.value),
    (t.data.x = t.point.x),
    (t.data.y = t.point.y),
    (t.data.level = (e.data.level ? e.data.level : 0).toString()),
    project.layers["level" + t.data.level] || addNewLevel(t.data.level),
    project.activeLayer.data.id !== t.data.level && setLevel(t.data.level),
    textsGroup[t.data.level].addChild(t),
    (t.content = t.data.value),
    (Texts[e.id] = t),
    (plan.texts[e.id] = { id: e.id, data: t.data })
}
function loadDimension(e) {
  e.id > dimensionIdCounter && (dimensionIdCounter = e.id),
    (dimensionPath = new Path()),
    (dimensionPath.data.type = "dimension"),
    (dimensionPath.strokeColor = "white"),
    (dimensionPath.data.id = e.id),
    (dimensionPath.data.adjacent = e.dimensionPath[1].data.adjacent),
    (dimensionPath.data.level = (
      e.dimensionPath[1].data.level ? e.dimensionPath[1].data.level : 0
    ).toString()),
    project.layers["level" + dimensionPath.data.level] ||
      addNewLevel(dimensionPath.data.level),
    project.activeLayer.data.id !== dimensionPath.data.level &&
      setLevel(dimensionPath.data.level),
    dimensionsGroup[dimensionPath.data.level].addChild(dimensionPath),
    (dimensionPath.visible = !1),
    e.dimensionPath[1].segments.forEach(function (e) {
      dimensionPath.add(new paper.Point(e[0], e[1]))
    })
  let t = dimensionPath.data.adjacent,
    o = dimensionPath.segments[1].point.subtract(
      dimensionPath.segments[0].point
    ),
    a = new paper.Path()
  ;(a.data.id = e.id),
    (a.data.level = dimensionPath.data.level),
    (a.data.type = "dimension"),
    (a.style = { strokeColor: "white", strokeWidth: 1, strokeScaling: !1 }),
    a.moveTo(dimensionPath.segments[0].point),
    a.lineBy(o.normalize(t).rotate(-90)),
    a.lineBy(o.normalize(7.5).rotate(-270)),
    a.lineBy(o.normalize(10).rotate(-225)),
    a.lineBy(o.normalize(20).rotate(-45)),
    a.lineBy(o.normalize(10).rotate(-225)),
    a.lineBy(o.normalize(o.length / 2))
  let n = a.lastSegment.point
  a.lineBy(o.normalize(o.length / 2)),
    a.lineBy(o.normalize(10).rotate(-225)),
    a.lineBy(o.normalize(20).rotate(-45)),
    a.lineBy(o.normalize(10).rotate(-225)),
    a.lineBy(o.normalize(7.5).rotate(-90)),
    a.lineBy(o.normalize(t).rotate(90))
  let l = new paper.PointText({})
  Math.abs(o.angle) > 90
    ? ((l.fontFamily = "Courier New"),
      (l.fillColor = "white"),
      (l.point = n.add(o.normalize(-8).rotate(-90))),
      (l.justification = "center"),
      (l.fontSize = screenScale / 1.5),
      l.rotate(180 + o.angle),
      (l.data.id = e.id),
      (l.data.level = dimensionPath.data.level),
      (l.data.type = "dimension"))
    : ((l.fontFamily = "Courier New"),
      (l.fillColor = "white"),
      (l.point = n.add(o.normalize(8).rotate(-90))),
      (l.justification = "center"),
      (l.fontSize = screenScale / 1.5),
      l.rotate(o.angle),
      (l.data.id = e.id),
      (l.data.level = dimensionPath.data.level),
      (l.data.type = "dimension"))
  let i = o.length
  ;(l.content = Math.floor(1e3 * i) / 1e3),
    (Dimensions[e.id] = {
      id: e.id,
      dimensionPath: dimensionPath,
      line: a,
      text: l,
    }),
    (plan.dimensions[e.id] = { id: e.id, dimensionPath: dimensionPath })
}
function loadFloor(e) {
  e.floorPath[1]
    ? (e.id > floorIdCounter && (floorIdCounter = e.id),
      (floorPath = new paper.Path()),
      (floorPath.data.type = "floor"),
      (floorPath.strokeColor = "#b19064"),
      (floorPath.strokeWidth = 2),
      (floorPath.strokeScaling = !1),
      (floorPath.fillColor = new paper.Color(0.5, 0.5, 0.5, 0.5)),
      (floorPath.data.id = e.id),
      (floorPath.data.thickness = e.thickness
        ? e.thickness
        : defaultFloorThickness),
      (floorPath.data.level = (
        e.floorPath[1].data.level ? e.floorPath[1].data.level : 0
      ).toString()),
      project.layers["level" + floorPath.data.level] ||
        addNewLevel(floorPath.data.level),
      project.activeLayer.data.id !== floorPath.data.level &&
        setLevel(floorPath.data.level),
      floorsGroup[floorPath.data.level].addChild(floorPath),
      e.floorPath[1].segments.forEach(function (e) {
        floorPath.add(new paper.Point(e[0], e[1]))
      }),
      (floorPath.closed = !0),
      redrawFloor(floorPath),
      (Floors[e.id] = floorPath),
      (plan.floors[e.id] = { id: e.id, floorPath: floorPath }))
    : (console.log("floor val missing info"), console.log(e))
}
function loadWall(e) {
  if (e.wallPath[1]) {
    e.id > wallIdCounter && (wallIdCounter = e.id),
      (wallPath = new paper.Path()),
      (wallPath.strokeColor = new paper.Color(0, 0, 0, 0)),
      (wallPath.data.id = e.id),
      (wallPath.data.join0 = e.wallPath[1].data.join0),
      (wallPath.data.join1 = e.wallPath[1].data.join1),
      (wallPath.data.type = "wallPath"),
      (wallPath.data.thickness = e.wallPath[1].data.thickness
        ? e.wallPath[1].data.thickness
        : defaultWallThickness),
      Array.isArray(e.wallPath[1].data.height)
        ? (wallPath.data.height = [
            parseInt(e.wallPath[1].data.height[0]),
            parseInt(e.wallPath[1].data.height[1]),
          ])
        : (wallPath.data.height = e.wallPath[1].data.height
            ? [
                parseInt(e.wallPath[1].data.height),
                parseInt(e.wallPath[1].data.height),
              ]
            : [defaultWallHeight, defaultWallHeight]),
      (wallPath.data.level = (
        e.wallPath[1].data.level ? e.wallPath[1].data.level : 0
      ).toString())
    let t = !0
    if (
      e.wallPath[1] &&
      e.wallPath[1].segments &&
      2 === e.wallPath[1].segments.length
    ) {
      let o = wallPath.data.thickness / 2
      e.wallPath[1].segments.forEach(function (e) {
        if ((wallPath.add(new paper.Point(e[0], e[1])), !t)) {
          let a = wallPath.segments[0].point,
            n = wallPath.segments[1].point,
            l = getAngleRadians(a, n),
            i = new Point(a.x + Math.sin(l) * o, a.y - Math.cos(l) * o),
            r = new Point(n.x + Math.sin(l) * o, n.y - Math.cos(l) * o),
            s = new Point(n.x - Math.sin(l) * o, n.y + Math.cos(l) * o),
            d = new Point(a.x - Math.sin(l) * o, a.y + Math.cos(l) * o),
            c = new Path()
          ;(c.data.type = "wallRectangle"),
            (c.data.id = wallPath.data.id),
            (c.data.level = wallPath.data.level),
            (c.fillColor = new paper.Color(1, 0.9, 0, 0.25)),
            (c.strokeColor = "#b19064"),
            (c.strokeWidth = 1),
            (c.strokeScaling = !1),
            (c.segments = wallHelperRectangle.segments),
            (c.segments[0].point = i),
            (c.segments[1].point = r),
            (c.segments[2].point = s),
            (c.segments[3].point = d),
            (wallsRectangles[wallPath.data.id] = c),
            project.layers["level" + wallPath.data.level] ||
              addNewLevel(wallPath.data.level),
            project.activeLayer.data.id !== wallPath.data.level &&
              setLevel(wallPath.data.level),
            wallsGroup[wallPath.data.level].addChild(
              wallsRectangles[wallPath.data.id]
            ),
            (wallPath.segments[wallPath.segments.length - 1].data = {
              angleRadians: l,
              id: wallPath.data.id,
            })
          let u = new THREE.BoxGeometry(
              wallPath.data.thickness,
              wallPath.data.height[0],
              wallPath.data.thickness
            ),
            p = new THREE.Mesh(u, wallMaterial)
          ;(p.position.x = 0),
            (p.position.y =
              wallPath.data.height[0] / 2 +
              project.layers["level" + wallPath.data.level].data.height),
            (p.position.z = 0),
            (p.userData.id = wallPath.data.id),
            (p.userData.level = wallPath.data.level),
            (p.frustumCulled = !1),
            scene.add(p),
            (wallsRectangles3d[wallPath.data.id] = p)
        }
        t = !1
      }),
        (Walls[wallPath.data.id] = wallPath),
        (plan.walls[wallPath.data.id] = {
          id: wallPath.data.id,
          wallPath: wallPath,
        }),
        render()
    }
  } else console.log("wall val missing info"), console.log(e)
}
function loadRoof(e) {
  if (e.roofPath[1]) {
    e.id > roofIdCounter && (roofIdCounter = e.id),
      (roofPath = new paper.Path()),
      (roofPath.strokeColor = new paper.Color(0, 0, 0, 0)),
      (roofPath.data.id = e.id),
      (roofPath.data.join0 = e.roofPath[1].data.join0),
      (roofPath.data.join1 = e.roofPath[1].data.join1),
      (roofPath.data.type = "roofPath"),
      (roofPath.data.width = parseInt(
        e.roofPath[1].data.width ? e.roofPath[1].data.width : defaultRoofWidth
      )),
      (roofPath.data.rise = parseInt(
        e.roofPath[1].data.rise || 0 === e.roofPath[1].data.rise
          ? e.roofPath[1].data.rise
          : defaultRoofRise
      )),
      (roofPath.data.startHeight = parseInt(
        e.roofPath[1].data.startHeight
          ? e.roofPath[1].data.startHeight
          : defaultRoofStartHeight
      )),
      (roofPath.data.thickness = parseInt(
        e.roofPath[1].data.thickness
          ? e.roofPath[1].data.thickness
          : defaultRoofThickness
      )),
      (roofPath.data.level = (
        e.roofPath[1].data.level ? e.roofPath[1].data.level : 0
      ).toString())
    let t = !0
    if (
      e.roofPath[1] &&
      e.roofPath[1].segments &&
      2 === e.roofPath[1].segments.length
    ) {
      let o = roofPath.data.width / 2
      e.roofPath[1].segments.forEach(function (e) {
        if ((roofPath.add(new paper.Point(e[0], e[1])), !t)) {
          let a = roofPath.segments[0].point,
            n = roofPath.segments[1].point,
            l = getAngleRadians(a, n),
            i = new Point(a.x + Math.sin(l) * o, a.y - Math.cos(l) * o),
            r = new Point(n.x + Math.sin(l) * o, n.y - Math.cos(l) * o),
            s = new Point(n.x - Math.sin(l) * o, n.y + Math.cos(l) * o),
            d = new Point(a.x - Math.sin(l) * o, a.y + Math.cos(l) * o),
            c = new Path()
          ;(c.data.type = "roofRectangle"),
            (c.data.id = roofPath.data.id),
            (c.data.level = roofPath.data.level),
            (c.fillColor = new paper.Color(0.35, 0.65, 0.85, 0.25)),
            (c.strokeColor = "#b19064"),
            (c.strokeWidth = 1),
            (c.strokeScaling = !1),
            (c.segments = roofHelperRectangle.segments),
            (c.segments[0].point = i),
            (c.segments[1].point = r),
            (c.segments[2].point = s),
            (c.segments[3].point = d),
            (roofsRectangles[roofPath.data.id] = c),
            project.layers["level" + roofPath.data.level] ||
              addNewLevel(roofPath.data.level),
            project.activeLayer.data.id !== roofPath.data.level &&
              setLevel(roofPath.data.level),
            roofsGroup[roofPath.data.level].addChild(
              roofsRectangles[roofPath.data.id]
            ),
            (roofPath.segments[roofPath.segments.length - 1].data = {
              angleRadians: l,
              id: roofPath.data.id,
            })
          let u = new THREE.BoxGeometry(
              roofPath.data.width,
              roofPath.data.thickness,
              roofPath.data.width
            ),
            p = new THREE.Mesh(u, roofMaterial)
          ;(p.position.x = 0),
            (p.position.y =
              roofPath.data.thickness / 2 +
              roofPath.data.rise / 2 +
              project.layers["level" + roofPath.data.level].data.height +
              roofPath.data.startHeight),
            (p.position.z = 0),
            (p.userData.id = roofPath.data.id),
            (p.userData.level = roofPath.data.level),
            (p.frustumCulled = !1),
            (p.name = "roof" + roofPath.data.id),
            scene.add(p),
            (roofsRectangles3d[roofPath.data.id] = p),
            (clickableObjects["roof" + roofPath.data.id] =
              roofsRectangles3d[roofPath.data.id])
        }
        t = !1
      }),
        (Roofs[roofPath.data.id] = roofPath),
        (plan.roofs[roofPath.data.id] = {
          id: roofPath.data.id,
          roofPath: roofPath,
        }),
        render()
    }
  } else console.log("roof val missing info"), console.log(e)
}
function resizeViews() {
  resize3dView(), resizePlanView()
}
function resize3dView() {
  ;(camera.aspect = container.clientWidth / container.clientHeight),
    camera.updateProjectionMatrix(),
    renderer.setSize(container.clientWidth, container.clientHeight),
    controls.handleResize(),
    render()
}
function animate(e) {
  requestAnimationFrame(animate),
    TWEEN.update(e),
    controls.update(),
    model3dViewOpen && (model3dObjectRef.rotateY(0.01), renderModel3d())
}
function render() {
  if (!busy) {
    busy = !0
    try {
      renderer.render(scene, camera)
    } catch (e) {
      console.log("render : " + e)
    }
    busy = !1
  }
}
function renderModel3d() {
  try {
    model3dSceneRenderer.render(model3dScene, model3dSceneCamera)
  } catch (e) {
    console.log("renderModel3d : " + e)
  }
}
function beginDrag(e, t) {
  try {
    showFurnitureLicenseSummary(t),
      setToolMode("pointer"),
      (draggingFurnitureId = t),
      (draggingFurnitureIcon = !0)
    let o = paper.view.viewToProject(
      new paper.Point(
        e.pageX - planView.offsetLeft,
        e.pageY - planView.offsetTop
      )
    )
    ;(draggingFurnitureRectangle.position = o),
      furnitureItems[t].scale && furnitureItems[t].scale.x
        ? (draggingFurnitureRectangle.bounds.width =
            furnitureItems[t].size.x * furnitureItems[t].scale.x)
        : (draggingFurnitureRectangle.bounds.width = furnitureItems[t].size.x),
      furnitureItems[t].scale && furnitureItems[t].scale.z
        ? (draggingFurnitureRectangle.bounds.height =
            furnitureItems[t].size.z * furnitureItems[t].scale.z)
        : (draggingFurnitureRectangle.bounds.height = furnitureItems[t].size.z),
      (draggingFurnitureRectangle.visible = !1),
      (furnitureDragDiv.style.background = "url('objects/" + t + "_top.png')"),
      (furnitureDragDiv.style.backgroundRepeat = "no-repeat")
    let a, n
    ;(a = draggingFurnitureRectangle.bounds.width),
      (n = draggingFurnitureRectangle.bounds.height),
      (a *= paper.view.zoom),
      (n *= paper.view.zoom),
      (furnitureDragDiv.style.left = e.clientX - a / 2 + "px"),
      (furnitureDragDiv.style.top = e.clientY - n / 2 + "px"),
      (furnitureDragDiv.style.width = a + "px"),
      (furnitureDragDiv.style.height = n + "px"),
      (furnitureDragDiv.style.backgroundSize = a + "px " + n + "px"),
      (furnitureDragDiv.style.display = "block")
  } catch (e) {
    console.log(e)
  }
}
function addFurniture(e) {
  let t = draggingFurnitureRectangle.position
  t.x > paper.view.bounds.left
    ? t.y > paper.view.bounds.top && t.y < paper.view.bounds.bottom
      ? initFurniture(t)
      : t.y > paper.view.bounds.bottom
      ? console.log("dropped insoide 3dview drop. todo implement")
      : console.log("dropped not inside views")
    : console.log("dropped not inside views"),
    (furnitureDragDiv.style.display = "none"),
    (draggingFurnitureId = -1),
    (draggingFurnitureIcon = !1),
    (furnitureDragDiv.style.background = "url('media/tmp.png')"),
    (draggingFurnitureRectangle.visible = !1),
    e.preventDefault()
}
function initFurniture(e) {
  ;(e.x = parseInt(e.x)), (e.y = parseInt(e.y))
  let t = draggingFurnitureId,
    o = draggingFurnitureAngle
  new THREE.MTLLoader()
    .setPath("objects/")
    .load(t + "/" + t + ".mtl", function (a) {
      ;(a.baseUrl = "objects/" + t + "/"),
        a.preload(),
        new THREE.OBJLoader()
          .setMaterials(a)
          .setPath("objects/")
          .load(
            t + "/" + t + ".obj",
            function (a) {
              try {
                let n = new Image()
                ;(n.src = "objects/" + t + "_top.png"),
                  (n.onload = function () {
                    let l = new THREE.Box3().setFromObject(a)
                    ;(a.userData.width = l.max.x - l.min.x),
                      (a.userData.height = l.max.y - l.min.y),
                      (a.userData.depth = l.max.z - l.min.z)
                    for (let i = 0; i < a.children.length; i++) {
                      let r = l.min.x + (l.max.x - l.min.x) / 2,
                        s =
                          l.min.y +
                          (l.max.y - l.min.y) / 2 -
                          (l.max.y - l.min.y) / 2,
                        d = l.min.z + (l.max.z - l.min.z) / 2
                      a.children[i].translateX(-r),
                        a.children[i].translateY(-s),
                        a.children[i].translateZ(-d)
                    }
                    let c = new THREE.BoxHelper(a, 16711680)
                    ;(c.material.linewidth = 5),
                      (c.visible = !1),
                      a.add(c),
                      (a.position.y =
                        0.1 +
                        project.activeLayer.data.height +
                        defaultFloorThickness),
                      (a.position.x = e.x),
                      (a.position.z = e.y),
                      scene.add(a),
                      clickableObjectsCounter++
                    let u = clickableObjectsCounter
                    ;(a.name = u), (clickableObjects[u] = a)
                    let p = new THREE.BoxGeometry(
                        a.userData.width,
                        a.userData.height,
                        a.userData.depth
                      ),
                      m = new paper.Raster(n)
                    ;(m.visible = !1),
                      (m.onLoad = function () {
                        if (
                          ((m.data.type = "furniture"),
                          (m.opacity = 0.5),
                          (m.bounds.width = l.max.x - l.min.x),
                          (m.bounds.height = l.max.z - l.min.z),
                          (m.position = e),
                          (m.data.flipX = 1),
                          (m.data.flipZ = 1),
                          (m.fillColor = new paper.Color(1, 1, 1, 1)),
                          (m.selectedColor = new paper.Color(0, 0, 0, 0)),
                          readOnly ||
                            (m.onMouseDown = function (e) {
                              if ("pointer" === toolMode) {
                                deselectAll(),
                                  (selectedItem = this),
                                  (mouseMode = 0),
                                  (offsetMousePoint =
                                    selectedItem.position.subtract(e.point)),
                                  (offsetMousePoint.x = parseInt(
                                    offsetMousePoint.x
                                  )),
                                  (offsetMousePoint.y = parseInt(
                                    offsetMousePoint.y
                                  )),
                                  selectedItem.bringToFront(),
                                  this.data.toolsRectangleInner &&
                                    this.data.toolsRectangleInner.remove(),
                                  (this.rotation = 0)
                                let o = new paper.Path.Rectangle(this.bounds)
                                ;(this.rotation = this.data.angle),
                                  (o.data.type = "toolsRectangle"),
                                  (o.strokeColor = "#b19064"),
                                  (o.strokeWidth = 1),
                                  (o.strokeScaling = !1),
                                  (o.locked = !0),
                                  o.rotate(this.data.angle),
                                  (this.data.toolsRectangleInner = o),
                                  (o.visible = !0),
                                  (this.data.boxHelper.visible = !0),
                                  redrawGrid(),
                                  (rotateIcon.visible = !0),
                                  (resizeIcon.visible = !0),
                                  (elevateIcon.visible = !0),
                                  (heightIcon.visible = !0),
                                  (toolsGroup.position =
                                    selectedItem.bounds.center),
                                  (toolsGroup.visible = !0),
                                  toolsGroup.bringToFront(),
                                  rotateIcon.bringToFront(),
                                  resizeIcon.bringToFront(),
                                  elevateIcon.bringToFront(),
                                  heightIcon.bringToFront(),
                                  (rotateIcon.data.level =
                                    project.activeLayer.data.id),
                                  (resizeIcon.data.level =
                                    project.activeLayer.data.id),
                                  (elevateIcon.data.level =
                                    project.activeLayer.data.id),
                                  (heightIcon.data.level =
                                    project.activeLayer.data.id),
                                  (toolsGroup.data.level =
                                    project.activeLayer.data.id),
                                  (modalModel3dFurnitureId = t),
                                  updateObjectPropertiesWindow()
                              }
                            }),
                          (m.data.id = u),
                          (m.data.fid = t),
                          (m.data.boxHelper = c),
                          (m.data.level = project.activeLayer.data.id),
                          furnitureItems[t].useMask)
                        ) {
                          m.useMask = !0
                          let n = new THREE.Mesh(
                            p,
                            new THREE.MeshStandardMaterial({})
                          )
                          ;(n.position.x = a.position.x),
                            (n.position.y = a.position.y),
                            (n.position.z = a.position.z),
                            n.geometry.translate(0, a.userData.height / 2, 0),
                            (n.visible = !1),
                            scene.add(n),
                            (maskObjects[u] = n),
                            (n.name = "mask" + u)
                        }
                        if (o) {
                          let i = (o + 360) % 360
                          m.rotate(i),
                            (m.data.angle = i),
                            clickableObjects[u].rotateY((-i / 180) * Math.PI),
                            maskObjects[u] &&
                              (maskObjects[u].rotateY((-i / 180) * Math.PI),
                              (maskObjects[u].scale.x = 1),
                              (maskObjects[u].scale.y = 1),
                              (maskObjects[u].scale.z = 1))
                        } else m.data.angle = 0
                        ;(tween = new TWEEN.Tween(controls.target)
                          .to(a.position, 500)
                          .onUpdate(render)
                          .start()),
                          (m.visible = !0),
                          (Furniture[u] = m),
                          furnitureGroup[project.activeLayer.data.id].addChild(
                            Furniture[u]
                          ),
                          (plan.furniture[u] = {
                            id: u,
                            fid: t,
                            position: clickableObjects[u].position,
                            scale: clickableObjects[u].scale,
                            rotation: clickableObjects[u].rotation,
                            width: m.bounds.width,
                            depth: m.bounds.height,
                            angle: m.data.angle,
                            level: m.data.level,
                            flipX: m.data.flipX,
                            flipZ: m.data.flipZ,
                          }),
                          (progressBar.style.display = "none")
                        for (
                          let r = m.canvas.getContext("2d"),
                            s = r.getImageData(0, 0, m.width, m.height),
                            d = s.data,
                            g = 0;
                          g < d.length;
                          g += 4
                        )
                          (d[g] = 255 - d[g]),
                            (d[g + 1] = 255 - d[g + 1]),
                            (d[g + 2] = 255 - d[g + 2])
                        r.putImageData(s, 0, 0),
                          updatePlanHistory(
                            plan,
                            u,
                            null,
                            null,
                            null,
                            null,
                            null,
                            null,
                            null,
                            null,
                            null,
                            null,
                            null,
                            null,
                            null,
                            null,
                            null,
                            null,
                            null
                          )
                      })
                  })
              } catch (e) {
                console.dir(e)
              }
            },
            onProgress,
            onError
          )
    })
}
function loadFurniture(e, t, o) {
  if (furnitureItems[e.fid])
    if (
      (e.id > clickableObjectsCounter && (clickableObjectsCounter = e.id),
      "planView" != UILayout)
    )
      new THREE.MTLLoader()
        .setPath("objects/")
        .load(e.fid + "/" + e.fid + ".mtl", function (a) {
          ;(a.baseUrl = "objects/" + e.fid + "/"),
            a.preload(),
            new THREE.OBJLoader()
              .setMaterials(a)
              .setPath("objects/")
              .load(
                e.fid + "/" + e.fid + ".obj",
                function (a) {
                  try {
                    let n = new Image()
                    ;(n.src = "objects/" + e.fid + "_top.png"),
                      (n.onload = function () {
                        let l = new THREE.Box3().setFromObject(a)
                        ;(a.userData.width = l.max.x - l.min.x),
                          (a.userData.height = l.max.y - l.min.y),
                          (a.userData.depth = l.max.z - l.min.z)
                        for (let i = 0; i < a.children.length; i++) {
                          let r = l.min.x + (l.max.x - l.min.x) / 2,
                            s =
                              l.min.y +
                              (l.max.y - l.min.y) / 2 -
                              (l.max.y - l.min.y) / 2,
                            d = l.min.z + (l.max.z - l.min.z) / 2
                          a.children[i].translateX(-r),
                            a.children[i].translateY(-s),
                            a.children[i].translateZ(-d)
                        }
                        let c = new THREE.BoxHelper(a, 16711680)
                        ;(c.material.linewidth = 5),
                          (c.visible = !1),
                          a.add(c),
                          (a.position.x = parseFloat(e.position.x)),
                          (a.position.y = parseFloat(e.position.y)),
                          (a.position.z = parseFloat(e.position.z)),
                          scene.add(a),
                          (clickableObjects[e.id] = a),
                          (a.name = e.id)
                        let u = new THREE.BoxGeometry(
                            a.userData.width,
                            a.userData.height,
                            a.userData.depth
                          ),
                          p = new paper.Raster(n)
                        ;(p.visible = !1),
                          (p.data.id = e.id),
                          (p.data.fid = e.fid),
                          (p.data.boxHelper = c),
                          (p.data.level = (e.level ? e.level : 0).toString()),
                          project.layers["level" + p.data.level] ||
                            addNewLevel(p.data.level),
                          project.activeLayer.data.id !== p.data.level &&
                            (o || setLevel(p.data.level)),
                          furnitureGroup[p.data.level].addChild(p),
                          (p.data.flipX = e.flipX ? e.flipX : 1),
                          (p.data.flipZ = e.flipZ ? e.flipZ : 1),
                          (p.onLoad = (function (e) {
                            ;(p.data.type = "furniture"),
                              (p.opacity = 0.5),
                              (p.fillColor = new paper.Color(1, 1, 1, 1)),
                              (p.selectedColor = new paper.Color(0, 0, 0, 0)),
                              readOnly ||
                                (p.onMouseDown = function (t) {
                                  if ("pointer" === toolMode) {
                                    deselectAll(),
                                      (selectedItem = this),
                                      (mouseMode = 0),
                                      (offsetMousePoint =
                                        selectedItem.position.subtract(
                                          t.point
                                        )),
                                      (offsetMousePoint.x = parseInt(
                                        offsetMousePoint.x
                                      )),
                                      (offsetMousePoint.y = parseInt(
                                        offsetMousePoint.y
                                      )),
                                      selectedItem.bringToFront(),
                                      this.data.toolsRectangleInner &&
                                        this.data.toolsRectangleInner.remove(),
                                      (this.rotation = 0)
                                    let o = new paper.Path.Rectangle(
                                      this.bounds
                                    )
                                    ;(this.rotation = this.data.angle),
                                      (o.data.type = "toolsRectangle"),
                                      (o.strokeColor = "#b19064"),
                                      (o.strokeWidth = 1),
                                      (o.strokeScaling = !1),
                                      (o.locked = !0),
                                      o.rotate(this.data.angle),
                                      (this.data.toolsRectangleInner = o),
                                      (o.visible = !0),
                                      (this.data.boxHelper.visible = !0),
                                      redrawGrid(),
                                      (rotateIcon.visible = !0),
                                      (resizeIcon.visible = !0),
                                      (elevateIcon.visible = !0),
                                      (heightIcon.visible = !0),
                                      (toolsGroup.position =
                                        selectedItem.bounds.center),
                                      (toolsGroup.visible = !0),
                                      toolsGroup.bringToFront(),
                                      (rotateIcon.data.level =
                                        project.activeLayer.data.id),
                                      (resizeIcon.data.level =
                                        project.activeLayer.data.id),
                                      (elevateIcon.data.level =
                                        project.activeLayer.data.id),
                                      (heightIcon.data.level =
                                        project.activeLayer.data.id),
                                      (toolsGroup.data.level =
                                        project.activeLayer.data.id),
                                      (modalModel3dFurnitureId = e.fid),
                                      updateObjectPropertiesWindow()
                                  }
                                }),
                              (p.visible = !0),
                              p.bringToFront(),
                              clickableObjects[e.id].scale.set(
                                parseFloat(e.scale.x),
                                parseFloat(e.scale.y),
                                parseFloat(e.scale.z)
                              ),
                              e.flipX === -1 && flipImageDataX(p),
                              e.flipZ === -1 && flipImageDataZ(p),
                              (l = new THREE.Box3().setFromObject(a))
                            let o = l.max.x - l.min.x,
                              n = l.max.z - l.min.z
                            if (furnitureItems[e.fid].useMask) {
                              p.useMask = !0
                              let i = new THREE.Mesh(
                                u,
                                new THREE.MeshStandardMaterial({})
                              )
                              ;(i.position.x = a.position.x),
                                (i.position.y = a.position.y),
                                (i.position.z = a.position.z),
                                i.geometry.translate(
                                  0,
                                  a.userData.height / 2,
                                  0
                                ),
                                (i.visible = !1),
                                scene.add(i),
                                (maskObjects[e.id] = i),
                                (i.name = "mask" + e.id)
                            }
                            if (
                              ((p.rotation = 0),
                              (p.bounds.width = Math.abs(o)),
                              (p.bounds.height = Math.abs(n)),
                              (p.position = new paper.Point(
                                parseInt(e.position.x),
                                parseInt(e.position.z)
                              )),
                              e.angle)
                            ) {
                              let r = (e.angle + 360) % 360
                              p.rotate(r),
                                (p.data.angle = r),
                                clickableObjects[e.id].rotateY(
                                  (-r / 180) * Math.PI
                                ),
                                maskObjects[e.id] &&
                                  maskObjects[e.id].rotateY(
                                    (-r / 180) * Math.PI
                                  )
                            } else p.data.angle = 0
                            e.scale &&
                              maskObjects[e.id] &&
                              ((maskObjects[e.id].scale.x = parseFloat(
                                Math.abs(e.scale.x)
                              )),
                              (maskObjects[e.id].scale.y = parseFloat(
                                Math.abs(e.scale.y)
                              )),
                              (maskObjects[e.id].scale.z = parseFloat(
                                Math.abs(e.scale.z)
                              ))),
                              render(),
                              (Furniture[e.id] = p),
                              (plan.furniture[e.id] = {
                                id: e.id,
                                fid: e.fid,
                                position: clickableObjects[e.id].position,
                                scale: clickableObjects[e.id].scale,
                                rotation: clickableObjects[e.id].rotation,
                                width: o,
                                depth: n,
                                angle: p.data.angle,
                                level: p.data.level,
                                flipX: p.data.flipX,
                                flipZ: p.data.flipZ,
                              }),
                              loadedFurnitureCount++,
                              (loadingProgressTxt =
                                "Furniture id : " +
                                e.id +
                                " loaded\n" +
                                loadingProgressTxt),
                              (document.getElementById(
                                "modalLoadingDataInfo"
                              ).innerHTML = loadingProgressTxt),
                              loadedFurnitureCount === furnitureToLoadCount &&
                                doLoadFinished(),
                              (progressBar.style.display = "none")
                            for (
                              let s = p.canvas.getContext("2d"),
                                d = s.getImageData(0, 0, p.width, p.height),
                                c = d.data,
                                m = 0;
                              m < c.length;
                              m += 4
                            )
                              (c[m] = 255 - c[m]),
                                (c[m + 1] = 255 - c[m + 1]),
                                (c[m + 2] = 255 - c[m + 2])
                            s.putImageData(d, 0, 0),
                              t &&
                                updatePlanHistory(
                                  plan,
                                  e.id,
                                  null,
                                  null,
                                  null,
                                  null,
                                  null,
                                  null,
                                  null,
                                  null,
                                  null,
                                  null,
                                  null,
                                  null,
                                  null,
                                  null,
                                  null,
                                  null,
                                  null
                                )
                          })(e))
                      })
                  } catch (e) {
                    console.dir(e)
                  }
                },
                onProgress,
                onError
              )
        })
    else {
      let a = new Image()
      ;(a.src = "objects/" + e.fid + "_top.png"),
        (a.onload = function () {
          let t = new paper.Raster(a)
          ;(t.visible = !1),
            (t.data.id = e.id),
            (t.data.fid = e.fid),
            (t.data.level = (e.level ? e.level : 0).toString()),
            project.layers["level" + t.data.level] || addNewLevel(t.data.level),
            project.activeLayer.data.id !== t.data.level &&
              setLevel(t.data.level),
            furnitureGroup[t.data.level].addChild(t),
            (t.data.flipX = e.flipX ? e.flipX : 1),
            (t.data.flipZ = e.flipZ ? e.flipZ : 1),
            (t.onLoad = (function (e) {
              if (
                ((t.data.type = "furniture"),
                (t.opacity = 0.5),
                (t.fillColor = new paper.Color(1, 1, 1, 1)),
                (t.visible = !0),
                t.bringToFront(),
                e.flipX === -1 && flipImageDataX(t),
                e.flipZ === -1 && flipImageDataZ(t),
                (t.rotation = 0),
                (t.bounds.width = Math.abs(e.width)),
                (t.bounds.height = Math.abs(e.depth)),
                (t.position = new paper.Point(
                  parseInt(e.position.x),
                  parseInt(e.position.z)
                )),
                e.angle)
              ) {
                let o = (e.angle + 360) % 360
                t.rotate(o), (t.data.angle = o)
              } else t.data.angle = 0
              ;(Furniture[e.id] = t),
                loadedFurnitureCount++,
                (loadingProgressTxt =
                  "Furniture id : " + e.id + " loaded\n" + loadingProgressTxt),
                (document.getElementById("modalLoadingDataInfo").innerHTML =
                  loadingProgressTxt),
                loadedFurnitureCount === furnitureToLoadCount &&
                  doLoadFinished()
              for (
                let a = t.canvas.getContext("2d"),
                  n = a.getImageData(0, 0, t.width, t.height),
                  l = n.data,
                  i = 0;
                i < l.length;
                i += 4
              )
                (l[i] = 255 - l[i]),
                  (l[i + 1] = 255 - l[i + 1]),
                  (l[i + 2] = 255 - l[i + 2])
              a.putImageData(n, 0, 0)
            })(e))
        })
    }
  else
    loadedFurnitureCount++,
      (loadingProgressTxt =
        "*** Could not find Furniture [" +
        e.fid +
        "] for id : " +
        e.id +
        " ***\n" +
        loadingProgressTxt),
      (document.getElementById("modalLoadingDataInfo").innerHTML =
        loadingProgressTxt),
      console.log("furniture val missing info"),
      console.log(e)
}
function editFurnitureByKey(e) {
  ;(clickableObjects[e.id].position.x = parseFloat(e.position.x)),
    (clickableObjects[e.id].position.y = parseFloat(e.position.y)),
    (clickableObjects[e.id].position.z = parseFloat(e.position.z)),
    clickableObjects[e.id].scale.set(
      parseFloat(e.scale.x),
      parseFloat(e.scale.y),
      parseFloat(e.scale.z)
    ),
    (clickableObjects[e.id].rotation.x = parseFloat(e.rotation._x)),
    (clickableObjects[e.id].rotation.y = parseFloat(e.rotation._y)),
    (clickableObjects[e.id].rotation.z = parseFloat(e.rotation._z)),
    maskObjects[e.id] &&
      ((maskObjects[e.id].position.x = parseFloat(e.position.x)),
      (maskObjects[e.id].position.y = parseFloat(e.position.y)),
      (maskObjects[e.id].position.z = parseFloat(e.position.z)),
      (maskObjects[e.id].scale.x = parseFloat(Math.abs(e.scale.x))),
      (maskObjects[e.id].scale.y = parseFloat(Math.abs(e.scale.y))),
      (maskObjects[e.id].scale.z = parseFloat(Math.abs(e.scale.z))),
      (maskObjects[e.id].rotation.x = parseFloat(e.rotation._x)),
      (maskObjects[e.id].rotation.y = parseFloat(e.rotation._y)),
      (maskObjects[e.id].rotation.z = parseFloat(e.rotation._z))),
    Object.keys(Furniture).forEach(function (t) {
      let o = Furniture[t]
      if ("object" == typeof o && o.data.id === e.id) {
        let a = (parseFloat(e.angle) + 360) % 360
        ;(o.rotation = 0),
          (o.bounds.width = parseFloat(Math.abs(e.width))),
          (o.bounds.height = parseFloat(Math.abs(e.depth))),
          o.data.flipX != e.flipX && flipImageDataX(o),
          (o.data.flipX = e.flipX),
          o.data.flipZ != e.flipZ && flipImageDataZ(o),
          (o.data.flipZ = e.flipZ),
          o.rotate(a),
          (o.data.angle = a),
          (o.position = new paper.Point(
            parseFloat(e.position.x),
            parseFloat(e.position.z)
          ))
      }
    }),
    render()
}
function redrawGrid() {
  if (!redrawing && "3dView" != UILayout) {
    if (
      ((redrawing = !0),
      (screenScale = screenAvg / paper.view.zoom / 75),
      selectedItem && selectedItem.data)
    )
      if ("wallPath" === selectedItem.data.type) {
        let e = 0
        selectedItem.segments.forEach(function (t) {
          movePointIcons[e] &&
            ((movePointIcons[e].position = t.point),
            (movePointIcons[e].bounds.width = screenScale),
            (movePointIcons[e].bounds.height = screenScale),
            e++)
        })
      } else if ("roofPath" === selectedItem.data.type) {
        let e = 0
        selectedItem.segments.forEach(function (t) {
          movePointIcons[e] &&
            ((movePointIcons[e].position = t.point),
            (movePointIcons[e].bounds.width = screenScale),
            (movePointIcons[e].bounds.height = screenScale),
            e++)
        })
      } else if ("furniture" === selectedItem.data.type)
        (rotateIcon.bounds.width = screenScale),
          (rotateIcon.bounds.height = screenScale),
          (rotateIcon.position =
            selectedItem.data.toolsRectangleInner.segments[1].point),
          (resizeIcon.bounds.width = screenScale),
          (resizeIcon.bounds.height = screenScale),
          (resizeIcon.position =
            selectedItem.data.toolsRectangleInner.segments[3].point),
          (heightIcon.bounds.width = screenScale),
          (heightIcon.bounds.height = screenScale),
          (heightIcon.position =
            selectedItem.data.toolsRectangleInner.segments[2].point),
          (elevateIcon.bounds.width = screenScale),
          (elevateIcon.bounds.height = screenScale),
          (elevateIcon.position =
            selectedItem.data.toolsRectangleInner.segments[0].point)
      else if ("background" === selectedItem.data.type)
        (resizeIcon.bounds.width = screenScale),
          (resizeIcon.bounds.height = screenScale),
          (resizeIcon.position =
            backgroundRaster.data.toolsRectangleInner.segments[3].point)
      else if ("floor" === selectedItem.data.type) {
        let e = 0
        selectedItem.segments.forEach(function (t) {
          movePointIcons[e] &&
            ((movePointIcons[e].position = t.point),
            (movePointIcons[e].bounds.width = screenScale),
            (movePointIcons[e].bounds.height = screenScale),
            e++)
        })
      }
    let t = 0,
      o = 0
    paper.view.zoom < 0.1875
      ? ((t = 200),
        (o = 2e3),
        (snapTolerance = 100),
        (paper.settings.hitTolerance = 3))
      : paper.view.zoom < 0.375
      ? ((t = 100),
        (o = 1e3),
        (snapTolerance = 50),
        (paper.settings.hitTolerance = 3))
      : paper.view.zoom < 0.75
      ? ((t = 50),
        (o = 500),
        (snapTolerance = 25),
        (paper.settings.hitTolerance = 3))
      : paper.view.zoom < 1.5
      ? ((t = 20),
        (o = 200),
        (snapTolerance = 10),
        (paper.settings.hitTolerance = 3))
      : paper.view.zoom < 3
      ? ((t = 10),
        (o = 100),
        (snapTolerance = 5),
        (paper.settings.hitTolerance = 3))
      : paper.view.zoom < 6
      ? ((t = 5),
        (o = 50),
        (snapTolerance = 2),
        (paper.settings.hitTolerance = 3))
      : paper.view.zoom < 12
      ? ((t = 2),
        (o = 20),
        (snapTolerance = 1),
        (paper.settings.hitTolerance = 2))
      : paper.view.zoom < 24 &&
        ((t = 1),
        (o = 10),
        (snapTolerance = 0.5),
        (paper.settings.hitTolerance = 1)),
      rulerLeftCtx.clearRect(0, 0, 30, rulerLeft.height),
      rulerBottomCtx.clearRect(0, 0, rulerBottom.width, 20)
    let a = paper.view.bounds.left % t,
      n = 0
    xLines.forEach(function (e) {
      ;(e.segments[0].point.x = paper.view.bounds.left + n - a),
        (e.segments[0].point.y = paper.view.bounds.top),
        (e.segments[1].point.x = paper.view.bounds.left + n - a),
        (e.segments[1].point.y = paper.view.bounds.bottom)
      let l = parseInt(e.segments[0].point.x)
      0 === l
        ? ((e.style.strokeColor = "white"),
          rulerBottomCtx.fillText(
            "0cm",
            (l - paper.view.bounds.left) * paper.view.zoom,
            14
          ))
        : l % o === 0
        ? ((e.style.strokeColor = "#81673a"),
          rulerBottomCtx.fillText(
            parseInt(paper.view.bounds.left + n - a),
            (l - paper.view.bounds.left) * paper.view.zoom,
            14
          ))
        : (e.style.strokeColor = "#564c3a"),
        (n += t)
    })
    let l = paper.view.bounds.top % t
    ;(n = 0),
      yLines.forEach(function (e) {
        ;(e.segments[0].point.x = paper.view.bounds.left),
          (e.segments[0].point.y = paper.view.bounds.top + n - l),
          (e.segments[1].point.x = paper.view.bounds.right),
          (e.segments[1].point.y = paper.view.bounds.top + n - l)
        let a = parseInt(e.segments[0].point.y)
        0 === a
          ? ((e.style.strokeColor = "white"),
            rulerLeftCtx.fillText(
              "0cm",
              26,
              (a - paper.view.bounds.top) * paper.view.zoom + 4
            ))
          : a % o === 0
          ? ((e.style.strokeColor = "#81673a"),
            rulerLeftCtx.fillText(
              parseInt(paper.view.bounds.top + n - l),
              26,
              (a - paper.view.bounds.top) * paper.view.zoom + 4
            ))
          : (e.style.strokeColor = "#564c3a"),
          (n += t)
      }),
      Object.keys(verticalGuides).forEach(function (e) {
        ;(verticalGuides[e].segments[0].point.y = paper.view.bounds.top),
          (verticalGuides[e].segments[1].point.y = paper.view.bounds.bottom)
      }),
      Object.keys(horizontalGuides).forEach(function (e) {
        ;(horizontalGuides[e].segments[0].point.x = paper.view.bounds.left),
          (horizontalGuides[e].segments[1].point.x = paper.view.bounds.right)
      }),
      (redrawing = !1)
  }
}
function redrawTexts() {
  Object.keys(Dimensions).forEach(function (e) {
    let t = Dimensions[e]
    "object" == typeof t && (Dimensions[e].text.fontSize = screenScale / 1.5)
  }),
    Object.keys(Texts).forEach(function (e) {
      let t = Texts[e]
      "object" == typeof t && (Texts[e].fontSize = screenScale / 1.5)
    })
}
function closeAllModals() {
  ;(model3dViewOpen = !1),
    $("#aboutModal").hide(),
    $("#model3dModal").hide(),
    $("#loadingModal").hide(),
    $("#shareModal").hide(),
    showMouseIndicators()
}
function openShareDialog() {
  $("#shareModal").show()
}
function generateShareLink() {
  try {
    createThumbForHistory(),
      $.ajax({
        type: "POST",
        url: "api/getsharelink",
        data: JSON.stringify({ plan: plan }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (e) {
          console.log(e),
            (shareLinkUrl = e.success),
            (document.getElementById("shareLinkUrl").value =
              "https://homeidea3d.seanwasere.com/edit/" + shareLinkUrl),
            (document.getElementById("shareLinkUrl3d").value =
              "https://homeidea3d.seanwasere.com/3d/" + shareLinkUrl),
            (document.getElementById("shareLinkUrlPlan").value =
              "https://homeidea3d.seanwasere.com/plan/" + shareLinkUrl)
        },
        failure: function (e) {
          console.log("generateShareLink : ajax : " + e)
        },
      })
  } catch (e) {
    console.log("generateShareLink : " + e)
  }
}
function initPlanView() {
  function e(e) {
    let t = e.wheelDelta ? e.wheelDelta / 40 : e.detail ? -e.detail : 0
    if (t) {
      let o = cumulclick
      cumulclick += Math.min(Math.max(t / 3, -1), 1)
      let a = Math.pow(scaleFactor, cumulclick)
      if (a > 0.0625 && a < 16) {
        paper.view.zoom = a
        let n = paper.view.viewToProject(
            new paper.Point(
              e.pageX - planView.offsetLeft,
              e.pageY - planView.offsetTop
            )
          ),
          l = 0.11 * (paper.view.center.x - n.x),
          i = 0.11 * (paper.view.center.y - n.y)
        if (t > 0) {
          let r = paper.view.center.x - l,
            s = paper.view.center.y - i,
            d = new paper.Point(r, s)
          paper.view.center = d
        } else {
          let r = paper.view.center.x + l,
            s = paper.view.center.y + i,
            d = new paper.Point(r, s)
          paper.view.center = d
        }
        redrawGrid(), redrawTexts()
      } else cumulclick = o
    }
    return e.preventDefault() && !1
  }
  if (
    ((planView = document.getElementById("planView")),
    (project.activeLayer.name = "level0"),
    (project.activeLayer.data = { id: "0", height: 0 }),
    (screenScale = screenAvg / paper.view.zoom / 75),
    (gridGroup = new paper.Group()),
    (floorsGroup = {}),
    (floorsGroup[0] = new paper.Group()),
    (roofsGroup = {}),
    (roofsGroup[0] = new paper.Group()),
    (wallsGroup = {}),
    (wallsGroup[0] = new paper.Group()),
    (dimensionsGroup = {}),
    (dimensionsGroup[0] = new paper.Group()),
    (furnitureGroup = {}),
    (furnitureGroup[0] = new paper.Group()),
    (textsGroup = {}),
    (textsGroup[0] = new paper.Group()),
    (guidesGroup = new paper.Group()),
    (rulerLeft = document.getElementById("rulerLeft")),
    (rulerBottom = document.getElementById("rulerBottom")),
    (mouseIndicatorX = document.getElementById("mouseIndicatorX")),
    (mouseIndicatorY = document.getElementById("mouseIndicatorY")),
    (planCanvas.width = planCanvas.parentNode.getBoundingClientRect().width),
    (planCanvas.height = planCanvas.parentNode.getBoundingClientRect().height),
    (rulerBottom.width = planCanvas.parentNode.getBoundingClientRect().width),
    (rulerLeft.height = planCanvas.parentNode.getBoundingClientRect().height),
    (planCanvas.oncontextmenu = function () {
      return !1
    }),
    (document.getElementsByClassName("close")[0].onclick = function () {
      closeAllModals(), showMouseIndicators()
    }),
    (document.getElementsByClassName("close")[1].onclick = function () {
      closeAllModals(), showMouseIndicators()
    }),
    (document.getElementsByClassName("close")[2].onclick = function () {
      closeAllModals(), showMouseIndicators()
    }),
    "3dView" != UILayout)
  ) {
    ;(rulerLeft.oncontextmenu = function () {
      return !1
    }),
      (rulerBottom.oncontextmenu = function () {
        return !1
      }),
      (rulerLeftCtx = rulerLeft.getContext("2d")),
      (rulerBottomCtx = rulerBottom.getContext("2d")),
      planCanvas.addEventListener(
        "mousemove",
        function (e) {
          ;(mouseIndicatorX.style.left = e.clientX + "px"),
            (mouseIndicatorY.style.top = e.clientY + "px")
        },
        !1
      )
    let t = /Firefox/i.test(navigator.userAgent)
      ? "DOMMouseScroll"
      : "mousewheel"
    planCanvas.addEventListener(t, e)
    for (let o = 0; o <= 200; o++) {
      let a = new paper.Point(10 * o, 0),
        n = new paper.Point(10 * o, 100),
        l = new paper.Path.Line(a, n)
      ;(l.strokeColor = "#cccccc"),
        (l.strokeWidth = 0.5),
        (l.strokeScaling = !1),
        xLines.push(l),
        gridGroup.addChild(l)
    }
    for (let o = 0; o <= 200; o++) {
      let i = new paper.Point(0, 10 * o),
        r = new paper.Point(100, 10 * o),
        l = new paper.Path.Line(i, r)
      ;(l.strokeColor = "#cccccc"),
        (l.strokeWidth = 0.5),
        (l.strokeScaling = !1),
        yLines.push(l),
        gridGroup.addChild(l)
    }
    ;(toolsGroup = new paper.Group()),
      (toolsGroup.rotation = 0),
      (rotateIcon = new paper.Raster("media/rotate.png")),
      (rotateIcon.data.type = "rotateFurnitureTool"),
      (rotateIcon.onMouseEnter = function (e) {
        planView.style.cursor = "move"
      }),
      (rotateIcon.onMouseLeave = function (e) {
        planView.style.cursor = "default"
      }),
      (rotateIcon.visible = !1),
      toolsGroup.addChild(rotateIcon),
      (resizeIcon = new paper.Raster("media/expand.png")),
      (resizeIcon.data.type = "stretchFurnitureXZTool"),
      (resizeIcon.onMouseEnter = function (e) {
        planView.style.cursor = "move"
      }),
      (resizeIcon.onMouseLeave = function (e) {
        planView.style.cursor = "default"
      }),
      (resizeIcon.visible = !1),
      toolsGroup.addChild(resizeIcon),
      (elevateIcon = new paper.Raster("media/elevation.png")),
      (elevateIcon.data.type = "elevateFurnitureTool"),
      (elevateIcon.onMouseEnter = function (e) {
        planView.style.cursor = "row-resize"
      }),
      (elevateIcon.onMouseLeave = function (e) {
        planView.style.cursor = "default"
      }),
      (elevateIcon.visible = !1),
      toolsGroup.addChild(elevateIcon),
      (heightIcon = new paper.Raster("media/height.png")),
      (heightIcon.data.type = "stretchFurnitureYTool"),
      (heightIcon.onMouseEnter = function (e) {
        planView.style.cursor = "ns-resize"
      }),
      (heightIcon.onMouseLeave = function (e) {
        planView.style.cursor = "default"
      }),
      (heightIcon.visible = !1),
      toolsGroup.addChild(heightIcon)
  }
  ;(wallHelperPath = new paper.Path.Line(
    new paper.Point(0, 0),
    new paper.Point(0, 0)
  )),
    (wallHelperPath.visible = !1),
    (wallHelperPath.strokeColor = new paper.Color(0, 0, 0, 0)),
    (wallHelperPath.strokeWidth = 2),
    (wallHelperPath.strokeScaling = !1),
    wallsGroup[project.activeLayer.data.id].addChild(wallHelperPath),
    (roofHelperPath = new paper.Path.Line(
      new paper.Point(0, 0),
      new paper.Point(0, 0)
    )),
    (roofHelperPath.visible = !1),
    (roofHelperPath.strokeColor = new paper.Color(0, 0, 0, 0)),
    (roofHelperPath.strokeWidth = 2),
    (roofHelperPath.strokeScaling = !1),
    roofsGroup[project.activeLayer.data.id].addChild(roofHelperPath),
    (floorHelperPath = new paper.Path.Line(
      new paper.Point(0, 0),
      new paper.Point(0, 0)
    )),
    (floorHelperPath.visible = !1),
    (floorHelperPath.strokeColor = "#b19064"),
    (floorHelperPath.strokeWidth = 2),
    (floorHelperPath.strokeScaling = !1),
    floorsGroup[project.activeLayer.data.id].addChild(floorHelperPath),
    (dimensionHelperPath = new paper.Path.Line(
      new paper.Point(0, 0),
      new paper.Point(0, 0)
    )),
    (dimensionHelperPath.visible = !1),
    (dimensionHelperPath.strokeColor = "#b19064"),
    (dimensionHelperPath.strokeWidth = 2),
    (dimensionHelperPath.strokeScaling = !1),
    dimensionsGroup[project.activeLayer.data.id].addChild(dimensionHelperPath)
  let s = new Rectangle(new Point(0, 0), new Point(0, 0))
  ;(wallHelperRectangle = new Path.Rectangle(s)),
    (wallHelperRectangle.strokeColor = "#b19064"),
    (wallHelperRectangle.strokeWidth = 2),
    (wallHelperRectangle.strokeScaling = !1),
    (s = new Rectangle(new Point(0, 0), new Point(0, 0))),
    (roofHelperRectangle = new Path.Rectangle(s)),
    (roofHelperRectangle.strokeColor = "#b19064"),
    (roofHelperRectangle.strokeWidth = 2),
    (roofHelperRectangle.strokeScaling = !1),
    (offsetMousePoint = new paper.Point(0, 0)),
    (tools = new paper.Tool()),
    (draggingFurnitureRectangle = new paper.Path.Rectangle(
      new Point(-1, -1),
      new Point(1, 1)
    )),
    (draggingFurnitureRectangle.strokeColor = "#b19064"),
    (draggingFurnitureRectangle.strokeWidth = 2),
    (draggingFurnitureRectangle.strokeScaling = !1),
    (draggingFurnitureRectangle.position = new paper.Point(0, 0)),
    (draggingFurnitureRectangle.visible = !1),
    furnitureGroup[project.activeLayer.data.id].addChild(
      draggingFurnitureRectangle
    ),
    (tools.onMouseDown = function (e) {
      if ("pointer" === toolMode)
        if (2 === e.event.buttons) mouseMode = -1
        else if (readOnly) mouseMode = -1
        else {
          let t = project.hitTest(e.point)
          if (t) {
            if (t.item.data)
              if (t.item.data.level === project.activeLayer.data.id.toString())
                if ("toolsRectangle" === t.item.data.type)
                  (mouseMode = 0),
                    (offsetMousePoint = selectedItem.position.subtract(
                      e.point
                    )),
                    (offsetMousePoint.x = parseInt(offsetMousePoint.x)),
                    (offsetMousePoint.y = parseInt(offsetMousePoint.y))
                else if ("rotateFurnitureTool" === t.item.data.type)
                  (mouseMode = 1), console.log("isRotateTool")
                else if ("stretchFurnitureXZTool" === t.item.data.type)
                  (mouseMode = 2), console.log("isStretchXY")
                else if ("stretchFurnitureYTool" === t.item.data.type)
                  console.log("isStretchYTool"),
                    (mouseMode = 4),
                    (snapPoint = e.point),
                    (snapPoint.x = parseInt(e.point.x)),
                    (snapPoint.y = parseInt(e.point.y)),
                    scalingY
                      ? console.log("this should never happen : scalingY")
                      : ((scalingY = !0),
                        (stretchYStartHeight =
                          clickableObjects[selectedItem.data.id].userData
                            .height *
                          clickableObjects[selectedItem.data.id].scale.y),
                        (stretchYPath = new paper.Path()),
                        (stretchYPath.strokeColor = "black"),
                        stretchYPath.add(snapPoint),
                        stretchYPath.add(snapPoint),
                        (stretchYPath.visible = !0))
                else if ("elevateFurnitureTool" === t.item.data.type)
                  (mouseMode = 5),
                    console.log("isElevateTool"),
                    (snapPoint = e.point),
                    (snapPoint.x = parseInt(e.point.x)),
                    (snapPoint.y = parseInt(e.point.y)),
                    elevating
                      ? console.log("this should never happen : elevating")
                      : ((elevating = !0),
                        (elevateStartHeight =
                          clickableObjects[selectedItem.data.id].position.y),
                        (elevatePath = new paper.Path()),
                        (elevatePath.strokeColor = "black"),
                        elevatePath.add(snapPoint),
                        elevatePath.add(snapPoint),
                        (elevatePath.visible = !0))
                else if ("furniture" === t.item.data.type)
                  selectedItem.data.id &&
                    (tween = new TWEEN.Tween(controls.target)
                      .to(clickableObjects[selectedItem.data.id].position, 500)
                      .onUpdate(render)
                      .start())
                else if ("wallRectangle" === t.item.data.type) {
                  deselectAll()
                  let o = Walls[t.item.data.id]
                  o.bringToFront(),
                    (o.selected = !0),
                    (selectedItem = o),
                    o.segments.forEach(function (e) {
                      let t = new paper.Raster("media/movePointIcon.png")
                      ;(t.data.type = "movePointIconWalls"),
                        (t.data.id = e.index),
                        (t.data.level = project.activeLayer.data.id),
                        (t.data.wallId = o.data.id),
                        (t.bounds.width = screenScale),
                        (t.bounds.height = screenScale),
                        (t.position = e.point),
                        (t.onMouseEnter = function (e) {
                          planView.style.cursor = "move"
                        }),
                        (t.onMouseLeave = function (e) {
                          planView.style.cursor = "default"
                        }),
                        (t.visible = !0),
                        t.bringToFront(),
                        movePointIcons.push(t)
                    }),
                    (selectedMovePointIcon = null),
                    (movePointIconSelectedId = null),
                    updateObjectPropertiesWindow()
                } else if ("roofRectangle" === t.item.data.type) {
                  deselectAll()
                  let a = Roofs[t.item.data.id]
                  a.bringToFront(),
                    (a.selected = !0),
                    (selectedItem = a),
                    a.segments.forEach(function (e) {
                      let t = new paper.Raster("media/movePointIcon.png")
                      ;(t.data.type = "movePointIconRoofs"),
                        (t.data.id = e.index),
                        (t.data.level = project.activeLayer.data.id),
                        (t.data.roofId = a.data.id),
                        (t.bounds.width = screenScale),
                        (t.bounds.height = screenScale),
                        (t.position = e.point),
                        (t.onMouseEnter = function (e) {
                          planView.style.cursor = "move"
                        }),
                        (t.onMouseLeave = function (e) {
                          planView.style.cursor = "default"
                        }),
                        (t.visible = !0),
                        t.bringToFront(),
                        movePointIcons.push(t)
                    }),
                    (selectedMovePointIcon = null),
                    (movePointIconSelectedId = null),
                    updateObjectPropertiesWindow()
                } else if ("movePointIconWalls" === t.item.data.type)
                  movePointIcons.forEach(function (e) {
                    e.selected = !1
                  }),
                    (selectedMovePointIcon = t.item),
                    (selectedMovePointIcon.selected = !0),
                    (movePointIconSelectedId = t.item.data.id),
                    recalcAllUnjoinedWallSegments(selectedItem.data.id),
                    (mouseMode = 3)
                else if ("movePointIconRoofs" === t.item.data.type)
                  movePointIcons.forEach(function (e) {
                    e.selected = !1
                  }),
                    (selectedMovePointIcon = t.item),
                    (selectedMovePointIcon.selected = !0),
                    (movePointIconSelectedId = t.item.data.id),
                    recalcAllUnjoinedRoofSegments(selectedItem.data.id),
                    (mouseMode = 11)
                else if ("movePointIconFloors" === t.item.data.type)
                  movePointIcons.forEach(function (e) {
                    e.selected = !1
                  }),
                    (selectedMovePointIcon = t.item),
                    (selectedMovePointIcon.selected = !0),
                    (movePointIconSelectedId = t.item.data.id),
                    recalcAllWallCorners(),
                    (mouseMode = 6)
                else if ("floor" === t.item.data.type) {
                  deselectAll()
                  let n = Floors[t.item.data.id]
                  ;(n.selected = !0),
                    (selectedItem = n),
                    n.segments.forEach(function (e) {
                      let t = new paper.Raster("media/movePointIcon.png")
                      ;(t.data.type = "movePointIconFloors"),
                        (t.data.id = e.index),
                        (t.data.level = project.activeLayer.data.id),
                        (t.bounds.width = screenScale),
                        (t.bounds.height = screenScale),
                        (t.position = e.point),
                        (t.onMouseEnter = function (e) {
                          planView.style.cursor = "move"
                        }),
                        (t.onMouseLeave = function (e) {
                          planView.style.cursor = "default"
                        }),
                        (t.visible = !0),
                        t.bringToFront(),
                        movePointIcons.push(t)
                    }),
                    (selectedMovePointIcon = null),
                    (movePointIconSelectedId = null),
                    updateObjectPropertiesWindow()
                  for (
                    let l = { x: 0, y: 0, z: 0 },
                      i =
                        Floors3d[selectedItem.data.id].geometry.attributes
                          .position.array,
                      r = 0;
                    r < i.length;
                    r += 3
                  )
                    (l.x += i[r]), (l.y += i[r + 2]), (l.z += i[r + 1])
                  ;(l.x /= i.length / 3),
                    (l.y /= i.length / 3),
                    (l.z /= i.length / 3),
                    (tween = new TWEEN.Tween(controls.target)
                      .to(l, 500)
                      .onUpdate(render)
                      .start()),
                    recalcAllWallCorners()
                } else
                  "dimension" === t.item.data.type
                    ? (deselectAll(),
                      (selectedItem = Dimensions[t.item.data.id].text),
                      (Dimensions[selectedItem.data.id].text.selected = !0),
                      (Dimensions[selectedItem.data.id].line.selected = !0),
                      updateObjectPropertiesWindow(),
                      recalcAllWallCorners(),
                      recalcAllRoofCorners())
                    : "text" === t.item.data.type
                    ? (deselectAll(),
                      (mouseMode = 7),
                      (selectedItem = Texts[t.item.data.id]),
                      (Texts[t.item.data.id].selected = !0),
                      (editingTextId = t.item.data.id),
                      updateObjectPropertiesWindow())
                    : console.log("mouse down not handled")
              else
                t.item.data.level === -1 &&
                  ("verticalGuide" === t.item.data.type
                    ? ((selectedGuideId = t.item.data.id), (mouseMode = 9))
                    : "horizontalGuide" === t.item.data.type &&
                      ((selectedGuideId = t.item.data.id), (mouseMode = 10)))
          } else console.log("hit result nothing"), (mouseMode = -1)
        }
      else if ("walls" === toolMode)
        if (2 === e.event.buttons) mouseMode = -1
        else {
          if (((mouseMode = 0), Date.now() - lastNewWallSegmentClick > 250)) {
            if (
              ((snapPoint = e.point),
              (snapPoint.x = parseInt(e.point.x)),
              (snapPoint.y = parseInt(e.point.y)),
              ctrlKeyPressed &&
                ((snapPoint.x = snapPoint.x - (snapPoint.x % 10)),
                (snapPoint.y = snapPoint.y - (snapPoint.y % 10))),
              recalcAllUnjoinedWallSegments(wallIdCounter),
              recalcAllWallSegmentsOnOtherLevels(
                wallIdCounter,
                project.activeLayer.data.id
              ),
              startedDrawingWalls)
            ) {
              let s = e.point.subtract(wallHelperPath.segments[0].point)
              ctrlKeyPressed && (s.angle = 15 * Math.round(s.angle / 15)),
                (snapPoint = wallHelperPath.segments[0].point.add(s)),
                snapPointOverride.id &&
                  ((snapPoint = new paper.Point(
                    snapPointOverride.x,
                    snapPointOverride.y
                  )),
                  (snapPointOverride = {}))
              try {
                let d = wallPath.add(snapPoint),
                  c = wallPath.segments[wallPath.segments.length - 2].point,
                  u = wallPath.segments[wallPath.segments.length - 1].point,
                  p = getAngleRadians(c, u),
                  m = new Path()
                ;(m.data.type = "wallRectangle"),
                  (m.data.id = wallPath.data.id),
                  (m.data.level = project.activeLayer.data.id),
                  (m.fillColor = new paper.Color(1, 0.9, 0, 0.25)),
                  (m.strokeColor = "#b19064"),
                  (m.strokeWidth = 1),
                  (m.strokeScaling = !1),
                  (m.segments = wallHelperRectangle.segments),
                  (m.closed = !0),
                  (wallsRectangles[wallPath.data.id] = m),
                  wallsGroup[project.activeLayer.data.id].addChild(
                    wallsRectangles[wallPath.data.id]
                  )
                let g = wallHelper3dCube.geometry.clone(),
                  y = new THREE.Mesh(g, wallMaterial)
                ;(y.position.x = wallHelper3dCube.position.x),
                  (y.position.y = wallHelper3dCube.position.y),
                  (y.position.z = wallHelper3dCube.position.z),
                  (y.userData.id = wallPath.data.id),
                  (y.userData.level = wallPath.data.level),
                  (y.frustumCulled = !1),
                  y.geometry.computeFlatVertexNormals(),
                  scene.add(y),
                  (wallsRectangles3d[wallPath.data.id] = y),
                  (d.data = { angleRadians: p, id: wallPath.data.id }),
                  (plan.walls[wallPath.data.id] = {
                    id: wallPath.data.id,
                    wallPath: wallPath,
                  }),
                  relinkWallReferences(project.activeLayer.data.id),
                  updatePlanHistory(
                    plan,
                    null,
                    null,
                    null,
                    wallPath.data.id,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null
                  ),
                  wallPath.segments.length > 2 &&
                    alert("problem to many segments"),
                  (wallPath = new paper.Path()),
                  (wallPath.strokeColor = new paper.Color(0, 0, 0, 0)),
                  wallPath.add(snapPoint),
                  (wallPath.data.join0 = { id: null, seg: null }),
                  (wallPath.data.join1 = { id: null, seg: null }),
                  updateObjectPropertiesWindow(),
                  wallIdCounter++,
                  (wallPath.data.id = wallIdCounter),
                  (wallPath.data.type = "wallPath"),
                  (wallPath.data.thickness = defaultWallThickness),
                  (wallPath.data.height = [
                    defaultWallHeight,
                    defaultWallHeight,
                  ]),
                  (wallPath.data.level = project.activeLayer.data.id),
                  (Walls[wallPath.data.id] = wallPath),
                  (selectedItem = wallPath)
              } catch (e) {
                console.log(e)
              }
            } else
              (startedDrawingWalls = !0),
                (wallPath = new paper.Path()),
                (wallPath.strokeColor = new paper.Color(0, 0, 0, 0)),
                snapPointOverride.id &&
                  ((snapPoint = new paper.Point(
                    snapPointOverride.x,
                    snapPointOverride.y
                  )),
                  (snapPointOverride = {})),
                wallPath.add(snapPoint),
                wallIdCounter++,
                (wallPath.data.id = wallIdCounter),
                (wallPath.data.join0 = { id: null, seg: null }),
                (wallPath.data.join1 = { id: null, seg: null }),
                (wallPath.data.type = "wallPath"),
                (wallPath.data.thickness = defaultWallThickness),
                (wallPath.data.height = [defaultWallHeight, defaultWallHeight]),
                (wallPath.data.level = project.activeLayer.data.id),
                (Walls[wallPath.data.id] = wallPath),
                (selectedItem = wallPath),
                updateObjectPropertiesWindow()
            ;(wallHelperPath.segments[0].point = snapPoint),
              (wallHelperPath.segments[1].point = snapPoint),
              wallHelperPath.bringToFront(),
              (wallHelperPath.visible = !0),
              (wallHelperRectangle.segments[0].point = new Point(0, 0)),
              (wallHelperRectangle.segments[1].point = new Point(0, 0)),
              (wallHelperRectangle.segments[2].point = new Point(0, 0)),
              (wallHelperRectangle.segments[3].point = new Point(0, 0)),
              (wallHelperRectangle.visible = !0),
              (wallHelper3dCube.geometry.vertices[1].x =
                wallHelperRectangle.segments[0].point.x),
              (wallHelper3dCube.geometry.vertices[1].z =
                wallHelperRectangle.segments[0].point.y),
              (wallHelper3dCube.geometry.vertices[3].x =
                wallHelperRectangle.segments[0].point.x),
              (wallHelper3dCube.geometry.vertices[3].z =
                wallHelperRectangle.segments[0].point.y),
              (wallHelper3dCube.geometry.vertices[0].x =
                wallHelperRectangle.segments[1].point.x),
              (wallHelper3dCube.geometry.vertices[0].z =
                wallHelperRectangle.segments[1].point.y),
              (wallHelper3dCube.geometry.vertices[2].x =
                wallHelperRectangle.segments[1].point.x),
              (wallHelper3dCube.geometry.vertices[2].z =
                wallHelperRectangle.segments[1].point.y),
              (wallHelper3dCube.geometry.vertices[5].x =
                wallHelperRectangle.segments[2].point.x),
              (wallHelper3dCube.geometry.vertices[5].z =
                wallHelperRectangle.segments[2].point.y),
              (wallHelper3dCube.geometry.vertices[7].x =
                wallHelperRectangle.segments[2].point.x),
              (wallHelper3dCube.geometry.vertices[7].z =
                wallHelperRectangle.segments[2].point.y),
              (wallHelper3dCube.geometry.vertices[4].x =
                wallHelperRectangle.segments[3].point.x),
              (wallHelper3dCube.geometry.vertices[4].z =
                wallHelperRectangle.segments[3].point.y),
              (wallHelper3dCube.geometry.vertices[6].x =
                wallHelperRectangle.segments[3].point.x),
              (wallHelper3dCube.geometry.vertices[6].z =
                wallHelperRectangle.segments[3].point.y),
              (wallHelper3dCube.geometry.verticesNeedUpdate = !0),
              (wallHelper3dCube.visible = !0),
              (tween = new TWEEN.Tween(controls.target)
                .to(wallHelper3dCube.position, 500)
                .onUpdate(render)
                .start()),
              snapPointOverride.id &&
                ((snapPointOverride = {}), setEndDrawingWalls())
          }
          lastNewWallSegmentClick = Date.now()
        }
      else if ("roof" === toolMode)
        if (2 === e.event.buttons) mouseMode = -1
        else {
          if (((mouseMode = 0), Date.now() - lastNewRoofSegmentClick > 250)) {
            if (
              ((snapPoint = e.point),
              (snapPoint.x = parseInt(e.point.x)),
              (snapPoint.y = parseInt(e.point.y)),
              ctrlKeyPressed &&
                ((snapPoint.x = snapPoint.x - (snapPoint.x % 10)),
                (snapPoint.y = snapPoint.y - (snapPoint.y % 10))),
              recalcAllUnjoinedRoofSegments(roofIdCounter),
              recalcAllRoofSegmentsOnOtherLevels(
                roofIdCounter,
                project.activeLayer.data.id
              ),
              startedDrawingRoofs)
            ) {
              let s = e.point.subtract(roofHelperPath.segments[0].point)
              ctrlKeyPressed && (s.angle = 15 * Math.round(s.angle / 15)),
                (snapPoint = roofHelperPath.segments[0].point.add(s)),
                snapPointOverride.id &&
                  ((snapPoint = new paper.Point(
                    snapPointOverride.x,
                    snapPointOverride.y
                  )),
                  (snapPointOverride = {}))
              try {
                let d = roofPath.add(snapPoint),
                  c = roofPath.segments[roofPath.segments.length - 2].point,
                  u = roofPath.segments[roofPath.segments.length - 1].point,
                  p = getAngleRadians(c, u),
                  f = new Path()
                ;(f.data.type = "roofRectangle"),
                  (f.data.id = roofPath.data.id),
                  (f.data.level = project.activeLayer.data.id),
                  (f.fillColor = new paper.Color(0.35, 0.65, 0.85, 0.25)),
                  (f.strokeColor = "#b19064"),
                  (f.strokeWidth = 1),
                  (f.strokeScaling = !1),
                  (f.segments = roofHelperRectangle.segments),
                  (f.closed = !0),
                  (roofsRectangles[roofPath.data.id] = f),
                  roofsGroup[project.activeLayer.data.id].addChild(
                    roofsRectangles[roofPath.data.id]
                  )
                let g = roofHelper3dCube.geometry.clone(),
                  h = new THREE.Mesh(g, roofMaterial)
                ;(h.position.x = roofHelper3dCube.position.x),
                  (h.position.y = roofHelper3dCube.position.y),
                  (h.position.z = roofHelper3dCube.position.z),
                  (h.userData.id = roofPath.data.id),
                  (h.userData.level = roofPath.data.level),
                  (h.frustumCulled = !1),
                  h.geometry.computeFlatVertexNormals(),
                  scene.add(h),
                  (roofsRectangles3d[roofPath.data.id] = h),
                  (d.data = { angleRadians: p, id: roofPath.data.id }),
                  (plan.roofs[roofPath.data.id] = {
                    id: roofPath.data.id,
                    roofPath: roofPath,
                  }),
                  relinkRoofReferences(project.activeLayer.data.id),
                  updatePlanHistory(
                    plan,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    roofPath.data.id,
                    null,
                    null
                  ),
                  roofPath.segments.length > 2 &&
                    alert("problem to many segments"),
                  (roofPath = new paper.Path()),
                  (roofPath.strokeColor = new paper.Color(0, 0, 0, 0)),
                  roofPath.add(snapPoint),
                  (roofPath.data.join0 = { id: null, seg: null }),
                  (roofPath.data.join1 = { id: null, seg: null }),
                  updateObjectPropertiesWindow(),
                  roofIdCounter++,
                  (roofPath.data.id = roofIdCounter),
                  (roofPath.data.type = "roofPath"),
                  (roofPath.data.width = defaultRoofWidth),
                  (roofPath.data.rise = defaultRoofRise),
                  (roofPath.data.startHeight = defaultRoofStartHeight),
                  (roofPath.data.thickness = defaultRoofThickness),
                  (roofPath.data.level = project.activeLayer.data.id),
                  (Roofs[roofPath.data.id] = roofPath),
                  (selectedItem = roofPath)
              } catch (e) {
                console.log(e)
              }
            } else
              (startedDrawingRoofs = !0),
                (roofPath = new paper.Path()),
                (roofPath.strokeColor = new paper.Color(0, 0, 0, 0)),
                snapPointOverride.id &&
                  ((snapPoint = new paper.Point(
                    snapPointOverride.x,
                    snapPointOverride.y
                  )),
                  (snapPointOverride = {})),
                roofPath.add(snapPoint),
                roofIdCounter++,
                (roofPath.data.id = roofIdCounter),
                (roofPath.data.join0 = { id: null, seg: null }),
                (roofPath.data.join1 = { id: null, seg: null }),
                (roofPath.data.type = "roofPath"),
                (roofPath.data.width = defaultRoofWidth),
                (roofPath.data.rise = defaultRoofRise),
                (roofPath.data.startHeight = defaultRoofStartHeight),
                (roofPath.data.thickness = defaultRoofThickness),
                (roofPath.data.level = project.activeLayer.data.id),
                (Roofs[roofPath.data.id] = roofPath),
                (selectedItem = roofPath),
                updateObjectPropertiesWindow()
            ;(roofHelperPath.segments[0].point = snapPoint),
              (roofHelperPath.segments[1].point = snapPoint),
              roofHelperPath.bringToFront(),
              (roofHelperPath.visible = !0),
              (roofHelperRectangle.segments[0].point = new Point(0, 0)),
              (roofHelperRectangle.segments[1].point = new Point(0, 0)),
              (roofHelperRectangle.segments[2].point = new Point(0, 0)),
              (roofHelperRectangle.segments[3].point = new Point(0, 0)),
              (roofHelperRectangle.visible = !0),
              (roofHelper3dCube.geometry.vertices[1].x =
                roofHelperRectangle.segments[0].point.x),
              (roofHelper3dCube.geometry.vertices[1].z =
                roofHelperRectangle.segments[0].point.y),
              (roofHelper3dCube.geometry.vertices[3].x =
                roofHelperRectangle.segments[0].point.x),
              (roofHelper3dCube.geometry.vertices[3].z =
                roofHelperRectangle.segments[0].point.y),
              (roofHelper3dCube.geometry.vertices[0].x =
                roofHelperRectangle.segments[1].point.x),
              (roofHelper3dCube.geometry.vertices[0].z =
                roofHelperRectangle.segments[1].point.y),
              (roofHelper3dCube.geometry.vertices[2].x =
                roofHelperRectangle.segments[1].point.x),
              (roofHelper3dCube.geometry.vertices[2].z =
                roofHelperRectangle.segments[1].point.y),
              (roofHelper3dCube.geometry.vertices[5].x =
                roofHelperRectangle.segments[2].point.x),
              (roofHelper3dCube.geometry.vertices[5].z =
                roofHelperRectangle.segments[2].point.y),
              (roofHelper3dCube.geometry.vertices[7].x =
                roofHelperRectangle.segments[2].point.x),
              (roofHelper3dCube.geometry.vertices[7].z =
                roofHelperRectangle.segments[2].point.y),
              (roofHelper3dCube.geometry.vertices[4].x =
                roofHelperRectangle.segments[3].point.x),
              (roofHelper3dCube.geometry.vertices[4].z =
                roofHelperRectangle.segments[3].point.y),
              (roofHelper3dCube.geometry.vertices[6].x =
                roofHelperRectangle.segments[3].point.x),
              (roofHelper3dCube.geometry.vertices[6].z =
                roofHelperRectangle.segments[3].point.y)
            let v = defaultRoofThickness / 2,
              w = defaultRoofRise / 2
            ;(roofHelper3dCube.geometry.vertices[0].y = v - w),
              (roofHelper3dCube.geometry.vertices[1].y = v - w),
              (roofHelper3dCube.geometry.vertices[4].y = v + w),
              (roofHelper3dCube.geometry.vertices[5].y = v + w),
              (roofHelper3dCube.geometry.vertices[2].y = -v - w),
              (roofHelper3dCube.geometry.vertices[3].y = -v - w),
              (roofHelper3dCube.geometry.vertices[6].y = -v + w),
              (roofHelper3dCube.geometry.vertices[7].y = -v + w),
              (roofHelper3dCube.geometry.verticesNeedUpdate = !0),
              (roofHelper3dCube.visible = !0),
              (tween = new TWEEN.Tween(controls.target)
                .to(roofHelper3dCube.position, 500)
                .onUpdate(render)
                .start()),
              snapPointOverride.id &&
                ((snapPointOverride = {}), setEndDrawingRoofs())
          }
          lastNewRoofSegmentClick = Date.now()
        }
      else if ("background" === toolMode) {
        let t = project.hitTest(e.point)
        t && t.item.data
          ? "background" === t.item.data.type
            ? ((mouseMode = 0),
              (offsetMousePoint = selectedItem.position.subtract(e.point)),
              (offsetMousePoint.x = parseInt(offsetMousePoint.x)),
              (offsetMousePoint.y = parseInt(offsetMousePoint.y)))
            : "stretchFurnitureXZTool" === t.item.data.type
            ? (mouseMode = 2)
            : "verticalGuide" === t.item.data.type
            ? (console.log(t.item.data.type),
              (selectedGuideId = t.item.data.id),
              (mouseMode = 9))
            : "horizontalGuide" === t.item.data.type &&
              (console.log(t.item.data.type),
              (selectedGuideId = t.item.data.id),
              (mouseMode = 10))
          : (mouseMode = -1)
      } else if ("floor" === toolMode)
        2 === e.event.buttons
          ? (mouseMode = -1)
          : ((mouseMode = 0),
            Date.now() - lastNewFloorSegmentClick > 250 &&
              (startedDrawingFloor
                ? (floorPath.add(snapPoint),
                  (floorHelperPath.segments[0].point = snapPoint),
                  (floorHelperPath.segments[1].point = snapPoint),
                  redrawFloor(floorPath),
                  (plan.floors[floorPath.data.id] = {
                    id: floorPath.data.id,
                    floorPath: floorPath,
                  }),
                  2 === floorPath.segments.length
                    ? updatePlanHistory(
                        plan,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        floorPath.data.id,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                      )
                    : updatePlanHistory(
                        plan,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        floorPath.data.id,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                      ),
                  render())
                : ((startedDrawingFloor = !0),
                  (floorPath = new Path()),
                  (floorPath.data.type = "floor"),
                  (floorPath.strokeColor = "#b19064"),
                  (floorPath.strokeWidth = 2),
                  (floorPath.strokeScaling = !1),
                  (floorPath.fillColor = new paper.Color(0.5, 0.5, 0.5, 0.5)),
                  floorPath.add(snapPoint),
                  floorIdCounter++,
                  (floorPath.data.id = floorIdCounter),
                  (floorPath.data.thickness = defaultFloorThickness),
                  (floorPath.data.level = project.activeLayer.data.id),
                  (Floors[floorIdCounter] = floorPath),
                  floorsGroup[project.activeLayer.data.id].addChild(
                    Floors[floorIdCounter]
                  ),
                  (floorHelperPath.segments[0].point = snapPoint),
                  (floorHelperPath.segments[1].point = snapPoint),
                  (floorHelperPath.visible = !0))),
            (lastNewFloorSegmentClick = Date.now()))
      else if ("dimension" === toolMode)
        if (2 === e.event.buttons) mouseMode = -1
        else if (((mouseMode = 0), startedDrawingDimension))
          if (1 === dimensionPath.segments.length) dimensionPath.add(snapPoint)
          else {
            s = dimensionHelperPath.segments[1].point.subtract(
                dimensionHelperPath.segments[0].point
              ),
              I = dimensionHelperPath.segments[1].point.subtract(snapPoint),
              P = (I.angle - s.angle + 360) % 360,
              b = (P / 180) * Math.PI,
              x = I.length * Math.sin(b)
            ;(dimensionPath.data.adjacent = x), (dimensionPath.visible = !1)
            let s = dimensionPath.segments[1].point.subtract(
                dimensionPath.segments[0].point
              ),
              R = new paper.Path()
            ;(R.data.id = dimensionPath.data.id),
              (R.data.level = project.activeLayer.data.id),
              (R.data.type = "dimension"),
              (R.style = {
                strokeColor: "white",
                strokeWidth: 1,
                strokeScaling: !1,
              }),
              R.moveTo(dimensionPath.segments[0].point),
              R.lineBy(s.normalize(x).rotate(-90)),
              R.lineBy(s.normalize(7.5).rotate(-270)),
              R.lineBy(s.normalize(10).rotate(-225)),
              R.lineBy(s.normalize(20).rotate(-45)),
              R.lineBy(s.normalize(10).rotate(-225)),
              R.lineBy(s.normalize(s.length / 2))
            let M = R.lastSegment.point
            R.lineBy(s.normalize(s.length / 2)),
              R.lineBy(s.normalize(10).rotate(-225)),
              R.lineBy(s.normalize(20).rotate(-45)),
              R.lineBy(s.normalize(10).rotate(-225)),
              R.lineBy(s.normalize(7.5).rotate(-90)),
              R.lineBy(s.normalize(x).rotate(90))
            let k = new paper.PointText({})
            Math.abs(s.angle) > 90
              ? ((k.fontFamily = "Courier New"),
                (k.fillColor = "white"),
                (k.point = M.add(s.normalize(-8).rotate(-90))),
                (k.justification = "center"),
                (k.fontSize = screenScale / 1.5),
                k.rotate(180 + s.angle),
                (k.data.id = dimensionPath.data.id),
                (k.data.level = project.activeLayer.data.id),
                (k.data.type = "dimension"))
              : ((k.fontFamily = "Courier New"),
                (k.fillColor = "white"),
                (k.point = M.add(s.normalize(8).rotate(-90))),
                (k.justification = "center"),
                (k.fontSize = screenScale / 1.5),
                k.rotate(s.angle),
                (k.data.id = dimensionPath.data.id),
                (k.data.level = project.activeLayer.data.id),
                (k.data.type = "dimension"))
            let E = s.length
            ;(k.content = Math.floor(1e3 * E) / 1e3),
              (Dimensions[dimensionPath.data.id] = {
                id: dimensionPath.data.id,
                dimensionPath: dimensionPath,
                line: R,
                text: k,
              }),
              (plan.dimensions[dimensionPath.data.id] = {
                id: dimensionPath.data.id,
                dimensionPath: dimensionPath,
              }),
              updatePlanHistory(
                plan,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                dimensionPath.data.id,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
              ),
              setEndDrawingDimension()
          }
        else
          (startedDrawingDimension = !0),
            (dimensionPath = new Path()),
            (dimensionPath.data.type = "dimension"),
            (dimensionPath.strokeColor = "white"),
            dimensionPath.add(snapPoint),
            dimensionIdCounter++,
            (dimensionPath.data.id = dimensionIdCounter),
            (dimensionPath.data.adjacent = 0),
            (dimensionPath.data.level = project.activeLayer.data.id),
            (dimensionPath.visible = !1),
            dimensionsGroup[dimensionPath.data.level].addChild(dimensionPath),
            (dimensionHelperPath.segments[0].point = snapPoint),
            (dimensionHelperPath.segments[1].point = snapPoint),
            (dimensionHelperPath.visible = !0)
      else if ("text" === toolMode)
        if (2 === e.event.buttons) mouseMode = -1
        else if (((mouseMode = 0), !startedDrawingText)) {
          deselectAll(), (startedDrawingText = !0)
          let k = new paper.PointText({})
          ;(k.fontFamily = "Courier New"),
            (k.fillColor = "white"),
            (k.point = e.point),
            (k.justification = "center"),
            (k.fontSize = screenScale / 1.5),
            textIdCounter++,
            (k.data.id = textIdCounter),
            (editingTextId = k.data.id),
            (k.data.type = "text"),
            (k.data.value = ""),
            (k.data.x = k.point.x),
            (k.data.y = k.point.y),
            (k.data.level = project.activeLayer.data.id),
            textsGroup[project.activeLayer.data.id].addChild(k),
            (k.content = k.data.value),
            (Texts[k.data.id] = k),
            (plan.texts[k.data.id] = { id: k.data.id, data: k.data }),
            updatePlanHistory(
              plan,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              k.data.id,
              null,
              null,
              null,
              null,
              null
            ),
            (selectedItem = Texts[k.data.id]),
            (Texts[k.data.id].selected = !0),
            updateObjectPropertiesWindow(),
            (document.getElementById("textValueProp").style.backgroundColor =
              "#4e4e4e"),
            document.getElementById("textValueProp").select(),
            (startedDrawingText = !1)
        }
    }),
    (tools.onMouseUp = function (e) {
      0 === mouseMode && dragging
        ? selectedItem &&
          selectedItem.data &&
          "furniture" === selectedItem.data.type
          ? ((dragging = !1),
            (mouseMode = -1),
            updatePlanHistory(
              plan,
              null,
              selectedItem.data.id,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null
            ),
            applyMasksToWalls(project.activeLayer.data.id),
            applyMasksToRoofs(project.activeLayer.data.id),
            redrawLevelsFloors(project.activeLayer.data.id))
          : console.log("*** mouseup, mousemode=0, " + selectedItem)
        : 1 === mouseMode && rotating
        ? ((rotating = !1),
          (mouseMode = -1),
          (selectedItem.data.angle = selectedItem.rotation),
          updatePlanHistory(
            plan,
            null,
            selectedItem.data.id,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
          ),
          applyMasksToWalls(project.activeLayer.data.id),
          applyMasksToRoofs(project.activeLayer.data.id),
          redrawLevelsFloors(project.activeLayer.data.id))
        : 2 === mouseMode && scalingXY
        ? ((scalingXY = !1),
          (mouseMode = -1),
          updatePlanHistory(
            plan,
            null,
            selectedItem.data.id,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
          ),
          applyMasksToWalls(project.activeLayer.data.id),
          applyMasksToRoofs(project.activeLayer.data.id),
          redrawLevelsFloors(project.activeLayer.data.id))
        : 3 === mouseMode
        ? (snapPointOverride.id &&
            ((selectedItem.segments[movePointIconSelectedId].point.x =
              snapPointOverride.x),
            (selectedItem.segments[movePointIconSelectedId].point.y =
              snapPointOverride.y),
            (snapPointOverride = {})),
          relinkWallReferences(project.activeLayer.data.id),
          updatePlanHistory(
            plan,
            null,
            null,
            null,
            null,
            selectedItem.data.id,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
          ))
        : 11 === mouseMode
        ? (snapPointOverride.id &&
            ((selectedItem.segments[movePointIconSelectedId].point.x =
              snapPointOverride.x),
            (selectedItem.segments[movePointIconSelectedId].point.y =
              snapPointOverride.y),
            (snapPointOverride = {})),
          relinkRoofReferences(project.activeLayer.data.id),
          updatePlanHistory(
            plan,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            selectedItem.data.id,
            null
          ))
        : 4 === mouseMode && scalingY
        ? ((scalingY = !1),
          (mouseMode = -1),
          (stretchYPath.visible = !1),
          (clickableObjects[selectedItem.data.id].userData.height +=
            stretchYPath.length),
          updatePlanHistory(
            plan,
            null,
            selectedItem.data.id,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
          ),
          applyMasksToWalls(project.activeLayer.data.id),
          applyMasksToRoofs(project.activeLayer.data.id),
          redrawLevelsFloors(project.activeLayer.data.id))
        : 5 === mouseMode && elevating
        ? ((elevating = !1),
          (mouseMode = -1),
          (elevatePath.visible = !1),
          updatePlanHistory(
            plan,
            null,
            selectedItem.data.id,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
          ),
          applyMasksToWalls(project.activeLayer.data.id),
          applyMasksToRoofs(project.activeLayer.data.id),
          redrawLevelsFloors(project.activeLayer.data.id))
        : 6 === mouseMode
        ? updatePlanHistory(
            plan,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            selectedItem.data.id,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
          )
        : 7 === mouseMode
        ? updatePlanHistory(
            plan,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            selectedItem.data.id,
            null,
            null,
            null,
            null
          )
        : 9 === mouseMode
        ? ((selectedGuideId = -1), (mouseMode = -1))
        : 10 === mouseMode && ((selectedGuideId = -1), (mouseMode = -1))
    }),
    (tools.onMouseDrag = function (e) {
      let t = e.downPoint.subtract(e.point)
      if (mouseMode === -1)
        (paper.view.center = paper.view.center.add(t)), redrawGrid()
      else if (9 === mouseMode)
        verticalGuides[selectedGuideId].position.x =
          parseInt(e.point.x / snapTolerance) * snapTolerance
      else if (10 === mouseMode)
        horizontalGuides[selectedGuideId].position.y =
          parseInt(e.point.y / snapTolerance) * snapTolerance
      else if ("pointer" === toolMode)
        if (0 === mouseMode) {
          if (
            ((dragging = !0),
            (snapPoint = e.point),
            (snapPoint.x = parseInt(e.point.x)),
            (snapPoint.y = parseInt(e.point.y)),
            ctrlKeyPressed &&
              ((snapPoint.x = snapPoint.x - (snapPoint.x % 10)),
              (snapPoint.y = snapPoint.y - (snapPoint.y % 10))),
            selectedItem)
          ) {
            let o = null
            if (selectedItem.useMask) {
              let a = 25,
                n = 0,
                l = -1
              if (
                (Object.keys(Walls).forEach(function (e) {
                  let t = Walls[e]
                  if (
                    "object" == typeof t &&
                    t.data.level === project.activeLayer.data.id
                  ) {
                    let i = t.getNearestPoint(snapPoint),
                      r = snapPoint.getDistance(i)
                    if (r <= a) {
                      ;(a = r), (o = i)
                      let s = t.segments[0].point.subtract(t.segments[1].point)
                      ;(n = s.angle), (l = e)
                    }
                  }
                }),
                o)
              ) {
                new Path.Circle({
                  center: o,
                  radius: screenScale / 2,
                  fillColor: new paper.Color(0.3, 1, 0.5, 0.75),
                  strokeWidth: 1,
                })
                  .removeOnMove()
                  .removeOnDrag(),
                  (snapPoint = o),
                  (selectedItem.data.angle = n),
                  selectedItem.data.toolsRectangleInner &&
                    selectedItem.data.toolsRectangleInner.remove(),
                  (selectedItem.rotation = 0)
                let i = new paper.Path.Rectangle(selectedItem.bounds)
                ;(selectedItem.rotation = selectedItem.data.angle),
                  (i.data.type = "toolsRectangle"),
                  (i.strokeColor = "#b19064"),
                  (i.strokeWidth = 1),
                  (i.strokeScaling = !1),
                  (i.locked = !0),
                  (selectedItem.data.toolsRectangleInner = i),
                  i.rotate(selectedItem.data.angle),
                  (furnitureAngleProp.innerText = (
                    (selectedItem.rotation + 360) %
                    360
                  ).toFixed(2)),
                  (plan.furniture[selectedItem.data.id].angle =
                    selectedItem.rotation),
                  (rotateIcon.position =
                    selectedItem.data.toolsRectangleInner.segments[1].point),
                  (resizeIcon.position =
                    selectedItem.data.toolsRectangleInner.segments[3].point),
                  (heightIcon.position =
                    selectedItem.data.toolsRectangleInner.segments[2].point),
                  (elevateIcon.position =
                    selectedItem.data.toolsRectangleInner.segments[0].point),
                  (clickableObjects[selectedItem.data.id].rotation.y =
                    (((selectedItem.rotation + 180) % 360) / 180) * Math.PI),
                  (clickableObjects[selectedItem.data.id].rotation.x = Math.PI),
                  (clickableObjects[selectedItem.data.id].rotation.z = Math.PI),
                  maskObjects[selectedItem.data.id] &&
                    ((maskObjects[selectedItem.data.id].rotation.y =
                      (((selectedItem.rotation + 180) % 360) / 180) * Math.PI),
                    (maskObjects[selectedItem.data.id].rotation.x = Math.PI),
                    (maskObjects[selectedItem.data.id].rotation.z = Math.PI)),
                  (selectedItem.position = snapPoint),
                  (toolsGroup.position = snapPoint),
                  applyMasksToWall(
                    l,
                    wallsRectangles3d[l],
                    project.activeLayer.data.id
                  )
              } else snapPoint = snapPoint.add(offsetMousePoint)
            } else snapPoint = snapPoint.add(offsetMousePoint)
            if (null === o) {
              let r
              Object.keys(verticalGuides).forEach(function (e) {
                snapPoint.x >= verticalGuides[e].position.x - 10 &&
                  snapPoint.x <= verticalGuides[e].position.x + 10 &&
                  (r = new paper.Point(
                    verticalGuides[e].position.x,
                    snapPoint.y
                  ))
              }),
                Object.keys(horizontalGuides).forEach(function (e) {
                  snapPoint.y >= horizontalGuides[e].position.y - 10 &&
                    snapPoint.y <= horizontalGuides[e].position.y + 10 &&
                    (r
                      ? (r.y = horizontalGuides[e].position.y)
                      : (r = new paper.Point(
                          snapPoint.x,
                          horizontalGuides[e].position.y
                        )))
                }),
                r &&
                  ((snapPoint = r),
                  new Path.Circle({
                    center: snapPoint,
                    radius: screenScale / 2,
                    fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
                    strokeWidth: 1,
                  })
                    .removeOnMove()
                    .removeOnDrag())
            }
            if (furnitureItems[selectedItem.data.fid].pivot) {
              let s = furnitureItems[selectedItem.data.fid].pivot
              if (1 === selectedItem.data.flipZ) {
                let d = snapPoint.add(new paper.Point(s).rotate(n)),
                  c = snapPoint,
                  u = c.subtract(d)
                snapPoint = snapPoint.add(u)
              } else {
                let d = snapPoint.add(new paper.Point(s.x, -s.y).rotate(n)),
                  c = snapPoint,
                  u = c.subtract(d)
                snapPoint = snapPoint.add(u)
              }
            }
            ;(selectedItem.position = snapPoint),
              (toolsGroup.position = snapPoint),
              (selectedItem.data.toolsRectangleInner.position =
                selectedItem.position)
            let p = snapPoint.x,
              m = snapPoint.y
            selectedItem.data.id &&
              ((clickableObjects[selectedItem.data.id].position.x = p),
              (clickableObjects[selectedItem.data.id].position.z = m),
              maskObjects[selectedItem.data.id] &&
                ((maskObjects[selectedItem.data.id].position.x = p),
                (maskObjects[selectedItem.data.id].position.z = m)),
              (controls.target.x = p),
              (controls.target.z = m),
              setTimeout(function () {
                render()
              }, 1)),
              (furnitureXProp.value = p.toFixed(3)),
              (furnitureZProp.value = m.toFixed(3))
          }
        } else if (1 === mouseMode) {
          let g = selectedItem.bounds.center,
            y = g.subtract(e.lastPoint),
            f = g.subtract(e.point),
            n = (f.angle - y.angle + 360) % 360
          if (((selectedItem.data.angle += n), ctrlKeyPressed)) {
            let h = 15 * Math.round(selectedItem.data.angle / 15)
            selectedItem.data.toolsRectangleInner &&
              selectedItem.data.toolsRectangleInner.remove(),
              (selectedItem.rotation = 0)
            let i = new paper.Path.Rectangle(selectedItem.bounds)
            ;(selectedItem.rotation = h),
              (i.data.type = "toolsRectangle"),
              (i.strokeColor = "#b19064"),
              (i.strokeWidth = 1),
              (i.strokeScaling = !1),
              (i.locked = !0),
              (selectedItem.data.toolsRectangleInner = i),
              i.rotate(h)
          } else {
            selectedItem.data.toolsRectangleInner &&
              selectedItem.data.toolsRectangleInner.remove(),
              (selectedItem.rotation = 0)
            let i = new paper.Path.Rectangle(selectedItem.bounds)
            ;(selectedItem.rotation = selectedItem.data.angle),
              (i.data.type = "toolsRectangle"),
              (i.strokeColor = "#b19064"),
              (i.strokeWidth = 1),
              (i.strokeScaling = !1),
              (i.locked = !0),
              (selectedItem.data.toolsRectangleInner = i),
              i.rotate(selectedItem.data.angle)
          }
          ;(furnitureAngleProp.innerText = (
            (selectedItem.rotation + 360) %
            360
          ).toFixed(2)),
            (plan.furniture[selectedItem.data.id].angle =
              selectedItem.rotation),
            (rotateIcon.position =
              selectedItem.data.toolsRectangleInner.segments[1].point),
            (resizeIcon.position =
              selectedItem.data.toolsRectangleInner.segments[3].point),
            (heightIcon.position =
              selectedItem.data.toolsRectangleInner.segments[2].point),
            (elevateIcon.position =
              selectedItem.data.toolsRectangleInner.segments[0].point),
            selectedItem.data.id &&
              ((rotating = !0),
              (clickableObjects[selectedItem.data.id].rotation.y =
                (((selectedItem.rotation + 180) % 360) / 180) * Math.PI),
              (clickableObjects[selectedItem.data.id].rotation.x = Math.PI),
              (clickableObjects[selectedItem.data.id].rotation.z = Math.PI),
              maskObjects[selectedItem.data.id] &&
                ((maskObjects[selectedItem.data.id].rotation.y =
                  (((selectedItem.rotation + 180) % 360) / 180) * Math.PI),
                (maskObjects[selectedItem.data.id].rotation.x = Math.PI),
                (maskObjects[selectedItem.data.id].rotation.z = Math.PI)),
              render())
        } else if (2 === mouseMode) {
          if (selectedItem.data.id) {
            scalingXY = !0
            try {
              let v = (selectedItem.data.angle / 90) * Math.PI,
                w = e.point,
                I = selectedItem.position.subtract(
                  e.point.subtract(selectedItem.position)
                ),
                P = w.subtract(I),
                b = P.angleInRadians - v,
                x = P.length * Math.cos(b),
                R = P.length * Math.sin(b),
                M = new paper.Point(
                  selectedItem.position.x + x / 2,
                  selectedItem.position.y - R / 2
                ),
                k = new paper.Point(
                  selectedItem.position.x - x / 2,
                  selectedItem.position.y + R / 2
                )
              ;(selectedItem.data.toolsRectangleInner.segments[3].point = w),
                (selectedItem.data.toolsRectangleInner.segments[1].point = I),
                (selectedItem.data.toolsRectangleInner.segments[2].point = M),
                (selectedItem.data.toolsRectangleInner.segments[0].point = k)
              let E = k.subtract(w),
                j = M.subtract(w),
                T = E.length,
                H = j.length
              if (Math.abs(T) >= 1e-5 && Math.abs(H) >= 1e-5) {
                ;(clickableObjects[selectedItem.data.id].scale.x =
                  T /
                  (clickableObjects[selectedItem.data.id].userData.width *
                    selectedItem.data.flipX)),
                  (clickableObjects[selectedItem.data.id].scale.z =
                    H /
                    (clickableObjects[selectedItem.data.id].userData.depth *
                      selectedItem.data.flipZ)),
                  maskObjects[selectedItem.data.id] &&
                    ((maskObjects[selectedItem.data.id].scale.x = Math.abs(
                      clickableObjects[selectedItem.data.id].scale.x
                    )),
                    (maskObjects[selectedItem.data.id].scale.z = Math.abs(
                      clickableObjects[selectedItem.data.id].scale.z
                    )))
                let C = selectedItem.position,
                  B = selectedItem.rotation
                ;(selectedItem.rotation = 0),
                  (selectedItem.bounds.width = Math.abs(T)),
                  (selectedItem.bounds.height = Math.abs(H)),
                  (plan.furniture[selectedItem.data.id].width = T),
                  (plan.furniture[selectedItem.data.id].depth = H),
                  (selectedItem.rotation = B),
                  (selectedItem.position = C),
                  render(),
                  (furnitureWidthProp.value = (
                    clickableObjects[selectedItem.data.id].userData.width *
                    clickableObjects[selectedItem.data.id].scale.x
                  ).toFixed(3)),
                  (furnitureDepthProp.value = (
                    clickableObjects[selectedItem.data.id].userData.depth *
                    clickableObjects[selectedItem.data.id].scale.z
                  ).toFixed(3))
              }
              ;(rotateIcon.position =
                selectedItem.data.toolsRectangleInner.segments[1].point),
                (resizeIcon.position =
                  selectedItem.data.toolsRectangleInner.segments[3].point),
                (heightIcon.position =
                  selectedItem.data.toolsRectangleInner.segments[2].point),
                (elevateIcon.position =
                  selectedItem.data.toolsRectangleInner.segments[0].point)
            } catch (e) {
              console.log(e)
            }
          }
        } else if (3 === mouseMode) {
          ;(snapPoint = e.point),
            (snapPoint.x = parseInt(e.point.x)),
            (snapPoint.y = parseInt(e.point.y)),
            ctrlKeyPressed &&
              ((snapPoint.x = snapPoint.x - (snapPoint.x % 10)),
              (snapPoint.y = snapPoint.y - (snapPoint.y % 10))),
            (snapPointOverride = {})
          e: for (let L = 0; L < unjoinedWallSegments.length; L++)
            if (
              e.point.x >= unjoinedWallSegments[L].x - 10 &&
              e.point.x <= unjoinedWallSegments[L].x + 10 &&
              e.point.y >= unjoinedWallSegments[L].y - 10 &&
              e.point.y <= unjoinedWallSegments[L].y + 10
            ) {
              ;(snapPoint = new paper.Point(
                unjoinedWallSegments[L].x,
                unjoinedWallSegments[L].y
              )),
                new Path.Circle({
                  center: snapPoint,
                  radius: screenScale / 2,
                  fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
                  strokeWidth: 1,
                })
                  .removeOnMove()
                  .removeOnDrag(),
                (snapPointOverride = {
                  id: unjoinedWallSegments[L].id,
                  x: unjoinedWallSegments[L].x,
                  y: unjoinedWallSegments[L].y,
                })
              break e
            }
          if (!snapPointOverride.id)
            e: for (let L = 0; L < allWallSegments.length; L++)
              if (
                e.point.x >= allWallSegments[L].x - 10 &&
                e.point.x <= allWallSegments[L].x + 10 &&
                e.point.y >= allWallSegments[L].y - 10 &&
                e.point.y <= allWallSegments[L].y + 10
              ) {
                ;(snapPoint = new paper.Point(
                  allWallSegments[L].x,
                  allWallSegments[L].y
                )),
                  new Path.Circle({
                    center: snapPoint,
                    radius: screenScale / 2,
                    fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
                    strokeWidth: 1,
                  }).removeOnMove(),
                  (snapPointOverride = {
                    id: allWallSegments[L].id,
                    x: allWallSegments[L].x,
                    y: allWallSegments[L].y,
                  })
                break e
              }
          let r = null,
            t = selectedItem.data.thickness / 2,
            z = selectedItem.data.thickness / 4
          snapPointOverride.id ||
            (Object.keys(verticalGuides).forEach(function (o) {
              e.point.x >= verticalGuides[o].position.x - z &&
                e.point.x <= verticalGuides[o].position.x + z &&
                (r = new paper.Point(verticalGuides[o].position.x, e.point.y)),
                null === r &&
                  e.point.x >= verticalGuides[o].position.x - t - z &&
                  e.point.x <= verticalGuides[o].position.x - t + z &&
                  (r = new paper.Point(
                    verticalGuides[o].position.x - t,
                    e.point.y
                  )),
                null === r &&
                  e.point.x >= verticalGuides[o].position.x + t - z &&
                  e.point.x <= verticalGuides[o].position.x + t + z &&
                  (r = new paper.Point(
                    verticalGuides[o].position.x + t,
                    e.point.y
                  ))
            }),
            Object.keys(horizontalGuides).forEach(function (o) {
              let a = null
              e.point.y >= horizontalGuides[o].position.y - z &&
                e.point.y <= horizontalGuides[o].position.y + z &&
                (a = horizontalGuides[o].position.y),
                null === a &&
                  e.point.y >= horizontalGuides[o].position.y - t - z &&
                  e.point.y <= horizontalGuides[o].position.y - t + z &&
                  (a = horizontalGuides[o].position.y - t),
                null === a &&
                  e.point.y >= horizontalGuides[o].position.y + t - z &&
                  e.point.y <= horizontalGuides[o].position.y + t + z &&
                  (a = horizontalGuides[o].position.y + t),
                a && (r ? (r.y = a) : (r = new paper.Point(e.point.x, a)))
            }),
            r &&
              ((snapPoint = r),
              new Path.Circle({
                center: snapPoint,
                radius: screenScale / 2,
                fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
                strokeWidth: 1,
              })
                .removeOnMove()
                .removeOnDrag())),
            (selectedMovePointIcon.position = snapPoint),
            (selectedItem.segments[movePointIconSelectedId].point = snapPoint),
            relinkWallReferences(project.activeLayer.data.id)
        } else if (11 === mouseMode) {
          ;(snapPoint = e.point),
            (snapPoint.x = parseInt(e.point.x)),
            (snapPoint.y = parseInt(e.point.y)),
            ctrlKeyPressed &&
              ((snapPoint.x = snapPoint.x - (snapPoint.x % 10)),
              (snapPoint.y = snapPoint.y - (snapPoint.y % 10))),
            (snapPointOverride = {})
          let r = null,
            t = selectedItem.data.width / 2,
            z = selectedItem.data.width / 10
          Object.keys(verticalGuides).forEach(function (o) {
            e.point.x >= verticalGuides[o].position.x - z &&
              e.point.x <= verticalGuides[o].position.x + z &&
              (r = new paper.Point(verticalGuides[o].position.x, e.point.y)),
              null === r &&
                e.point.x >= verticalGuides[o].position.x - t - z &&
                e.point.x <= verticalGuides[o].position.x - t + z &&
                (r = new paper.Point(
                  verticalGuides[o].position.x - t,
                  e.point.y
                )),
              null === r &&
                e.point.x >= verticalGuides[o].position.x + t - z &&
                e.point.x <= verticalGuides[o].position.x + t + z &&
                (r = new paper.Point(
                  verticalGuides[o].position.x + t,
                  e.point.y
                ))
          }),
            Object.keys(horizontalGuides).forEach(function (o) {
              let a = null
              e.point.y >= horizontalGuides[o].position.y - z &&
                e.point.y <= horizontalGuides[o].position.y + z &&
                (a = horizontalGuides[o].position.y),
                null === a &&
                  e.point.y >= horizontalGuides[o].position.y - t - z &&
                  e.point.y <= horizontalGuides[o].position.y - t + z &&
                  (a = horizontalGuides[o].position.y - t),
                null === a &&
                  e.point.y >= horizontalGuides[o].position.y + t - z &&
                  e.point.y <= horizontalGuides[o].position.y + t + z &&
                  (a = horizontalGuides[o].position.y + t),
                a && (r ? (r.y = a) : (r = new paper.Point(e.point.x, a)))
            }),
            r &&
              ((snapPoint = r),
              new Path.Circle({
                center: snapPoint,
                radius: screenScale / 2,
                fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
                strokeWidth: 1,
              })
                .removeOnMove()
                .removeOnDrag()),
            (selectedMovePointIcon.position = snapPoint),
            (selectedItem.segments[movePointIconSelectedId].point = snapPoint),
            relinkRoofReferences(project.activeLayer.data.id)
        } else if (4 === mouseMode) {
          if (selectedItem.data.id)
            try {
              ;(snapPoint = e.point),
                (snapPoint.x = stretchYPath.segments[0].point.x),
                (stretchYPath.segments[1].point = snapPoint)
              let u = stretchYPath.segments[1].point.subtract(
                  stretchYPath.segments[0].point
                ),
                O = stretchYPath.length
              u.angle > 0 && (O *= -1),
                (clickableObjects[selectedItem.data.id].scale.y =
                  (stretchYStartHeight + O) /
                  clickableObjects[selectedItem.data.id].userData.height),
                maskObjects[selectedItem.data.id] &&
                  (maskObjects[selectedItem.data.id].scale.y = Math.abs(
                    clickableObjects[selectedItem.data.id].scale.y
                  )),
                drawHeight(
                  stretchYPath.segments[0].point,
                  stretchYPath.segments[1].point,
                  stretchYStartHeight
                ),
                render(),
                (furnitureHeightProp.value = (
                  clickableObjects[selectedItem.data.id].userData.height *
                  clickableObjects[selectedItem.data.id].scale.y
                ).toFixed(3))
            } catch (e) {
              console.log(e)
            }
        } else if (5 === mouseMode) {
          if (selectedItem.data.id)
            try {
              ;(snapPoint = e.point),
                (snapPoint.x = elevatePath.segments[0].point.x),
                (elevatePath.segments[1].point = snapPoint)
              let u = elevatePath.segments[1].point.subtract(
                  elevatePath.segments[0].point
                ),
                O = elevatePath.length
              u.angle > 0 && (O *= -1),
                (clickableObjects[selectedItem.data.id].position.y =
                  elevateStartHeight + O),
                maskObjects[selectedItem.data.id] &&
                  (maskObjects[selectedItem.data.id].position.y =
                    elevateStartHeight + O),
                drawHeight(
                  elevatePath.segments[0].point,
                  elevatePath.segments[1].point,
                  elevateStartHeight
                ),
                (controls.target.y =
                  clickableObjects[selectedItem.data.id].position.y),
                render(),
                (furnitureYProp.value = (elevateStartHeight + O).toFixed(3))
            } catch (e) {
              console.log(e)
            }
        } else if (6 === mouseMode) {
          ;(snapPoint = e.point),
            (snapPoint.x = parseInt(e.point.x)),
            (snapPoint.y = parseInt(e.point.y)),
            ctrlKeyPressed &&
              ((snapPoint.x = snapPoint.x - (snapPoint.x % 10)),
              (snapPoint.y = snapPoint.y - (snapPoint.y % 10)))
          e: for (let L = 0; L < wallCornersX.length; L++)
            if (
              e.point.x >= wallCornersX[L] - 10 &&
              e.point.x <= wallCornersX[L] + 10 &&
              e.point.y >= wallCornersY[L] - 10 &&
              e.point.y <= wallCornersY[L] + 10
            ) {
              ;(snapPoint = new paper.Point(wallCornersX[L], wallCornersY[L])),
                new Path.Circle({
                  center: snapPoint,
                  radius: screenScale / 2,
                  fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
                  strokeWidth: 1,
                })
                  .removeOnMove()
                  .removeOnDrag()
              break e
            }
          let r
          Object.keys(verticalGuides).forEach(function (t) {
            e.point.x >= verticalGuides[t].position.x - 10 &&
              e.point.x <= verticalGuides[t].position.x + 10 &&
              (r = new paper.Point(verticalGuides[t].position.x, e.point.y))
          }),
            Object.keys(horizontalGuides).forEach(function (t) {
              e.point.y >= horizontalGuides[t].position.y - 10 &&
                e.point.y <= horizontalGuides[t].position.y + 10 &&
                (r
                  ? (r.y = horizontalGuides[t].position.y)
                  : (r = new paper.Point(
                      e.point.x,
                      horizontalGuides[t].position.y
                    )))
            }),
            r &&
              ((snapPoint = r),
              new Path.Circle({
                center: snapPoint,
                radius: screenScale / 2,
                fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
                strokeWidth: 1,
              })
                .removeOnMove()
                .removeOnDrag()),
            (selectedMovePointIcon.position = snapPoint),
            (selectedItem.segments[movePointIconSelectedId].point = snapPoint),
            setTimeout(function () {
              redrawFloor(selectedItem)
            }, 1),
            (document.getElementById("floorAreaProp").innerHTML =
              Math.abs(selectedItem.area / 1e4).toFixed(3) + " M&sup2;")
        } else
          7 === mouseMode &&
            ((snapPoint = e.point),
            (snapPoint.x = parseInt(e.point.x)),
            (snapPoint.y = parseInt(e.point.y)),
            ctrlKeyPressed &&
              ((snapPoint.x = snapPoint.x - (snapPoint.x % 10)),
              (snapPoint.y = snapPoint.y - (snapPoint.y % 10))),
            (selectedItem.position = snapPoint.add(offsetMousePoint)),
            (plan.texts[selectedItem.data.id].data.x = snapPoint.x),
            (plan.texts[selectedItem.data.id].data.y = snapPoint.y),
            (document.getElementById("textXProp").value =
              snapPoint.x.toFixed(3)),
            (document.getElementById("textYProp").value =
              snapPoint.y.toFixed(3)))
      else if ("background" === toolMode)
        if (2 === e.event.buttons)
          (paper.view.center = paper.view.center.add(t)), redrawGrid()
        else if (0 === mouseMode) {
          ;(dragging = !0),
            (snapPoint = e.point),
            (snapPoint.x = parseInt(e.point.x)),
            (snapPoint.y = parseInt(e.point.y)),
            ctrlKeyPressed &&
              ((snapPoint.x = snapPoint.x - (snapPoint.x % 10)),
              (snapPoint.y = snapPoint.y - (snapPoint.y % 10)))
          let o = snapPoint.add(offsetMousePoint)
          backgroundRaster &&
            ((backgroundRaster.position = o),
            (toolsGroup.position = o),
            (backgroundRaster.data.toolsRectangleInner.position =
              backgroundRaster.position),
            (resizeIcon.position =
              selectedItem.data.toolsRectangleInner.segments[3].point))
        } else if (2 === mouseMode) {
          scalingXY = !0
          try {
            if (e.point.x > 1 && e.point.y > 1) {
              ;(backgroundRasterRatioX = Math.abs(
                backgroundRaster.bounds.right / backgroundRaster.bounds.left
              )),
                (backgroundRasterRatioY = Math.abs(
                  backgroundRaster.bounds.bottom / backgroundRaster.bounds.top
                ))
              let S = new paper.Point(
                  -e.point.x / backgroundRasterRatioX,
                  -e.point.y / backgroundRasterRatioY
                ),
                D = e.point
              ;(backgroundRaster.data.toolsRectangleInner.bounds =
                new Rectangle(S, D)),
                (backgroundRaster.bounds.width =
                  backgroundRaster.data.toolsRectangleInner.bounds.width),
                (backgroundRaster.bounds.height =
                  backgroundRaster.data.toolsRectangleInner.bounds.height),
                (backgroundRaster.position.x =
                  backgroundRaster.data.toolsRectangleInner.position.x),
                (backgroundRaster.position.y =
                  backgroundRaster.data.toolsRectangleInner.position.y),
                (resizeIcon.position =
                  backgroundRaster.data.toolsRectangleInner.segments[3].point)
            }
          } catch (e) {
            console.log(e)
          }
        }
    }),
    (tools.onMouseMove = function (e) {
      if (((lastMousePoint = e.point), "walls" === toolMode)) {
        if (((snapPoint = null), startedDrawingWalls)) {
          let t = e.point.subtract(wallHelperPath.segments[0].point)
          ctrlKeyPressed && (t.angle = 15 * Math.round(t.angle / 15)),
            (snapPoint = wallHelperPath.segments[0].point.add(t))
          let o = wallHelperPath.segments[0],
            a = snapPoint,
            n = getAngleRadians(o.point, a)
          ;(wallHelperRectangle.segments[0].point = new Point(
            o.point.x + (Math.sin(n) * defaultWallThickness) / 2,
            o.point.y - (Math.cos(n) * defaultWallThickness) / 2
          )),
            (wallHelperRectangle.segments[1].point = new Point(
              a.x + (Math.sin(n) * defaultWallThickness) / 2,
              a.y - (Math.cos(n) * defaultWallThickness) / 2
            )),
            (wallHelperRectangle.segments[2].point = new Point(
              a.x - (Math.sin(n) * defaultWallThickness) / 2,
              a.y + (Math.cos(n) * defaultWallThickness) / 2
            )),
            (wallHelperRectangle.segments[3].point = new Point(
              o.point.x - (Math.sin(n) * defaultWallThickness) / 2,
              o.point.y + (Math.cos(n) * defaultWallThickness) / 2
            )),
            (wallHelperPath.segments[1].point = snapPoint),
            drawLength(
              wallHelperPath.segments[0].point,
              wallHelperPath.segments[1].point,
              n < 0 ? -1 : 1
            ),
            (wallHelper3dCube.geometry.vertices[1].x =
              wallHelperRectangle.segments[0].point.x),
            (wallHelper3dCube.geometry.vertices[1].z =
              wallHelperRectangle.segments[0].point.y),
            (wallHelper3dCube.geometry.vertices[3].x =
              wallHelperRectangle.segments[0].point.x),
            (wallHelper3dCube.geometry.vertices[3].z =
              wallHelperRectangle.segments[0].point.y),
            (wallHelper3dCube.geometry.vertices[0].x =
              wallHelperRectangle.segments[1].point.x),
            (wallHelper3dCube.geometry.vertices[0].z =
              wallHelperRectangle.segments[1].point.y),
            (wallHelper3dCube.geometry.vertices[2].x =
              wallHelperRectangle.segments[1].point.x),
            (wallHelper3dCube.geometry.vertices[2].z =
              wallHelperRectangle.segments[1].point.y),
            (wallHelper3dCube.geometry.vertices[5].x =
              wallHelperRectangle.segments[2].point.x),
            (wallHelper3dCube.geometry.vertices[5].z =
              wallHelperRectangle.segments[2].point.y),
            (wallHelper3dCube.geometry.vertices[7].x =
              wallHelperRectangle.segments[2].point.x),
            (wallHelper3dCube.geometry.vertices[7].z =
              wallHelperRectangle.segments[2].point.y),
            (wallHelper3dCube.geometry.vertices[4].x =
              wallHelperRectangle.segments[3].point.x),
            (wallHelper3dCube.geometry.vertices[4].z =
              wallHelperRectangle.segments[3].point.y),
            (wallHelper3dCube.geometry.vertices[6].x =
              wallHelperRectangle.segments[3].point.x),
            (wallHelper3dCube.geometry.vertices[6].z =
              wallHelperRectangle.segments[3].point.y),
            (wallHelper3dCube.geometry.verticesNeedUpdate = !0),
            (tween = new TWEEN.Tween(controls.target)
              .to(wallHelper3dCube.position, 1)
              .onUpdate(render)
              .start())
        }
        snapPointOverride = {}
        let l = null,
          i = null,
          r = defaultWallThickness / 2,
          s = defaultWallThickness / 4
        if (
          (snapPointOverride.id ||
            (Object.keys(verticalGuides).forEach(function (t) {
              e.point.x >= verticalGuides[t].position.x - s &&
                e.point.x <= verticalGuides[t].position.x + s &&
                ((l = new paper.Point(verticalGuides[t].position.x, e.point.y)),
                (i = verticalGuides[t].data.id)),
                null === l &&
                  e.point.x >= verticalGuides[t].position.x - r - s &&
                  e.point.x <= verticalGuides[t].position.x - r + s &&
                  ((l = new paper.Point(
                    verticalGuides[t].position.x - r,
                    e.point.y
                  )),
                  (i = verticalGuides[t].data.id)),
                null === l &&
                  e.point.x >= verticalGuides[t].position.x + r - s &&
                  e.point.x <= verticalGuides[t].position.x + r + s &&
                  ((l = new paper.Point(
                    verticalGuides[t].position.x + r,
                    e.point.y
                  )),
                  (i = verticalGuides[t].data.id))
            }),
            Object.keys(horizontalGuides).forEach(function (t) {
              let o = null
              e.point.y >= horizontalGuides[t].position.y - s &&
                e.point.y <= horizontalGuides[t].position.y + s &&
                (o = horizontalGuides[t].position.y),
                null === o &&
                  e.point.y >= horizontalGuides[t].position.y - r - s &&
                  e.point.y <= horizontalGuides[t].position.y - r + s &&
                  (o = horizontalGuides[t].position.y - r),
                null === o &&
                  e.point.y >= horizontalGuides[t].position.y + r - s &&
                  e.point.y <= horizontalGuides[t].position.y + r + s &&
                  (o = horizontalGuides[t].position.y + r),
                o &&
                  ((i = horizontalGuides[t].data.id),
                  l ? (l.y = o) : (l = new paper.Point(e.point.x, o)))
            }),
            l &&
              ((snapPoint = l),
              new Path.Circle({
                center: snapPoint,
                radius: screenScale / 2,
                fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
                strokeWidth: 1,
              }).removeOnMove(),
              (snapPointOverride = { id: i, x: snapPoint.x, y: snapPoint.y }))),
          !snapPointOverride.id)
        )
          e: for (let d = 0; d < unjoinedWallSegments.length; d++)
            if (
              e.point.x >= unjoinedWallSegments[d].x - 10 &&
              e.point.x <= unjoinedWallSegments[d].x + 10 &&
              e.point.y >= unjoinedWallSegments[d].y - 10 &&
              e.point.y <= unjoinedWallSegments[d].y + 10
            ) {
              ;(snapPoint = new paper.Point(
                unjoinedWallSegments[d].x,
                unjoinedWallSegments[d].y
              )),
                new Path.Circle({
                  center: snapPoint,
                  radius: screenScale / 2,
                  fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
                  strokeWidth: 1,
                }).removeOnMove(),
                (snapPointOverride = {
                  id: unjoinedWallSegments[d].id,
                  x: unjoinedWallSegments[d].x,
                  y: unjoinedWallSegments[d].y,
                })
              break e
            }
        if (!snapPointOverride.id)
          e: for (let d = 0; d < allWallSegments.length; d++)
            if (
              e.point.x >= allWallSegments[d].x - 10 &&
              e.point.x <= allWallSegments[d].x + 10 &&
              e.point.y >= allWallSegments[d].y - 10 &&
              e.point.y <= allWallSegments[d].y + 10
            ) {
              ;(snapPoint = new paper.Point(
                allWallSegments[d].x,
                allWallSegments[d].y
              )),
                new Path.Circle({
                  center: snapPoint,
                  radius: screenScale / 2,
                  fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
                  strokeWidth: 1,
                }).removeOnMove(),
                (snapPointOverride = {
                  id: allWallSegments[d].id,
                  x: allWallSegments[d].x,
                  y: allWallSegments[d].y,
                })
              break e
            }
      } else if ("roof" === toolMode) {
        if (startedDrawingRoofs) {
          let t = e.point.subtract(roofHelperPath.segments[0].point)
          ctrlKeyPressed && (t.angle = 15 * Math.round(t.angle / 15)),
            (snapPoint = roofHelperPath.segments[0].point.add(t))
          let o = roofHelperPath.segments[0],
            a = snapPoint,
            n = getAngleRadians(o.point, a)
          ;(roofHelperRectangle.segments[0].point = new Point(
            o.point.x + (Math.sin(n) * defaultRoofWidth) / 2,
            o.point.y - (Math.cos(n) * defaultRoofWidth) / 2
          )),
            (roofHelperRectangle.segments[1].point = new Point(
              a.x + (Math.sin(n) * defaultRoofWidth) / 2,
              a.y - (Math.cos(n) * defaultRoofWidth) / 2
            )),
            (roofHelperRectangle.segments[2].point = new Point(
              a.x - (Math.sin(n) * defaultRoofWidth) / 2,
              a.y + (Math.cos(n) * defaultRoofWidth) / 2
            )),
            (roofHelperRectangle.segments[3].point = new Point(
              o.point.x - (Math.sin(n) * defaultRoofWidth) / 2,
              o.point.y + (Math.cos(n) * defaultRoofWidth) / 2
            )),
            (roofHelperPath.segments[1].point = snapPoint),
            drawLength(
              roofHelperPath.segments[0].point,
              roofHelperPath.segments[1].point,
              n < 0 ? -1 : 1
            ),
            (roofHelper3dCube.geometry.vertices[1].x =
              roofHelperRectangle.segments[0].point.x),
            (roofHelper3dCube.geometry.vertices[1].z =
              roofHelperRectangle.segments[0].point.y),
            (roofHelper3dCube.geometry.vertices[3].x =
              roofHelperRectangle.segments[0].point.x),
            (roofHelper3dCube.geometry.vertices[3].z =
              roofHelperRectangle.segments[0].point.y),
            (roofHelper3dCube.geometry.vertices[0].x =
              roofHelperRectangle.segments[1].point.x),
            (roofHelper3dCube.geometry.vertices[0].z =
              roofHelperRectangle.segments[1].point.y),
            (roofHelper3dCube.geometry.vertices[2].x =
              roofHelperRectangle.segments[1].point.x),
            (roofHelper3dCube.geometry.vertices[2].z =
              roofHelperRectangle.segments[1].point.y),
            (roofHelper3dCube.geometry.vertices[5].x =
              roofHelperRectangle.segments[2].point.x),
            (roofHelper3dCube.geometry.vertices[5].z =
              roofHelperRectangle.segments[2].point.y),
            (roofHelper3dCube.geometry.vertices[7].x =
              roofHelperRectangle.segments[2].point.x),
            (roofHelper3dCube.geometry.vertices[7].z =
              roofHelperRectangle.segments[2].point.y),
            (roofHelper3dCube.geometry.vertices[4].x =
              roofHelperRectangle.segments[3].point.x),
            (roofHelper3dCube.geometry.vertices[4].z =
              roofHelperRectangle.segments[3].point.y),
            (roofHelper3dCube.geometry.vertices[6].x =
              roofHelperRectangle.segments[3].point.x),
            (roofHelper3dCube.geometry.vertices[6].z =
              roofHelperRectangle.segments[3].point.y)
          let c = defaultRoofThickness / 2,
            u = defaultRoofRise / 2
          ;(roofHelper3dCube.geometry.vertices[0].y = c - u),
            (roofHelper3dCube.geometry.vertices[1].y = c - u),
            (roofHelper3dCube.geometry.vertices[4].y = c + u),
            (roofHelper3dCube.geometry.vertices[5].y = c + u),
            (roofHelper3dCube.geometry.vertices[2].y = -c - u),
            (roofHelper3dCube.geometry.vertices[3].y = -c - u),
            (roofHelper3dCube.geometry.vertices[6].y = -c + u),
            (roofHelper3dCube.geometry.vertices[7].y = -c + u),
            (roofHelper3dCube.geometry.verticesNeedUpdate = !0),
            (tween = new TWEEN.Tween(controls.target)
              .to(roofHelper3dCube.position, 1)
              .onUpdate(render)
              .start())
        }
        snapPointOverride = {}
        let l = null,
          i = null,
          r = defaultRoofWidth / 2,
          s = defaultRoofWidth / 10
        Object.keys(verticalGuides).forEach(function (t) {
          e.point.x >= verticalGuides[t].position.x - s &&
            e.point.x <= verticalGuides[t].position.x + s &&
            ((l = new paper.Point(verticalGuides[t].position.x, e.point.y)),
            (i = verticalGuides[t].data.id)),
            null === l &&
              e.point.x >= verticalGuides[t].position.x - r - s &&
              e.point.x <= verticalGuides[t].position.x - r + s &&
              ((l = new paper.Point(
                verticalGuides[t].position.x - r,
                e.point.y
              )),
              (i = verticalGuides[t].data.id)),
            null === l &&
              e.point.x >= verticalGuides[t].position.x + r - s &&
              e.point.x <= verticalGuides[t].position.x + r + s &&
              ((l = new paper.Point(
                verticalGuides[t].position.x + r,
                e.point.y
              )),
              (i = verticalGuides[t].data.id))
        }),
          Object.keys(horizontalGuides).forEach(function (t) {
            let o = null
            e.point.y >= horizontalGuides[t].position.y - s &&
              e.point.y <= horizontalGuides[t].position.y + s &&
              (o = horizontalGuides[t].position.y),
              null === o &&
                e.point.y >= horizontalGuides[t].position.y - r - s &&
                e.point.y <= horizontalGuides[t].position.y - r + s &&
                (o = horizontalGuides[t].position.y - r),
              null === o &&
                e.point.y >= horizontalGuides[t].position.y + r - s &&
                e.point.y <= horizontalGuides[t].position.y + r + s &&
                (o = horizontalGuides[t].position.y + r),
              o &&
                ((i = horizontalGuides[t].data.id),
                l ? (l.y = o) : (l = new paper.Point(e.point.x, o)))
          }),
          l &&
            ((snapPoint = l),
            new Path.Circle({
              center: snapPoint,
              radius: screenScale / 2,
              fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
              strokeWidth: 1,
            }).removeOnMove(),
            (snapPointOverride = { id: i, x: snapPoint.x, y: snapPoint.y }))
      } else if ("floor" === toolMode) {
        snapPoint = e.point
        e: for (let d = 0; d < wallCornersX.length; d++)
          if (
            e.point.x >= wallCornersX[d] - 10 &&
            e.point.x <= wallCornersX[d] + 10 &&
            e.point.y >= wallCornersY[d] - 10 &&
            e.point.y <= wallCornersY[d] + 10
          ) {
            ;(snapPoint = new paper.Point(wallCornersX[d], wallCornersY[d])),
              new Path.Circle({
                center: snapPoint,
                radius: screenScale / 2,
                fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
                strokeWidth: 1,
              }).removeOnMove()
            break e
          }
        let l
        Object.keys(verticalGuides).forEach(function (t) {
          e.point.x >= verticalGuides[t].position.x - 10 &&
            e.point.x <= verticalGuides[t].position.x + 10 &&
            ((l = new paper.Point(verticalGuides[t].position.x, e.point.y)),
            (i = verticalGuides[t].data.id))
        }),
          Object.keys(horizontalGuides).forEach(function (t) {
            e.point.y >= horizontalGuides[t].position.y - 10 &&
              e.point.y <= horizontalGuides[t].position.y + 10 &&
              (l
                ? (l.y = horizontalGuides[t].position.y)
                : (l = new paper.Point(
                    e.point.x,
                    horizontalGuides[t].position.y
                  )),
              (i = horizontalGuides[t].data.id))
          }),
          l &&
            ((snapPoint = l),
            new Path.Circle({
              center: snapPoint,
              radius: screenScale / 2,
              fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
              strokeWidth: 1,
            }).removeOnMove()),
          startedDrawingFloor && (floorHelperPath.segments[1].point = snapPoint)
      } else if ("dimension" === toolMode) {
        snapPoint = e.point
        e: for (let d = 0; d < wallCornersX.length; d++)
          if (
            e.point.x >= wallCornersX[d] - 10 &&
            e.point.x <= wallCornersX[d] + 10 &&
            e.point.y >= wallCornersY[d] - 10 &&
            e.point.y <= wallCornersY[d] + 10
          ) {
            ;(snapPoint = new paper.Point(wallCornersX[d], wallCornersY[d])),
              new Path.Circle({
                center: snapPoint,
                radius: screenScale / 2,
                fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
                strokeWidth: 1,
              }).removeOnMove()
            break e
          }
        if (startedDrawingDimension)
          if (1 === dimensionPath.segments.length)
            (dimensionHelperPath.segments[1].point = snapPoint),
              drawDimension(
                dimensionHelperPath.segments[0].point,
                dimensionHelperPath.segments[1].point,
                10
              )
          else {
            let t = dimensionHelperPath.segments[1].point.subtract(
                dimensionHelperPath.segments[0].point
              ),
              p = dimensionHelperPath.segments[1].point.subtract(snapPoint),
              m = (p.angle - t.angle + 360) % 360,
              g = (m / 180) * Math.PI,
              y = p.length * Math.sin(g)
            drawDimension(
              dimensionHelperPath.segments[0].point,
              dimensionHelperPath.segments[1].point,
              y
            )
          }
      }
    }),
    planCanvas.addEventListener(
      "dblclick",
      function (e) {
        "pointer" === toolMode
          ? deselectAll()
          : "floor" === toolMode &&
            startedDrawingFloor &&
            ((startedDrawingFloor = !1),
            (floorHelperPath.visible = !1),
            (floorPath.closed = !0))
      },
      !1
    ),
    (paper.view.center = [350, 130]),
    paper.view.draw(),
    redrawGrid()
}
function setEndDrawingGround() {
  console.log("todo")
}
function setEndDrawingText() {
  ;(startedDrawingText = !1), deselectAll()
}
function setEndDrawingDimension() {
  startedDrawingDimension &&
    ((startedDrawingDimension = !1), (dimensionHelperPath.visible = !1))
}
function setEndDrawingFloors() {
  startedDrawingFloor &&
    ((startedDrawingFloor = !1),
    (floorHelperPath.visible = !1),
    Floors[floorPath.data.id].segments.length < 3
      ? deleteFloorByKey(floorPath.data.id)
      : (floorPath.closed = !0))
}
function setEndDrawingRoofs() {
  ;(startedDrawingRoofs = !1),
    (roofHelperPath.visible = !1),
    (roofHelperRectangle.visible = !1),
    (roofHelper3dCube.visible = !1),
    roofPath && roofPath.segments && 2 === roofPath.segments.length
      ? relinkRoofReferences(project.activeLayer.data.id)
      : roofPath &&
        (plan.roofs[roofPath.data.id] && delete plan.roofs[roofPath.data.id],
        Roofs[roofPath.data.id] && delete Roofs[roofPath.data.id],
        (roofPath = null),
        dltext && dltext.remove())
}
function drawAngle(e, t, o, a) {
  let n = a / 2
  n > 100 && (n = 100)
  let l = avgAngleRad(e, t),
    i =
      ((t - e + 2 * Math.PI) % (2 * Math.PI),
      o.add(new Point(-Math.cos(-e) * n, Math.sin(-e) * n))),
    r = (180 * (e - t)) / Math.PI
  ;(r = 180 - r), (r = (r + 360) % 360)
  let s
  r < 180
    ? (s = o.add(new Point(Math.sin(l) * n, -Math.cos(l) * n)))
    : ((s = o.add(new Point(-Math.sin(l) * n, Math.cos(l) * n))),
      (r = 360 - r)),
    (r = Math.floor(100 * r) / 100)
  let d = o.add(new Point(Math.cos(-t) * n, -Math.sin(-t) * n)),
    c = new paper.Path.Arc(i, s, d).removeOnMove()
  c.style = { strokeColor: "white" }
  let u = new paper.PointText(s.add(new paper.Point(0, 3))).removeOnMove()
  return (u.fontSize = screenScale), (u.content = r + "°"), !0
}
function drawHeight(e, t, o) {
  let a = 10,
    n = t.subtract(e),
    l = n.normalize(a).rotate(90),
    i = (n.normalize(a).rotate(45), e.add(n.normalize(n.length / 2))),
    r = 1,
    s = Math.abs(n.angle) > 90 ? (s = 180 + n.angle) : n.angle,
    d = (r >= 0 ? [1, 4] : [2, 3]).indexOf(n.quadrant) != -1 ? 8 : 0,
    c = new paper.PointText({
      point: i.add(l.normalize(d + screenScale / 3)),
      justification: "center",
    })
      .removeOnMove()
      .removeOnDrag()
  ;(c.fontFamily = "Courier New"),
    (c.fillColor = "white"),
    (c.fontSize = screenScale / 1.5),
    c.rotate(s)
  let u = o + n.length
  c.content = Math.floor(1e3 * u) / 1e3
}
function drawLength(e, t, o) {
  let a = 10,
    n = t.subtract(e),
    l = n.normalize(a).rotate(90 * o),
    i = e.add(n.normalize(n.length / 2)),
    r = Math.abs(n.angle) > 90 ? (r = 180 + n.angle) : n.angle,
    s = (o >= 0 ? [1, 4] : [2, 3]).indexOf(n.quadrant) != -1 ? 8 : 0
  ;(dltext = new paper.PointText({
    point: i.add(l.normalize(s - screenScale / 3)),
    justification: "center",
  })
    .removeOnMove()
    .removeOnDrag()),
    (dltext.fontFamily = "Courier New"),
    (dltext.fillColor = "white"),
    (dltext.fontSize = screenScale / 1.5),
    dltext.rotate(r)
  let d = n.length
  return (dltext.content = Math.floor(1e3 * d) / 1e3), d
}
function compareAnglesRadians(e, t) {
  let o = t - e
  return (
    o < -Math.PI && (o += 2 * Math.PI),
    o > Math.PI && (o -= 2 * Math.PI),
    o > 0 ? 1 : o < 0 ? -1 : 0
  )
}
function setEndDrawingWalls() {
  ;(startedDrawingWalls = !1),
    (wallHelperPath.visible = !1),
    (wallHelperRectangle.visible = !1),
    (wallHelper3dCube.visible = !1),
    wallPath && wallPath.segments && 2 === wallPath.segments.length
      ? relinkWallReferences(project.activeLayer.data.id)
      : wallPath &&
        (plan.walls[wallPath.data.id] && delete plan.walls[wallPath.data.id],
        Walls[wallPath.data.id] && delete Walls[wallPath.data.id],
        (wallPath = null),
        dltext && dltext.remove())
}
function avgAngleRad(e, t) {
  return Math.atan2(
    (Math.sin(e) + Math.sin(t)) / 2,
    (Math.cos(e) + Math.cos(t)) / 2
  )
}
// function deselectAll() {
//   try {
//     ;(mouseMode = -1),
//       selectedItem &&
//         selectedItem.data &&
//         (selectedItem.data.toolsRectangleInner &&
//           (selectedItem.data.toolsRectangleInner.visible = !1),
//         selectedItem.data.boxHelper &&
//           (selectedItem.data.boxHelper.visible = !1),
//         "dimension" === selectedItem.data.type &&
//           ((Dimensions[selectedItem.data.id].text.selected = !1),
//           (Dimensions[selectedItem.data.id].line.selected = !1)),
//         (selectedItem.selected = !1),
//         (selectedItem = null),
//         (toolsGroup.visible = !1),
//         updateObjectPropertiesWindow()),
//       wallHelperPath && (wallHelperPath.visible = !1),
//       roofHelperPath && (roofHelperPath.visible = !1),
//       movePointIcons.forEach(function (e) {
//         e.remove()
//       }),
//       (movePointIcons = []),
//       (offsetMousePoint = new paper.Point(0, 0))
//   } catch (e) {
//     console.log(e)
//   }
// }
function setCtrlKeyPressed(e) {
  ctrlKeyPressed = e
}
function setToolMode(e) {
  switch (
    ("walls" === toolMode
      ? setEndDrawingWalls()
      : "floor" === toolMode
      ? setEndDrawingFloors()
      : "roof" === toolMode
      ? setEndDrawingRoofs()
      : "dimension" === toolMode
      ? setEndDrawingDimension()
      : "text" === toolMode
      ? setEndDrawingText()
      : "ground" === toolMode && setEndDrawingGround(),
    (toolMode = e),
    e)
  ) {
    case "pointer":
      modalsActive || showMouseIndicators(),
        (defaultCursor = "default"),
        deselectAll(),
        document.getElementById("pointerTool").classList.add("activeTool"),
        document.getElementById("addWallTool").classList.remove("activeTool"),
        document.getElementById("addFloorTool").classList.remove("activeTool"),
        document.getElementById("addRoofTool").classList.remove("activeTool"),
        document.getElementById("addRulerTool").classList.remove("activeTool"),
        document.getElementById("addTextTool").classList.remove("activeTool")
      break
    case "walls":
      ;(defaultCursor = "crosshair"),
        deselectAll(),
        recalcAllUnjoinedWallSegments(-1),
        recalcAllWallSegmentsOnOtherLevels(-1, project.activeLayer.data.id),
        document.getElementById("pointerTool").classList.remove("activeTool"),
        document.getElementById("addWallTool").classList.add("activeTool"),
        document.getElementById("addFloorTool").classList.remove("activeTool"),
        document.getElementById("addRoofTool").classList.remove("activeTool"),
        document.getElementById("addRulerTool").classList.remove("activeTool"),
        document.getElementById("addTextTool").classList.remove("activeTool"),
        setPropertiesView("wallDefaults")
      break
    case "floor":
      ;(defaultCursor = "crosshair"),
        deselectAll(),
        document.getElementById("pointerTool").classList.remove("activeTool"),
        document.getElementById("addWallTool").classList.remove("activeTool"),
        document.getElementById("addFloorTool").classList.add("activeTool"),
        document.getElementById("addRoofTool").classList.remove("activeTool"),
        document.getElementById("addRulerTool").classList.remove("activeTool"),
        document.getElementById("addTextTool").classList.remove("activeTool"),
        recalcAllWallCorners(),
        setPropertiesView("floorDefaults")
      break
    case "roof":
      ;(defaultCursor = "crosshair"),
        deselectAll(),
        document.getElementById("pointerTool").classList.remove("activeTool"),
        document.getElementById("addWallTool").classList.remove("activeTool"),
        document.getElementById("addFloorTool").classList.remove("activeTool"),
        document.getElementById("addRoofTool").classList.add("activeTool"),
        document.getElementById("addRulerTool").classList.remove("activeTool"),
        document.getElementById("addTextTool").classList.remove("activeTool"),
        recalcAllRoofCorners(),
        setPropertiesView("roofDefaults")
      break
    case "dimension":
      ;(defaultCursor = "crosshair"),
        deselectAll(),
        document.getElementById("pointerTool").classList.remove("activeTool"),
        document.getElementById("addWallTool").classList.remove("activeTool"),
        document.getElementById("addFloorTool").classList.remove("activeTool"),
        document.getElementById("addRoofTool").classList.remove("activeTool"),
        document.getElementById("addRulerTool").classList.add("activeTool"),
        document.getElementById("addTextTool").classList.remove("activeTool"),
        recalcAllWallCorners(),
        recalcAllRoofCorners(),
        setPropertiesView("dimensionDefaults")
      break
    case "text":
      ;(defaultCursor = "crosshair"),
        deselectAll(),
        document.getElementById("pointerTool").classList.remove("activeTool"),
        document.getElementById("addWallTool").classList.remove("activeTool"),
        document.getElementById("addFloorTool").classList.remove("activeTool"),
        document.getElementById("addRoofTool").classList.remove("activeTool"),
        document.getElementById("addRulerTool").classList.remove("activeTool"),
        document.getElementById("addTextTool").classList.add("activeTool"),
        setPropertiesView("textnDefaults")
      break
    case "background":
      ;(defaultCursor = "default"),
        document.getElementById("pointerTool").classList.remove("activeTool"),
        document.getElementById("addWallTool").classList.remove("activeTool"),
        document.getElementById("addFloorTool").classList.remove("activeTool"),
        document.getElementById("addRoofTool").classList.remove("activeTool"),
        document.getElementById("addRulerTool").classList.remove("activeTool"),
        document.getElementById("addTextTool").classList.remove("activeTool")
      break
    case "ground":
      setLevel("0"),
        (toolMode = e),
        (defaultCursor = "default"),
        (wallsGroup[0].opacity = 0.25),
        (floorsGroup[0].opacity = 0.25),
        (furnitureGroup[0].opacity = 0.25),
        document.getElementById("pointerTool").classList.remove("activeTool"),
        document.getElementById("addWallTool").classList.remove("activeTool"),
        document.getElementById("addFloorTool").classList.remove("activeTool"),
        document.getElementById("addRoofTool").classList.remove("activeTool"),
        document.getElementById("addRulerTool").classList.remove("activeTool"),
        document.getElementById("addTextTool").classList.remove("activeTool"),
        setPropertiesView("ground")
      break
    case "defaults":
      ;(defaultCursor = "default"),
        deselectAll(),
        document.getElementById("pointerTool").classList.remove("activeTool"),
        document.getElementById("addWallTool").classList.remove("activeTool"),
        document.getElementById("addFloorTool").classList.remove("activeTool"),
        document.getElementById("addRoofTool").classList.remove("activeTool"),
        document.getElementById("addRulerTool").classList.remove("activeTool"),
        document.getElementById("addTextTool").classList.remove("activeTool")
  }
  planView.style.cursor = defaultCursor
}
function reDrawWallCorners(e) {
  if (2 === e.segments.length) {
    let t = e.data.thickness / 2
    if (e.data.join0.id) {
      let o
      if (0 === e.data.join0.seg) {
        let a = Walls[e.data.join0.id].data.thickness / 2
        o = Walls[e.data.join0.id].segments[1].point
        let n = e.segments[0].point,
          l = e.segments[1].point,
          i = getAngleRadians(n, l),
          r = getAngleRadians(o, n),
          s = (i - r + 2 * Math.PI) % (2 * Math.PI)
        s /= 2
        let d = r + Math.PI / 2,
          c =
            Math.sin(r) * t +
            Math.sin(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * t),
          u =
            -(Math.cos(r) * t) -
            Math.cos(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * t),
          p =
            Math.sin(r) * a +
            Math.sin(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * a),
          m =
            -(Math.cos(r) * a) -
            Math.cos(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * a),
          g = n.add(new paper.Point(c, u)),
          y = n.add(new paper.Point(-c, -u)),
          f = n.add(new paper.Point(p, m)),
          h = n.add(new paper.Point(-p, -m))
        ;(wallsRectangles[e.data.id].segments[2].point = g),
          (wallsRectangles[e.data.join0.id].segments[3].point = f),
          (wallsRectangles[e.data.join0.id].segments[0].point = h),
          (wallsRectangles[e.data.id].segments[1].point = y),
          (wallsRectangles[e.data.id].closed = !0),
          (wallsRectangles[e.data.join0.id].closed = !0)
        let v = wallsRectangles3d[e.data.id],
          w = wallsRectangles3d[e.data.join0.id]
        ;(w.geometry.vertices[4].x = f.x),
          (w.geometry.vertices[4].z = f.y),
          (w.geometry.vertices[6].x = f.x),
          (w.geometry.vertices[6].z = f.y),
          (v.geometry.vertices[0].x = g.x),
          (v.geometry.vertices[0].z = g.y),
          (v.geometry.vertices[2].x = g.x),
          (v.geometry.vertices[2].z = g.y),
          (v.geometry.vertices[5].x = y.x),
          (v.geometry.vertices[5].z = y.y),
          (v.geometry.vertices[7].x = y.x),
          (v.geometry.vertices[7].z = y.y),
          (w.geometry.vertices[1].x = h.x),
          (w.geometry.vertices[1].z = h.y),
          (w.geometry.vertices[3].x = h.x),
          (w.geometry.vertices[3].z = h.y),
          (w.geometry.verticesNeedUpdate = !0),
          (v.geometry.verticesNeedUpdate = !0)
      } else {
        let a = Walls[e.data.join0.id].data.thickness / 2
        o = Walls[e.data.join0.id].segments[0].point
        let n = e.segments[0].point,
          l = e.segments[1].point,
          i = getAngleRadians(n, l),
          r = getAngleRadians(o, n),
          s = (i - r + 2 * Math.PI) % (2 * Math.PI)
        s /= 2
        let d = r + Math.PI / 2,
          c =
            Math.sin(r) * t +
            Math.sin(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * t),
          u =
            -(Math.cos(r) * t) -
            Math.cos(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * t),
          p =
            Math.sin(r) * a +
            Math.sin(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * a),
          m =
            -(Math.cos(r) * a) -
            Math.cos(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * a),
          g = n.add(new paper.Point(c, u)),
          y = n.add(new paper.Point(-c, -u)),
          f = n.add(new paper.Point(p, m)),
          h = n.add(new paper.Point(-p, -m))
        ;(wallsRectangles[e.data.id].segments[0].point = g),
          (wallsRectangles[e.data.join0.id].segments[1].point = f),
          (wallsRectangles[e.data.join0.id].segments[2].point = h),
          (wallsRectangles[e.data.id].segments[3].point = y),
          (wallsRectangles[e.data.id].closed = !0),
          (wallsRectangles[e.data.join0.id].closed = !0)
        let w = wallsRectangles3d[e.data.id],
          v = wallsRectangles3d[e.data.join0.id]
        ;(w.geometry.vertices[1].x = g.x),
          (w.geometry.vertices[1].z = g.y),
          (w.geometry.vertices[3].x = g.x),
          (w.geometry.vertices[3].z = g.y),
          (v.geometry.vertices[0].x = f.x),
          (v.geometry.vertices[0].z = f.y),
          (v.geometry.vertices[2].x = f.x),
          (v.geometry.vertices[2].z = f.y),
          (v.geometry.vertices[5].x = h.x),
          (v.geometry.vertices[5].z = h.y),
          (v.geometry.vertices[7].x = h.x),
          (v.geometry.vertices[7].z = h.y),
          (w.geometry.vertices[4].x = y.x),
          (w.geometry.vertices[4].z = y.y),
          (w.geometry.vertices[6].x = y.x),
          (w.geometry.vertices[6].z = y.y),
          (w.geometry.verticesNeedUpdate = !0),
          (v.geometry.verticesNeedUpdate = !0)
      }
    } else {
      let n = e.segments[0].point,
        l = e.segments[1].point,
        i = getAngleRadians(n, l),
        g = new Point(n.x + Math.sin(i) * t, n.y - Math.cos(i) * t),
        y = new Point(l.x + Math.sin(i) * t, l.y - Math.cos(i) * t),
        I = new Point(l.x - Math.sin(i) * t, l.y + Math.cos(i) * t),
        P = new Point(n.x - Math.sin(i) * t, n.y + Math.cos(i) * t)
      ;(wallsRectangles[e.data.id].segments[0].point = g),
        (wallsRectangles[e.data.id].segments[3].point = P),
        (wallsRectangles[e.data.id].closed = !0)
      let w = wallsRectangles3d[e.data.id]
      ;(w.geometry.vertices[1].x = g.x),
        (w.geometry.vertices[1].z = g.y),
        (w.geometry.vertices[3].x = g.x),
        (w.geometry.vertices[3].z = g.y),
        (w.geometry.vertices[4].x = P.x),
        (w.geometry.vertices[4].z = P.y),
        (w.geometry.vertices[6].x = P.x),
        (w.geometry.vertices[6].z = P.y),
        (w.geometry.verticesNeedUpdate = !0)
    }
    if (e.data.join1.id) {
      let l,
        o = e.segments[0].point,
        n = e.segments[1].point
      if (0 === e.data.join1.seg) {
        let a = Walls[e.data.join1.id].data.thickness / 2
        l = Walls[e.data.join1.id].segments[1].point
        let i = getAngleRadians(n, l),
          r = getAngleRadians(o, n),
          s = (i - r + 2 * Math.PI) % (2 * Math.PI)
        s /= 2
        let d = r + Math.PI / 2,
          c =
            Math.sin(r) * t +
            Math.sin(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * t),
          u =
            -(Math.cos(r) * t) -
            Math.cos(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * t),
          p =
            Math.sin(r) * a +
            Math.sin(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * a),
          m =
            -(Math.cos(r) * a) -
            Math.cos(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * a),
          g = n.add(new paper.Point(c, u)),
          y = n.add(new paper.Point(-c, -u)),
          f = n.add(new paper.Point(p, m)),
          h = n.add(new paper.Point(-p, -m))
        ;(wallsRectangles[e.data.id].segments[1].point = g),
          (wallsRectangles[e.data.join1.id].segments[0].point = f),
          (wallsRectangles[e.data.join1.id].segments[3].point = h),
          (wallsRectangles[e.data.id].segments[2].point = y),
          (wallsRectangles[e.data.id].closed = !0),
          (wallsRectangles[e.data.join1.id].closed = !0)
        let w = wallsRectangles3d[e.data.join1.id],
          v = wallsRectangles3d[e.data.id]
        ;(w.geometry.vertices[1].x = f.x),
          (w.geometry.vertices[1].z = f.y),
          (w.geometry.vertices[3].x = f.x),
          (w.geometry.vertices[3].z = f.y),
          (v.geometry.vertices[0].x = g.x),
          (v.geometry.vertices[0].z = g.y),
          (v.geometry.vertices[2].x = g.x),
          (v.geometry.vertices[2].z = g.y),
          (v.geometry.vertices[5].x = y.x),
          (v.geometry.vertices[5].z = y.y),
          (v.geometry.vertices[7].x = y.x),
          (v.geometry.vertices[7].z = y.y),
          (w.geometry.vertices[4].x = h.x),
          (w.geometry.vertices[4].z = h.y),
          (w.geometry.vertices[6].x = h.x),
          (w.geometry.vertices[6].z = h.y),
          (w.geometry.verticesNeedUpdate = !0),
          (v.geometry.verticesNeedUpdate = !0)
      } else {
        let a = Walls[e.data.join1.id].data.thickness / 2
        l = Walls[e.data.join1.id].segments[0].point
        let i = getAngleRadians(n, l),
          r = getAngleRadians(o, n),
          s = (i - r + 2 * Math.PI) % (2 * Math.PI)
        s /= 2
        let d = r + Math.PI / 2,
          c =
            Math.sin(r) * t +
            Math.sin(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * t),
          u =
            -(Math.cos(r) * t) -
            Math.cos(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * t),
          p =
            Math.sin(r) * a +
            Math.sin(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * a),
          m =
            -(Math.cos(r) * a) -
            Math.cos(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * a),
          g = n.add(new paper.Point(c, u)),
          y = n.add(new paper.Point(-c, -u)),
          f = n.add(new paper.Point(p, m)),
          h = n.add(new paper.Point(-p, -m))
        ;(wallsRectangles[e.data.id].segments[1].point = g),
          (wallsRectangles[e.data.join1.id].segments[1].point = h),
          (wallsRectangles[e.data.join1.id].segments[2].point = f),
          (wallsRectangles[e.data.id].segments[2].point = y),
          (wallsRectangles[e.data.id].closed = !0),
          (wallsRectangles[e.data.join1.id].closed = !0)
        let w = wallsRectangles3d[e.data.join1.id],
          v = wallsRectangles3d[e.data.id]
        ;(v.geometry.vertices[0].x = g.x),
          (v.geometry.vertices[0].z = g.y),
          (v.geometry.vertices[2].x = g.x),
          (v.geometry.vertices[2].z = g.y),
          (v.geometry.vertices[5].x = y.x),
          (v.geometry.vertices[5].z = y.y),
          (v.geometry.vertices[7].x = y.x),
          (v.geometry.vertices[7].z = y.y),
          (w.geometry.verticesNeedUpdate = !0),
          (v.geometry.verticesNeedUpdate = !0)
      }
    } else {
      let n = e.segments[0].point,
        l = e.segments[1].point,
        i = getAngleRadians(n, l),
        g = new Point(n.x + Math.sin(i) * t, n.y - Math.cos(i) * t),
        y = new Point(l.x + Math.sin(i) * t, l.y - Math.cos(i) * t),
        I = new Point(l.x - Math.sin(i) * t, l.y + Math.cos(i) * t),
        P = new Point(n.x - Math.sin(i) * t, n.y + Math.cos(i) * t)
      ;(wallsRectangles[e.data.id].segments[1].point = y),
        (wallsRectangles[e.data.id].segments[2].point = I),
        (wallsRectangles[e.data.id].closed = !0)
      let w = wallsRectangles3d[e.data.id]
      ;(w.geometry.vertices[0].x = y.x),
        (w.geometry.vertices[0].z = y.y),
        (w.geometry.vertices[2].x = y.x),
        (w.geometry.vertices[2].z = y.y),
        (w.geometry.vertices[5].x = I.x),
        (w.geometry.vertices[5].z = I.y),
        (w.geometry.vertices[7].x = I.x),
        (w.geometry.vertices[7].z = I.y),
        (w.geometry.verticesNeedUpdate = !0)
    }
    let b = e.data.height[0] / 2,
      x = (e.data.height[1] / 2, wallsRectangles3d[e.data.id].geometry.vertices)
    ;(x[0].y = -b + e.data.height[1]),
      (x[1].y = -b + e.data.height[0]),
      (x[4].y = -b + e.data.height[0]),
      (x[5].y = -b + e.data.height[1]),
      (x[2].y = -b),
      (x[3].y = -b),
      (x[6].y = -b),
      (x[7].y = -b),
      wallsRectangles3d[e.data.id].geometry.computeFlatVertexNormals(),
      (wallsRectangles3d[e.data.id].position.y =
        b + project.layers[e.data.level].data.height)
  } else console.log("segments lenght was not 2")
}
function reDrawRoofCorners(e) {
  if (2 === e.segments.length) {
    let t = e.data.width / 2
    if (e.data.join0.id) {
      let o
      if (0 === e.data.join0.seg) {
        let a = Roofs[e.data.join0.id].data.width / 2
        o = Roofs[e.data.join0.id].segments[1].point
        let n = e.segments[0].point,
          l = e.segments[1].point,
          i = getAngleRadians(n, l),
          r = getAngleRadians(o, n),
          s = (i - r + 2 * Math.PI) % (2 * Math.PI)
        s /= 2
        let d = r + Math.PI / 2,
          c =
            Math.sin(r) * t +
            Math.sin(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * t),
          u =
            -(Math.cos(r) * t) -
            Math.cos(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * t),
          p =
            Math.sin(r) * a +
            Math.sin(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * a),
          m =
            -(Math.cos(r) * a) -
            Math.cos(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * a),
          g = n.add(new paper.Point(c, u)),
          y = n.add(new paper.Point(-c, -u)),
          f = n.add(new paper.Point(p, m)),
          h = n.add(new paper.Point(-p, -m))
        ;(roofsRectangles[e.data.id].segments[2].point = g),
          (roofsRectangles[e.data.join0.id].segments[3].point = f),
          (roofsRectangles[e.data.join0.id].segments[0].point = h),
          (roofsRectangles[e.data.id].segments[1].point = y),
          (roofsRectangles[e.data.id].closed = !0),
          (roofsRectangles[e.data.join0.id].closed = !0)
        let v = roofsRectangles3d[e.data.id],
          w = roofsRectangles3d[e.data.join0.id]
        ;(w.geometry.vertices[4].x = f.x),
          (w.geometry.vertices[4].z = f.y),
          (w.geometry.vertices[6].x = f.x),
          (w.geometry.vertices[6].z = f.y),
          (v.geometry.vertices[0].x = g.x),
          (v.geometry.vertices[0].z = g.y),
          (v.geometry.vertices[2].x = g.x),
          (v.geometry.vertices[2].z = g.y),
          (v.geometry.vertices[5].x = y.x),
          (v.geometry.vertices[5].z = y.y),
          (v.geometry.vertices[7].x = y.x),
          (v.geometry.vertices[7].z = y.y),
          (w.geometry.vertices[1].x = h.x),
          (w.geometry.vertices[1].z = h.y),
          (w.geometry.vertices[3].x = h.x),
          (w.geometry.vertices[3].z = h.y),
          (w.geometry.verticesNeedUpdate = !0),
          (v.geometry.verticesNeedUpdate = !0)
      } else {
        let a = Roofs[e.data.join0.id].data.width / 2
        o = Roofs[e.data.join0.id].segments[0].point
        let n = e.segments[0].point,
          l = e.segments[1].point,
          i = getAngleRadians(n, l),
          r = getAngleRadians(o, n),
          s = (i - r + 2 * Math.PI) % (2 * Math.PI)
        s /= 2
        let d = r + Math.PI / 2,
          c =
            Math.sin(r) * t +
            Math.sin(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * t),
          u =
            -(Math.cos(r) * t) -
            Math.cos(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * t),
          p =
            Math.sin(r) * a +
            Math.sin(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * a),
          m =
            -(Math.cos(r) * a) -
            Math.cos(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * a),
          g = n.add(new paper.Point(c, u)),
          y = n.add(new paper.Point(-c, -u)),
          f = n.add(new paper.Point(p, m)),
          h = n.add(new paper.Point(-p, -m))
        ;(roofsRectangles[e.data.id].segments[0].point = g),
          (roofsRectangles[e.data.join0.id].segments[1].point = f),
          (roofsRectangles[e.data.join0.id].segments[2].point = h),
          (roofsRectangles[e.data.id].segments[3].point = y),
          (roofsRectangles[e.data.id].closed = !0),
          (roofsRectangles[e.data.join0.id].closed = !0)
        let w = roofsRectangles3d[e.data.id],
          v = roofsRectangles3d[e.data.join0.id]
        ;(w.geometry.vertices[1].x = g.x),
          (w.geometry.vertices[1].z = g.y),
          (w.geometry.vertices[3].x = g.x),
          (w.geometry.vertices[3].z = g.y),
          (v.geometry.vertices[0].x = f.x),
          (v.geometry.vertices[0].z = f.y),
          (v.geometry.vertices[2].x = f.x),
          (v.geometry.vertices[2].z = f.y),
          (v.geometry.vertices[5].x = h.x),
          (v.geometry.vertices[5].z = h.y),
          (v.geometry.vertices[7].x = h.x),
          (v.geometry.vertices[7].z = h.y),
          (w.geometry.vertices[4].x = y.x),
          (w.geometry.vertices[4].z = y.y),
          (w.geometry.vertices[6].x = y.x),
          (w.geometry.vertices[6].z = y.y),
          (w.geometry.verticesNeedUpdate = !0),
          (v.geometry.verticesNeedUpdate = !0)
      }
    } else {
      let n = e.segments[0].point,
        l = e.segments[1].point,
        i = getAngleRadians(n, l),
        g = new Point(n.x + Math.sin(i) * t, n.y - Math.cos(i) * t),
        y = new Point(l.x + Math.sin(i) * t, l.y - Math.cos(i) * t),
        I = new Point(l.x - Math.sin(i) * t, l.y + Math.cos(i) * t),
        P = new Point(n.x - Math.sin(i) * t, n.y + Math.cos(i) * t)
      ;(roofsRectangles[e.data.id].segments[0].point = g),
        (roofsRectangles[e.data.id].segments[3].point = P),
        (roofsRectangles[e.data.id].closed = !0)
      let w = roofsRectangles3d[e.data.id]
      ;(w.geometry.vertices[1].x = g.x),
        (w.geometry.vertices[1].z = g.y),
        (w.geometry.vertices[3].x = g.x),
        (w.geometry.vertices[3].z = g.y),
        (w.geometry.vertices[4].x = P.x),
        (w.geometry.vertices[4].z = P.y),
        (w.geometry.vertices[6].x = P.x),
        (w.geometry.vertices[6].z = P.y),
        (w.geometry.verticesNeedUpdate = !0)
    }
    if (e.data.join1.id) {
      let l,
        o = e.segments[0].point,
        n = e.segments[1].point
      if (0 === e.data.join1.seg) {
        let a = Roofs[e.data.join1.id].data.width / 2
        l = Roofs[e.data.join1.id].segments[1].point
        let i = getAngleRadians(n, l),
          r = getAngleRadians(o, n),
          s = (i - r + 2 * Math.PI) % (2 * Math.PI)
        s /= 2
        let d = r + Math.PI / 2,
          c =
            Math.sin(r) * t +
            Math.sin(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * t),
          u =
            -(Math.cos(r) * t) -
            Math.cos(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * t),
          p =
            Math.sin(r) * a +
            Math.sin(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * a),
          m =
            -(Math.cos(r) * a) -
            Math.cos(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * a),
          g = n.add(new paper.Point(c, u)),
          y = n.add(new paper.Point(-c, -u)),
          f = n.add(new paper.Point(p, m)),
          h = n.add(new paper.Point(-p, -m))
        ;(roofsRectangles[e.data.id].segments[1].point = g),
          (roofsRectangles[e.data.join1.id].segments[0].point = f),
          (roofsRectangles[e.data.join1.id].segments[3].point = h),
          (roofsRectangles[e.data.id].segments[2].point = y),
          (roofsRectangles[e.data.id].closed = !0),
          (roofsRectangles[e.data.join1.id].closed = !0)
        let w = roofsRectangles3d[e.data.join1.id],
          v = roofsRectangles3d[e.data.id]
        ;(w.geometry.vertices[1].x = f.x),
          (w.geometry.vertices[1].z = f.y),
          (w.geometry.vertices[3].x = f.x),
          (w.geometry.vertices[3].z = f.y),
          (v.geometry.vertices[0].x = g.x),
          (v.geometry.vertices[0].z = g.y),
          (v.geometry.vertices[2].x = g.x),
          (v.geometry.vertices[2].z = g.y),
          (v.geometry.vertices[5].x = y.x),
          (v.geometry.vertices[5].z = y.y),
          (v.geometry.vertices[7].x = y.x),
          (v.geometry.vertices[7].z = y.y),
          (w.geometry.vertices[4].x = h.x),
          (w.geometry.vertices[4].z = h.y),
          (w.geometry.vertices[6].x = h.x),
          (w.geometry.vertices[6].z = h.y),
          (w.geometry.verticesNeedUpdate = !0),
          (v.geometry.verticesNeedUpdate = !0)
      } else {
        let a = Roofs[e.data.join1.id].data.width / 2
        l = Roofs[e.data.join1.id].segments[0].point
        let i = getAngleRadians(n, l),
          r = getAngleRadians(o, n),
          s = (i - r + 2 * Math.PI) % (2 * Math.PI)
        s /= 2
        let d = r + Math.PI / 2,
          c =
            Math.sin(r) * t +
            Math.sin(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * t),
          u =
            -(Math.cos(r) * t) -
            Math.cos(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * t),
          p =
            Math.sin(r) * a +
            Math.sin(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * a),
          m =
            -(Math.cos(r) * a) -
            Math.cos(d) * (Math.tan(s) * Math.atan(Math.PI / 2) * a),
          g = n.add(new paper.Point(c, u)),
          y = n.add(new paper.Point(-c, -u)),
          f = n.add(new paper.Point(p, m)),
          h = n.add(new paper.Point(-p, -m))
        ;(roofsRectangles[e.data.id].segments[1].point = g),
          (roofsRectangles[e.data.join1.id].segments[1].point = h),
          (roofsRectangles[e.data.join1.id].segments[2].point = f),
          (roofsRectangles[e.data.id].segments[2].point = y),
          (roofsRectangles[e.data.id].closed = !0),
          (roofsRectangles[e.data.join1.id].closed = !0)
        let w = roofsRectangles3d[e.data.join1.id],
          v = roofsRectangles3d[e.data.id]
        ;(v.geometry.vertices[0].x = g.x),
          (v.geometry.vertices[0].z = g.y),
          (v.geometry.vertices[2].x = g.x),
          (v.geometry.vertices[2].z = g.y),
          (v.geometry.vertices[5].x = y.x),
          (v.geometry.vertices[5].z = y.y),
          (v.geometry.vertices[7].x = y.x),
          (v.geometry.vertices[7].z = y.y),
          (w.geometry.verticesNeedUpdate = !0),
          (v.geometry.verticesNeedUpdate = !0)
      }
    } else {
      let n = e.segments[0].point,
        l = e.segments[1].point,
        i = getAngleRadians(n, l),
        g = new Point(n.x + Math.sin(i) * t, n.y - Math.cos(i) * t),
        y = new Point(l.x + Math.sin(i) * t, l.y - Math.cos(i) * t),
        I = new Point(l.x - Math.sin(i) * t, l.y + Math.cos(i) * t),
        P = new Point(n.x - Math.sin(i) * t, n.y + Math.cos(i) * t)
      ;(roofsRectangles[e.data.id].segments[1].point = y),
        (roofsRectangles[e.data.id].segments[2].point = I),
        (roofsRectangles[e.data.id].closed = !0)
      let w = roofsRectangles3d[e.data.id]
      ;(w.geometry.vertices[0].x = y.x),
        (w.geometry.vertices[0].z = y.y),
        (w.geometry.vertices[2].x = y.x),
        (w.geometry.vertices[2].z = y.y),
        (w.geometry.vertices[5].x = I.x),
        (w.geometry.vertices[5].z = I.y),
        (w.geometry.vertices[7].x = I.x),
        (w.geometry.vertices[7].z = I.y),
        (w.geometry.verticesNeedUpdate = !0)
    }
    let b = e.data.thickness / 2,
      x = e.data.rise / 2,
      R = roofsRectangles3d[e.data.id].geometry.vertices
    ;(R[0].y = b - x),
      (R[1].y = b - x),
      (R[4].y = b + x),
      (R[5].y = b + x),
      (R[2].y = -b - x),
      (R[3].y = -b - x),
      (R[6].y = -b + x),
      (R[7].y = -b + x),
      roofsRectangles3d[e.data.id].geometry.computeFlatVertexNormals(),
      (roofsRectangles3d[e.data.id].position.y =
        b + x + project.layers[e.data.level].data.height + e.data.startHeight)
  } else console.log("segments lenght was not 2")
}
function updateObjectPropertiesWindow() {
  if (selectedItem && selectedItem.data && selectedItem.data.type)
    switch (selectedItem.data.type) {
      case "furniture":
        setPropertiesView("furniture")
        try {
          ;(document.getElementById("objectId").innerText =
            selectedItem.data.id),
            (document.getElementById("objectName").innerText =
              camelCaseToSentence(selectedItem.data.fid)),
            (document.getElementById("furnitureAngleProp").innerText =
              selectedItem.data.angle.toFixed(2)),
            (document.getElementById("furnitureXProp").style.backgroundColor =
              "#4e4e4e"),
            (document.getElementById("furnitureXProp").value =
              clickableObjects[selectedItem.data.id].position.x.toFixed(3)),
            (document.getElementById("furnitureYProp").style.backgroundColor =
              "#4e4e4e"),
            (document.getElementById("furnitureYProp").value =
              clickableObjects[selectedItem.data.id].position.y.toFixed(3)),
            (document.getElementById("furnitureZProp").style.backgroundColor =
              "#4e4e4e"),
            (document.getElementById("furnitureZProp").value =
              clickableObjects[selectedItem.data.id].position.z.toFixed(3)),
            (document.getElementById(
              "furnitureWidthProp"
            ).style.backgroundColor = "#4e4e4e"),
            (document.getElementById("furnitureWidthProp").value = (
              clickableObjects[selectedItem.data.id].userData.width *
              clickableObjects[selectedItem.data.id].scale.x
            ).toFixed(3)),
            (document.getElementById(
              "furnitureDepthProp"
            ).style.backgroundColor = "#4e4e4e"),
            (document.getElementById("furnitureDepthProp").value = (
              clickableObjects[selectedItem.data.id].userData.depth *
              clickableObjects[selectedItem.data.id].scale.z
            ).toFixed(3)),
            (document.getElementById(
              "furnitureHeightProp"
            ).style.backgroundColor = "#4e4e4e"),
            (document.getElementById("furnitureHeightProp").value = (
              clickableObjects[selectedItem.data.id].userData.height *
              clickableObjects[selectedItem.data.id].scale.y
            ).toFixed(3)),
            (document.getElementById("flipX").checked =
              1 !== selectedItem.data.flipX),
            (document.getElementById("flipZ").checked =
              1 !== selectedItem.data.flipZ),
            (document.getElementById("furnitureLevelProp").innerText =
              selectedItem.data.level)
        } catch (e) {
          console.log("updateObjectPropertiesWindow : furniture : " + e)
        }
        break
      case "wallPath":
        setPropertiesView("wallPath"),
          (document.getElementById("wallIdHidden").value =
            selectedItem.data.id),
          (document.getElementById("wallIdProp").innerText =
            selectedItem.data.id),
          (document.getElementById("wallHeightProp").style.backgroundColor =
            "#4e4e4e"),
          (document.getElementById("wallHeightProp").value =
            selectedItem.data.height[0]),
          (document.getElementById("wallHeight0Prop").style.backgroundColor =
            "#4e4e4e"),
          (document.getElementById("wallHeight0Prop").value =
            selectedItem.data.height[0]),
          (document.getElementById("wallHeight1Prop").style.backgroundColor =
            "#4e4e4e"),
          (document.getElementById("wallHeight1Prop").value =
            selectedItem.data.height[1]),
          (document.getElementById("wallThicknessProp").style.backgroundColor =
            "#4e4e4e"),
          (document.getElementById("wallThicknessProp").value =
            selectedItem.data.thickness),
          (document.getElementById("wallLevelProp").innerText =
            selectedItem.data.level)
        break
      case "roofPath":
        setPropertiesView("roofPath"),
          (document.getElementById("roofIdHidden").value =
            selectedItem.data.id),
          (document.getElementById("roofIdProp").innerText =
            selectedItem.data.id),
          (document.getElementById("roofThicknessProp").style.backgroundColor =
            "#4e4e4e"),
          (document.getElementById("roofThicknessProp").value =
            selectedItem.data.thickness),
          (document.getElementById("roofRiseProp").style.backgroundColor =
            "#4e4e4e"),
          (document.getElementById("roofRiseProp").value =
            selectedItem.data.rise),
          (document.getElementById(
            "roofStartHeightProp"
          ).style.backgroundColor = "#4e4e4e"),
          (document.getElementById("roofStartHeightProp").value =
            selectedItem.data.startHeight),
          (document.getElementById("roofWidthProp").style.backgroundColor =
            "#4e4e4e"),
          (document.getElementById("roofWidthProp").value =
            selectedItem.data.width),
          (document.getElementById("roofLevelProp").innerText =
            selectedItem.data.level),
          updateExtraRoofInfo()
        break
      case "floor":
        setPropertiesView("floor"),
          (document.getElementById("floorIdProp").innerText =
            selectedItem.data.id),
          (document.getElementById("floorAreaProp").innerHTML =
            Math.abs(selectedItem.area / 1e4).toFixed(3) + " M&sup2;"),
          (document.getElementById("floorThicknessProp").innerText =
            selectedItem.data.thickness),
          (document.getElementById("floorLevelProp").innerText =
            selectedItem.data.level)
        break
      case "dimension":
        setPropertiesView("dimension"),
          (document.getElementById("dimensionIdProp").innerText =
            selectedItem.data.id),
          (document.getElementById("dimensionLengthProp").innerText =
            Dimensions[selectedItem.data.id].dimensionPath.length),
          (document.getElementById("dimensionAdjacentProp").innerText =
            Dimensions[selectedItem.data.id].dimensionPath.data.adjacent),
          (document.getElementById("dimensionLevelProp").innerText =
            Dimensions[selectedItem.data.id].dimensionPath.data.level)
        break
      case "text":
        setPropertiesView("text"),
          (document.getElementById("textIdProp").innerText =
            selectedItem.data.id),
          (document.getElementById("textValueProp").style.backgroundColor =
            "#4e4e4e"),
          (document.getElementById("textValueProp").value =
            selectedItem.data.value),
          (document.getElementById("textXProp").style.backgroundColor =
            "#4e4e4e"),
          (document.getElementById("textXProp").value =
            selectedItem.data.x.toFixed(3)),
          (document.getElementById("textYProp").style.backgroundColor =
            "#4e4e4e"),
          (document.getElementById("textYProp").value =
            selectedItem.data.y.toFixed(3)),
          (document.getElementById("textLevelProp").innerText =
            selectedItem.data.level)
        break
      case "planView":
        setPropertiesView("planView")
        break
      case "defaults":
        setPropertiesView("defaults")
        break
      default:
        alert(
          "set properties view for " +
            selectedItem.data.type +
            " not implemented"
        )
    }
  else setPropertiesView("")
}
function loadBackgroundImage(e) {
  try {
    let t = e.target || window.event.srcElement,
      o = t.files
    if (FileReader && o && o.length) {
      let a = new FileReader()
      ;(a.onload = function () {
        let e = new Image()
        ;(e.src = a.result),
          (e.onload = function () {
            ;(backgroundRaster = new paper.Raster(e)),
              (backgroundRaster.visible = !1),
              (backgroundRaster.onLoad = function () {
                deselectAll(),
                  (mouseMode = 0),
                  (backgroundRaster.data = { type: "background" }),
                  (backgroundRaster.data.angle = 0),
                  (backgroundRaster.position = new paper.Point(0, 0)),
                  guidesGroup.sendToBack(),
                  backgroundRaster.sendToBack(),
                  gridGroup.sendToBack(),
                  (backgroundRaster.visible = !0),
                  (backgroundRaster.selected = !0),
                  (backgroundRaster.opacity = 0.33),
                  (selectedItem = backgroundRaster)
                let e = new paper.Path.Rectangle(backgroundRaster.bounds)
                ;(e.data.type = "toolsRectangle"),
                  (e.strokeColor = "#b19064"),
                  (e.strokeWidth = 1),
                  (e.strokeScaling = !1),
                  (e.locked = !0),
                  (e.position = backgroundRaster.position),
                  (e.visible = !1),
                  e.bringToFront(),
                  (backgroundRaster.data.toolsRectangleInner = e),
                  (backgroundRaster.data.toolsRectangleInner.visible = !0),
                  (rotateIcon.visible = !1),
                  (resizeIcon.visible = !0),
                  (elevateIcon.visible = !1),
                  (heightIcon.visible = !1),
                  (toolsGroup.position = selectedItem.bounds.center),
                  (toolsGroup.visible = !0),
                  toolsGroup.bringToFront(),
                  (resizeIcon.data.level = project.activeLayer.data.id),
                  resizeIcon.bringToFront(),
                  (toolsGroup.data.level = project.activeLayer.data.id),
                  setToolMode("background"),
                  redrawGrid()
              })
          })
      }),
        a.readAsDataURL(o[0])
    } else console.log("upload not supported")
  } catch (e) {
    console.log("loadBackgroundImage : " + e)
  }
}
function setBgTemplateOpacity(e) {
  backgroundRaster && (backgroundRaster.opacity = parseFloat(e))
}
function deleteBackgroundImage() {
  backgroundRaster &&
    ((resizeIcon.visible = !1),
    backgroundRaster.data.toolsRectangleInner.remove(),
    (backgroundRaster.data.toolsRectangleInner = null),
    backgroundRaster.remove(),
    (backgroundRaster = null),
    clearFileInput(document.getElementById("backgroundImageFile")))
}
function setPropertiesView(e) {
  switch (
    ("background" != e && "background" === toolMode && setToolMode("pointer"),
    (document.getElementById("furniture3DModelPropertiesView").style.display =
      "none"),
    (document.getElementById("furniturePropertiesView").style.display = "none"),
    (document.getElementById("planViewPropertiesView").style.display = "none"),
    (document.getElementById("3dViewPropertiesView").style.display = "none"),
    (document.getElementById("wallPropertiesView").style.display = "none"),
    (document.getElementById("roofPropertiesView").style.display = "none"),
    (document.getElementById("floorPropertiesView").style.display = "none"),
    (document.getElementById("dimensionPropertiesView").style.display = "none"),
    (document.getElementById("textPropertiesView").style.display = "none"),
    (document.getElementById("defaultsPropertiesView").style.display = "none"),
    (document.getElementById("wallDefaultsPropertiesView").style.display =
      "none"),
    (document.getElementById("floorDefaultsPropertiesView").style.display =
      "none"),
    (document.getElementById("roofDefaultsPropertiesView").style.display =
      "none"),
    (document.getElementById("dimensionDefaultsPropertiesView").style.display =
      "none"),
    (document.getElementById("textDefaultsPropertiesView").style.display =
      "none"),
    (document.getElementById("levelPropertiesView").style.display = "none"),
    (document.getElementById("groundPropertiesView").style.display = "none"),
    e)
  ) {
    case "model3dMeta":
      document.getElementById("furniture3DModelPropertiesView").style.display =
        "block"
      break
    case "furniture":
      document.getElementById("furniturePropertiesView").style.display = "block"
      break
    case "planView":
      document.getElementById("planViewPropertiesView").style.display = "block"
      break
    case "3dView":
      document.getElementById("3dViewPropertiesView").style.display = "block"
      break
    case "wallPath":
      document.getElementById("wallPropertiesView").style.display = "block"
      break
    case "roofPath":
      document.getElementById("roofPropertiesView").style.display = "block"
      break
    case "floor":
      document.getElementById("floorPropertiesView").style.display = "block"
      break
    case "dimension":
      document.getElementById("dimensionPropertiesView").style.display = "block"
      break
    case "text":
      document.getElementById("textPropertiesView").style.display = "block"
      break
    case "level":
      document.getElementById("levelPropertiesView").style.display = "block"
      break
    case "ground":
      ;(document.getElementById("groundPropertiesView").style.display =
        "block"),
        (document.getElementById("groundWidthProp").value = groundWidth),
        (document.getElementById("groundLengthProp").value = groundLength)
      break
    case "defaults":
      document.getElementById("defaultsPropertiesView").style.display = "block"
      break
    case "wallDefaults":
      ;(document.getElementById("defaultWallHeightProp").style.backgroundColor =
        "#4e4e4e"),
        (document.getElementById("defaultWallHeightProp").value =
          defaultWallHeight),
        (document.getElementById(
          "defaultWallThicknessProp"
        ).style.backgroundColor = "#4e4e4e"),
        (document.getElementById("defaultWallThicknessProp").value =
          defaultWallThickness),
        (document.getElementById("wallDefaultsPropertiesView").style.display =
          "block")
      break
    case "floorDefaults":
      ;(document.getElementById(
        "defaultFloorThicknessProp"
      ).style.backgroundColor = "#4e4e4e"),
        (document.getElementById("defaultFloorThicknessProp").value =
          defaultFloorThickness),
        (document.getElementById("floorDefaultsPropertiesView").style.display =
          "block")
      break
    case "roofDefaults":
      ;(document.getElementById(
        "defaultRoofThicknessProp"
      ).style.backgroundColor = "#4e4e4e"),
        (document.getElementById("defaultRoofThicknessProp").value =
          defaultRoofThickness),
        (document.getElementById("defaultRoofWidthProp").style.backgroundColor =
          "#4e4e4e"),
        (document.getElementById("defaultRoofWidthProp").value =
          defaultRoofWidth),
        (document.getElementById("defaultRoofRiseProp").style.backgroundColor =
          "#4e4e4e"),
        (document.getElementById("defaultRoofRiseProp").value =
          defaultRoofRise),
        (document.getElementById(
          "defaultRoofStartHeightProp"
        ).style.backgroundColor = "#4e4e4e"),
        (document.getElementById("defaultRoofStartHeightProp").value =
          defaultRoofStartHeight),
        (document.getElementById("roofDefaultsPropertiesView").style.display =
          "block"),
        updateExtraDefaultRoofInfo()
      break
    case "dimensionDefaults":
      break
    case "textDefaults":
  }
}
function recalcAllWallCorners() {
  ;(wallCornersX = []),
    (wallCornersY = []),
    Object.keys(wallsRectangles).forEach(function (e) {
      let t = wallsRectangles[e]
      "object" == typeof t &&
        Walls[t.data.id].data.level === project.activeLayer.data.id &&
        t.segments.forEach(function (e) {
          wallCornersX.push(e.point.x), wallCornersY.push(e.point.y)
        })
    })
}
function recalcAllRoofCorners() {
  ;(roofCornersX = []),
    (roofCornersY = []),
    Object.keys(roofsRectangles).forEach(function (e) {
      let t = roofsRectangles[e]
      "object" == typeof t &&
        Roofs[t.data.id].data.level === project.activeLayer.data.id &&
        t.segments.forEach(function (e) {
          roofCornersX.push(e.point.x), roofCornersY.push(e.point.y)
        })
    })
}
function recalcAllUnjoinedWallSegments(e) {
  ;(unjoinedWallSegments = []),
    Object.keys(Walls).forEach(function (t) {
      let o = Walls[t]
      "object" == typeof o &&
        o.data.id !== e &&
        2 === o.segments.length &&
        (o.data.join0.id ||
          unjoinedWallSegments.push({
            x: o.segments[0].point.x,
            y: o.segments[0].point.y,
            seg: 0,
            id: o.data.id,
          }),
        o.data.join1.id ||
          unjoinedWallSegments.push({
            x: o.segments[1].point.x,
            y: o.segments[1].point.y,
            seg: 1,
            id: o.data.id,
          }))
    })
}
function recalcAllUnjoinedRoofSegments(e) {
  ;(unjoinedRoofSegments = []),
    Object.keys(Roofs).forEach(function (t) {
      let o = Roofs[t]
      "object" == typeof o &&
        o.data.id !== e &&
        2 === o.segments.length &&
        (o.data.join0.id ||
          unjoinedRoofSegments.push({
            x: o.segments[0].point.x,
            y: o.segments[0].point.y,
            seg: 0,
            id: o.data.id,
          }),
        o.data.join1.id ||
          unjoinedRoofSegments.push({
            x: o.segments[1].point.x,
            y: o.segments[1].point.y,
            seg: 1,
            id: o.data.id,
          }))
    })
}
function recalcAllWallSegmentsOnOtherLevels(e, t) {
  ;(allWallSegments = []),
    Object.keys(Walls).forEach(function (o) {
      let a = Walls[o]
      "object" == typeof a &&
        a.data.id !== e &&
        a.data.level != t &&
        2 === a.segments.length &&
        (allWallSegments.push({
          x: a.segments[0].point.x,
          y: a.segments[0].point.y,
          seg: 0,
          id: a.data.id,
        }),
        allWallSegments.push({
          x: a.segments[1].point.x,
          y: a.segments[1].point.y,
          seg: 1,
          id: a.data.id,
        }))
    })
}
function recalcAllRoofSegmentsOnOtherLevels(e, t) {
  ;(allRoofSegments = []),
    Object.keys(Roofs).forEach(function (o) {
      let a = Roofs[o]
      "object" == typeof a &&
        a.data.id !== e &&
        a.data.level != t &&
        2 === a.segments.length &&
        (allRoofSegments.push({
          x: a.segments[0].point.x,
          y: a.segments[0].point.y,
          seg: 0,
          id: a.data.id,
        }),
        allRoofSegments.push({
          x: a.segments[1].point.x,
          y: a.segments[1].point.y,
          seg: 1,
          id: a.data.id,
        }))
    })
}
function drawDimension(e, t, o) {
  let a = t.subtract(e),
    n = new paper.Path().removeOnMove()
  ;(n.style = { strokeColor: "white", strokeWidth: 1, strokeScaling: !1 }),
    n.moveTo(e),
    n.lineBy(a.normalize(o).rotate(-90)),
    n.lineBy(a.normalize(7.5).rotate(-270)),
    n.lineBy(a.normalize(10).rotate(-225)),
    n.lineBy(a.normalize(20).rotate(-45)),
    n.lineBy(a.normalize(10).rotate(-225)),
    n.lineBy(a.normalize(a.length / 2))
  let l = n.lastSegment.point
  n.lineBy(a.normalize(a.length / 2)),
    n.lineBy(a.normalize(10).rotate(-225)),
    n.lineBy(a.normalize(20).rotate(-45)),
    n.lineBy(a.normalize(10).rotate(-225)),
    n.lineBy(a.normalize(7.5).rotate(-90)),
    n.lineBy(a.normalize(o).rotate(90))
  let i = new paper.PointText({}).removeOnMove()
  Math.abs(a.angle) > 90
    ? ((i.fontFamily = "Courier New"),
      (i.fillColor = "white"),
      (i.point = l.add(a.normalize(-8).rotate(-90))),
      (i.justification = "center"),
      (i.fontSize = screenScale / 1.5),
      i.rotate(180 + a.angle))
    : ((i.fontFamily = "Courier New"),
      (i.fillColor = "white"),
      (i.point = l.add(a.normalize(8).rotate(-90))),
      (i.justification = "center"),
      (i.fontSize = screenScale / 1.5),
      i.rotate(a.angle))
  let r = a.length
  i.content = Math.floor(1e3 * r) / 1e3
}
function updateTextX(e) {
  try {
    ;(Texts[editingTextId].point.x = parseInt(e)),
      (Texts[editingTextId].data.x = parseInt(e)),
      (plan.texts[editingTextId].data.x = parseInt(e)),
      updatePlanHistory(
        plan,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        editingTextId,
        null,
        null,
        null,
        null
      )
  } catch (e) {
    console.log("updateTextX : " + e)
  }
}
function updateTextY(e) {
  try {
    ;(Texts[editingTextId].point.y = parseInt(e)),
      (Texts[editingTextId].data.y = parseInt(e)),
      (plan.texts[editingTextId].data.y = parseInt(e)),
      updatePlanHistory(
        plan,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        editingTextId,
        null,
        null,
        null,
        null
      )
  } catch (e) {
    console.log("updateTextX : " + e)
  }
}
function clickColor(e) {
  let t = parseInt(e.replace("#", "0x"))
  ;(ground.material.color = new THREE.Color(t)), render()
}
function updateWallThickness(e) {
  let t = parseInt(document.getElementById("wallIdHidden").value)
  console.dir(Walls[t]),
    (Walls[t].data.thickness = parseInt(e)),
    (plan.walls[t].wallPath.data.thickness = parseInt(e)),
    updatePlanHistory(
      plan,
      null,
      null,
      null,
      null,
      t,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ),
    relinkWallReferences(project.activeLayer.data.id)
}
function updateWallHeight(e) {
  let t = parseInt(document.getElementById("wallIdHidden").value)
  ;(Walls[t].data.height = [parseInt(e), parseInt(e)]),
    (plan.walls[t].wallPath.data.height = [parseInt(e), parseInt(e)]),
    updatePlanHistory(
      plan,
      null,
      null,
      null,
      null,
      t,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ),
    relinkWallReferences(project.activeLayer.data.id)
}
function updateWallHeight0(e) {
  let t = parseInt(document.getElementById("wallIdHidden").value)
  ;(Walls[t].data.height[0] = parseInt(e)),
    (plan.walls[t].wallPath.data.height[0] = parseInt(e)),
    updatePlanHistory(
      plan,
      null,
      null,
      null,
      null,
      t,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ),
    relinkWallReferences(project.activeLayer.data.id)
}
function updateWallHeight1(e) {
  let t = parseInt(document.getElementById("wallIdHidden").value)
  ;(Walls[t].data.height[1] = parseInt(e)),
    (plan.walls[t].wallPath.data.height[1] = parseInt(e)),
    updatePlanHistory(
      plan,
      null,
      null,
      null,
      null,
      t,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ),
    relinkWallReferences(project.activeLayer.data.id)
}
function updateDefaultWallHeight(e) {
  ;(defaultWallHeight = parseInt(e)), scene.remove(wallHelper3dCube)
  let t = new THREE.BoxGeometry(
      defaultWallThickness,
      defaultWallHeight,
      defaultWallThickness
    ),
    o = new THREE.MeshStandardMaterial({
      color: 0,
      transparent: !0,
      opacity: 0.25,
    })
  ;(wallHelper3dCube = new THREE.Mesh(t, o)),
    (wallHelper3dCube.position.y =
      defaultWallHeight / 2 + project.activeLayer.data.height),
    (wallHelper3dCube.visible = !1),
    scene.add(wallHelper3dCube)
}
function updateDefaultWallThickness(e) {
  ;(defaultWallThickness = parseInt(e)), scene.remove(wallHelper3dCube)
  let t = new THREE.BoxGeometry(
      defaultWallThickness,
      defaultWallHeight,
      defaultWallThickness
    ),
    o = new THREE.MeshStandardMaterial({
      color: 0,
      transparent: !0,
      opacity: 0.25,
    })
  ;(wallHelper3dCube = new THREE.Mesh(t, o)),
    (wallHelper3dCube.position.y =
      defaultWallHeight / 2 + project.activeLayer.data.height),
    (wallHelper3dCube.visible = !1),
    scene.add(wallHelper3dCube)
}
function updateRoofWidth(e) {
  let t = parseInt(document.getElementById("roofIdHidden").value)
  ;(Roofs[t].data.width = parseInt(e)),
    (plan.roofs[t].roofPath.data.width = parseInt(e)),
    updatePlanHistory(
      plan,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      t,
      null
    ),
    relinkRoofReferences(project.activeLayer.data.id),
    updateExtraRoofInfo()
}
function updateRoofThickness(e) {
  let t = parseInt(document.getElementById("roofIdHidden").value)
  ;(Roofs[t].data.thickness = parseInt(e)),
    (plan.roofs[t].roofPath.data.thickness = parseInt(e)),
    updatePlanHistory(
      plan,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      t,
      null
    ),
    relinkRoofReferences(project.activeLayer.data.id),
    updateExtraRoofInfo()
}
function updateRoofRise(e) {
  let t = parseInt(document.getElementById("roofIdHidden").value)
  ;(Roofs[t].data.rise = parseInt(e)),
    (plan.roofs[t].roofPath.data.rise = parseInt(e)),
    updatePlanHistory(
      plan,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      t,
      null
    ),
    relinkRoofReferences(project.activeLayer.data.id),
    updateExtraRoofInfo()
}
function updateRoofStartHeight(e) {
  let t = parseInt(document.getElementById("roofIdHidden").value)
  ;(Roofs[t].data.startHeight = parseInt(e)),
    (plan.roofs[t].roofPath.data.startHeight = parseInt(e)),
    updatePlanHistory(
      plan,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      t,
      null
    ),
    relinkRoofReferences(project.activeLayer.data.id),
    updateExtraRoofInfo()
}
function updateDefaultRoofThickness(e) {
  ;(defaultRoofThickness = parseInt(e)), scene.remove(roofHelper3dCube)
  let t = new THREE.BoxGeometry(
      defaultRoofWidth,
      defaultRoofThickness,
      defaultRoofWidth
    ),
    o = new THREE.MeshStandardMaterial({
      color: 0,
      transparent: !0,
      opacity: 0.25,
    })
  ;(roofHelper3dCube = new THREE.Mesh(t, o)),
    (roofHelper3dCube.position.y =
      defaultRoofThickness / 2 + project.activeLayer.data.height),
    (roofHelper3dCube.visible = !1),
    scene.add(roofHelper3dCube),
    updateExtraDefaultRoofInfo()
}
function updateDefaultRoofRise(e) {
  ;(defaultRoofRise = parseInt(e)), scene.remove(roofHelper3dCube)
  let t = new THREE.BoxGeometry(
      defaultRoofWidth,
      defaultRoofThickness,
      defaultRoofWidth
    ),
    o = new THREE.MeshStandardMaterial({
      color: 0,
      transparent: !0,
      opacity: 0.25,
    })
  ;(roofHelper3dCube = new THREE.Mesh(t, o)),
    (roofHelper3dCube.position.y =
      defaultRoofThickness / 2 + project.activeLayer.data.height),
    (roofHelper3dCube.visible = !1),
    scene.add(roofHelper3dCube),
    updateExtraDefaultRoofInfo()
}
function updateDefaultRoofStartHeight(e) {
  ;(defaultRoofStartHeight = parseInt(e)), scene.remove(roofHelper3dCube)
  let t = new THREE.BoxGeometry(
      defaultRoofWidth,
      defaultRoofThickness,
      defaultRoofWidth
    ),
    o = new THREE.MeshStandardMaterial({
      color: 0,
      transparent: !0,
      opacity: 0.25,
    })
  ;(roofHelper3dCube = new THREE.Mesh(t, o)),
    (roofHelper3dCube.position.y =
      defaultRoofThickness / 2 +
      project.activeLayer.data.height +
      defaultRoofStartHeight),
    (roofHelper3dCube.visible = !1),
    scene.add(roofHelper3dCube),
    updateExtraDefaultRoofInfo()
}
function updateDefaultRoofWidth(e) {
  ;(defaultRoofWidth = parseInt(e)), scene.remove(roofHelper3dCube)
  let t = new THREE.BoxGeometry(
      defaultRoofWidth,
      defaultRoofThickness,
      defaultRoofWidth
    ),
    o = new THREE.MeshStandardMaterial({
      color: 0,
      transparent: !0,
      opacity: 0.25,
    })
  ;(roofHelper3dCube = new THREE.Mesh(t, o)),
    (roofHelper3dCube.position.y =
      defaultRoofThickness / 2 + project.activeLayer.data.height),
    (roofHelper3dCube.visible = !1),
    scene.add(roofHelper3dCube),
    updateExtraDefaultRoofInfo()
}
function updateExtraDefaultRoofInfo() {
  let e = document.getElementById("defaultRoofWidthProp").value,
    t = document.getElementById("defaultRoofRiseProp").value,
    o = Math.hypot(e, t),
    a = (180 * Math.atan2(parseFloat(t), parseFloat(e))) / Math.PI
  ;(document.getElementById("defaultRafterLengthProp").innerText =
    o.toFixed(2)),
    (document.getElementById("defaultRoofPitchProp").innerText = a.toFixed(2))
}
function updateExtraRoofInfo() {
  let e = document.getElementById("roofWidthProp").value,
    t = document.getElementById("roofRiseProp").value,
    o = Math.hypot(e, t),
    a = (180 * Math.atan2(parseFloat(t), parseFloat(e))) / Math.PI
  ;(document.getElementById("rafterLengthProp").innerText = o.toFixed(2)),
    (document.getElementById("roofPitchProp").innerText = a.toFixed(2))
}
function updateDefaultFloorThickness() {
  alert("not implemented yet")
}
function adjustAmbientLightBrightness(e) {
  ;(ambientLight.intensity = e), render()
}
function adjustDirLightBrightness(e) {
  ;(dirLight.intensity = e), render()
}
function adjustHemiLightBrightness(e) {
  ;(hemiLight.intensity = e), render()
}
function newLevel() {
  console.log("new level button pressed"), deselectAll()
  let e = Object.keys(levelButtons).length,
    t = document.createElement("BUTTON")
  if (
    (t.classList.add("levelBtn"),
    (t.innerHTML = "Level " + e),
    (t.value = e),
    (t.style.top = levelButtons[0].style.top),
    (t.style.bottom = levelButtons[0].style.bottom),
    (t.style.left = levelButtons[0].style.left),
    "planView" != UILayout && (t.style.marginBottom = "26px"),
    (t.style.marginLeft = 104 * e + "px"),
    "3dView" != UILayout &&
      ((levelButtons[0].style.display = "block"),
      (t.style.display = "block"),
      t.addEventListener(
        "click",
        function () {
          setLevel(this.value)
        },
        !1
      )),
    (floorsGroup[e] = new paper.Group()),
    (roofsGroup[e] = new paper.Group()),
    (wallsGroup[e] = new paper.Group()),
    (dimensionsGroup[e] = new paper.Group()),
    (furnitureGroup[e] = new paper.Group()),
    (textsGroup[e] = new paper.Group()),
    !project.layers["level" + e])
  ) {
    new Layer({
      name: "level" + e,
      data: { id: e.toString(), height: e * defaultWallHeight },
    })
    plan.levels[e] = {
      id: e.toString(),
      height: parseInt(
        plan.levels[e] ? plan.levels[e].height : e * defaultWallHeight
      ),
    }
  }
  project.layers["level" + e].addChild(floorsGroup[e]),
    project.layers["level" + e].addChild(roofsGroup[e]),
    project.layers["level" + e].addChild(wallsGroup[e]),
    project.layers["level" + e].addChild(dimensionsGroup[e]),
    project.layers["level" + e].addChild(furnitureGroup[e]),
    project.layers["level" + e].addChild(textsGroup[e]),
    project.layers["level" + e].addChild(guidesGroup),
    (levelButtons[e] = t),
    document.body.appendChild(t),
    setLevel(e)
}
function addNewLevel(e) {
  let t = document.createElement("BUTTON")
  if (
    (t.classList.add("levelBtn"),
    (t.innerHTML = "Level " + e),
    (t.value = e),
    levelButtons
      ? ((t.style.top = levelButtons[0].style.top),
        (t.style.bottom = levelButtons[0].style.bottom),
        (t.style.left = levelButtons[0].style.left))
      : ((levelButtons = {}),
        "planView" === UILayout
          ? ((t.style.left = "286px"), (t.style.bottom = "30px"))
          : ((t.style.left = "354px"),
            (t.style.bottom = "50%"),
            (t.style.marginBottom = "26px"))),
    "planView" != UILayout && (t.style.marginBottom = "26px"),
    (t.style.marginLeft = 104 * e + "px"),
    "3dView" != UILayout &&
      ((t.style.display = "block"),
      t.addEventListener(
        "click",
        function () {
          setLevel(this.value)
        },
        !1
      )),
    (floorsGroup[e] = new paper.Group()),
    (roofsGroup[e] = new paper.Group()),
    (wallsGroup[e] = new paper.Group()),
    (dimensionsGroup[e] = new paper.Group()),
    (furnitureGroup[e] = new paper.Group()),
    (textsGroup[e] = new paper.Group()),
    !project.layers["level" + e])
  ) {
    new Layer({
      name: "level" + e,
      data: {
        id: e.toString(),
        height: parseInt(
          plan.levels[e] ? plan.levels[e].height : e * defaultWallHeight
        ),
      },
    })
    plan.levels[e] = {
      id: e.toString(),
      height: parseInt(
        plan.levels[e] ? plan.levels[e].height : e * defaultWallHeight
      ),
    }
  }
  project.layers["level" + e].addChild(floorsGroup[e]),
    project.layers["level" + e].addChild(roofsGroup[e]),
    project.layers["level" + e].addChild(wallsGroup[e]),
    project.layers["level" + e].addChild(dimensionsGroup[e]),
    project.layers["level" + e].addChild(furnitureGroup[e]),
    project.layers["level" + e].addChild(textsGroup[e]),
    project.layers["level" + e].addChild(guidesGroup),
    (levelButtons[e] = t),
    document.body.appendChild(t)
}
function setLevel(e) {
  deselectAll(),
    setToolMode("pointer"),
    otherLayerWallsRasters &&
      otherLayerWallsRasters.length > 0 &&
      (otherLayerWallsRasters.forEach(function (e) {
        e.remove()
      }),
      (otherLayerWallsRasters = [])),
    otherLayerFurnitureRasters &&
      otherLayerFurnitureRasters.length > 0 &&
      (otherLayerFurnitureRasters.forEach(function (e) {
        e.remove()
      }),
      (otherLayerFurnitureRasters = []))
  let t = 0
  project.layers.forEach(function (o) {
    o.data &&
      o.data.id.toString() !== e.toString() &&
      (wallsGroup[o.data.id] &&
        (otherLayerWallsRasters.push(
          wallsGroup[o.data.id].rasterize(view.resolution, !1)
        ),
        (otherLayerWallsRasters[otherLayerWallsRasters.length - 1].data.level =
          o.data.id)),
      furnitureGroup[o.data.id] &&
        (otherLayerFurnitureRasters.push(
          furnitureGroup[o.data.id].rasterize(view.resolution, !1)
        ),
        (otherLayerFurnitureRasters[
          otherLayerFurnitureRasters.length - 1
        ].data.level = o.data.id))),
      (o.visible = !1),
      (levelButtons[t].style.backgroundColor = "#4e4e4e"),
      (t += 1)
  }),
    (levelButtons[e].style.backgroundColor = "#787878"),
    project.layers["level" + e].activate(),
    project.activeLayer.addChild(gridGroup),
    otherLayerWallsRasters.forEach(function (e) {
      project.activeLayer.addChild(e), e.sendToBack(), (e.opacity = 0.25)
    }),
    otherLayerFurnitureRasters.forEach(function (e) {
      project.activeLayer.addChild(e), e.sendToBack(), (e.opacity = 0.2)
    }),
    project.activeLayer.addChild(floorHelperPath),
    project.activeLayer.addChild(roofHelperRectangle),
    project.activeLayer.addChild(wallHelperRectangle),
    project.activeLayer.addChild(toolsGroup),
    project.activeLayer.addChild(dimensionHelperPath),
    project.activeLayer.addChild(guidesGroup),
    gridGroup.sendToBack(),
    backgroundRaster &&
      (project.activeLayer.addChild(backgroundRaster),
      backgroundRaster.sendToBack(),
      gridGroup.sendToBack()),
    (project.activeLayer.visible = !0),
    (wallHelper3dCube.position.y =
      defaultWallHeight / 2 + project.activeLayer.data.height),
    (roofHelper3dCube.position.y =
      defaultRoofThickness / 2 + project.activeLayer.data.height),
    setPropertiesView("level"),
    (document.getElementById("levelIdProp").innerHTML =
      project.activeLayer.data.id),
    (document.getElementById("levelNameProp").innerHTML =
      project.activeLayer.name),
    (document.getElementById("levelHeightProp").style.backgroundColor =
      "#4e4e4e"),
    (document.getElementById("levelHeightProp").value =
      project.activeLayer.data.height)
}
function updateLevelHeight(e) {
  ;(project.activeLayer.data.height = parseInt(e)),
    (plan.levels[project.activeLayer.data.id].height = parseInt(e)),
    relinkWallReferences(project.activeLayer.data.id),
    relinkRoofReferences(project.activeLayer.data.id)
}
function validatePlusNumber(e, t) {
  let o = /^[0-9]*\.?[0-9]+$/
  e.value && null !== e.value.match(o)
    ? ((e.style.backgroundColor = "#4e4e4e"), t(e.value), e.blur())
    : ((e.style.backgroundColor = "#ff8888"), e.focus())
}
function validatePlusOrMinusNumber(e, t) {
  let o = /^[-]?[0-9]*\.?[0-9]+$/
  e.value && null !== e.value.match(o)
    ? ((e.style.backgroundColor = "#4e4e4e"), t(e.value), e.blur())
    : ((e.style.backgroundColor = "#ff8888"), e.focus())
}
function validateText(e, t, o) {
  t.value.length > 0 && t.value.length < 100
    ? ((t.style.backgroundColor = "#4e4e4e"),
      o(t.value),
      13 === e.keyCode && (t.blur(), (Texts[editingTextId].selected = !1)))
    : ((t.style.backgroundColor = "#ff8888"), t.focus())
}
function updateTextValue(e) {
  try {
    ;(Texts[editingTextId].content = e),
      (Texts[editingTextId].data.value = e),
      (plan.texts[editingTextId].data.value = e),
      updatePlanHistory(
        plan,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        editingTextId,
        null,
        null,
        null,
        null
      )
  } catch (e) {
    console.log("updateTextX : " + e)
  }
}
function redrawLevelsFloors(e) {
  Object.keys(Floors).forEach(function (t) {
    let o = Floors[t]
    "object" == typeof o && o.data.level === e && redrawFloor(o)
  })
}
function redrawFloor(e) {
  scene.remove(Floors3d[e.data.id])
  let t = new THREE.Shape()
  t.moveTo(e.segments[0].point.x, e.segments[0].point.y),
    e.segments.forEach(function (e) {
      t.lineTo(e.point.x, e.point.y)
    })
  let o = new THREE.ExtrudeBufferGeometry(t, extrudeSettings),
    a = new THREE.Mesh(o, floorMaterial)
  a.position.set(
    0,
    project.layers["level" + e.data.level].data.height + e.data.thickness,
    0
  ),
    (a.rotation.x = Math.PI / 2)
  let n,
    l = new THREE.Box3().setFromObject(a),
    i = null,
    r = !1
  Object.keys(Furniture).forEach(function (t) {
    if (Furniture[t].useMask && Furniture[t].data.level === e.data.level) {
      let o = new THREE.Box3().setFromObject(maskObjects[t])
      if (l.intersectsBox(o)) {
        r = !0
        let s = new ThreeBSP(maskObjects[t])
        if (null === i) i = new ThreeBSP(a)
        else {
          let d = new THREE.Mesh(n)
          i = new ThreeBSP(d)
        }
        n = i.subtract(s).toBufferGeometry()
      }
    }
  }),
    r && (a = new THREE.Mesh(n, floorMaterial)),
    a.geometry.computeVertexNormals(),
    (a.scale.x = 0.9999),
    (a.scale.z = 0.9999),
    scene.add(a),
    (a.name = "floor" + e.data.id),
    (clickableObjects["floor" + e.data.id] = a),
    (Floors3d[e.data.id] = a),
    render()
}
function camelCaseToSentence(e) {
  try {
    ;(e = e.replace(/([A-Z])/g, " $1")),
      (e = e.replace(/_/g, " ")),
      (e = e.replace(/\b\w/g, function (e) {
        return e.toUpperCase()
      })),
      (e = e.charAt(0).toUpperCase() + e.slice(1))
  } catch (e) {}
  return e
}
function showFurnitureLicenseSummary(e) {
  modalModel3dFurnitureId = e
  let t = camelCaseToSentence(e)
  document.getElementById("model3dName").innerText = t
  let o = furnitureItems[e].author
  document.getElementById("model3dAuthor").innerText = o
  let a = ""
  switch (furnitureItems[e].license) {
    case "Free Art License 1.3":
      a =
        "<a href='http://artlibre.org/licence/lal/en/' target='_blank' rel='noreferrer'>" +
        furnitureItems[e].license +
        "</a>"
      break
    case "CC-0":
      a =
        "<a href='https://creativecommons.org/publicdomain/zero/1.0/' target='_blank' rel='noreferrer'>" +
        furnitureItems[e].license +
        "</a>"
      break
    case "CC BY 3.0":
      a =
        "<a href='https://creativecommons.org/licenses/by/3.0/' target='_blank' rel='noreferrer'>" +
        furnitureItems[e].license +
        "</a>"
      break
    case "CC BY 4.0":
      a =
        "<a href='https://creativecommons.org/licenses/by/4.0/' target='_blank' rel='noreferrer'>" +
        furnitureItems[e].license +
        "</a>"
      break
    default:
      a = furnitureItems[e].license
  }
  ;(document.getElementById("model3dLicense").innerHTML = a),
    (document.getElementById("model3dLargeThumb").src =
      "objects/" + e + ".png"),
    setPropertiesView("model3dMeta")
}
function setModalModelDescription(e) {
  let t = camelCaseToSentence(e)
  document.getElementById("model3dNameModal").innerText = t
  let o = furnitureItems[e].author
  document.getElementById("model3dAuthorModal").innerText = o
  let a = ""
  switch (furnitureItems[e].license) {
    case "Free Art License 1.3":
      a =
        "<a href='http://artlibre.org/licence/lal/en/' target='_blank' rel='noreferrer'>" +
        furnitureItems[e].license +
        "</a>"
      break
    case "CC-0":
      a =
        "<a href='https://creativecommons.org/publicdomain/zero/1.0/' target='_blank' rel='noreferrer'>" +
        furnitureItems[e].license +
        "</a>"
      break
    case "CC BY 3.0":
      a =
        "<a href='https://creativecommons.org/licenses/by/3.0/' target='_blank' rel='noreferrer'>" +
        furnitureItems[e].license +
        "</a>"
      break
    case "CC BY 4.0":
      a =
        "<a href='https://creativecommons.org/licenses/by/4.0/' target='_blank' rel='noreferrer'>" +
        furnitureItems[e].license +
        "</a>"
      break
    default:
      a = furnitureItems[e].license
  }
  document.getElementById("model3dLicenseModal").innerHTML = a
}
function hideMouseIndicators() {
  mouseIndicatorX &&
    ((modalsActive = !0),
    (mouseIndicatorX.style.display = "none"),
    (mouseIndicatorY.style.display = "none"))
}
function showMouseIndicators() {
  mouseIndicatorX &&
    "3dView" != UILayout &&
    ((modalsActive = !1),
    (mouseIndicatorX.style.display = "block"),
    (mouseIndicatorY.style.display = "block"))
}
function loadExamplePlan() {
  hideMouseIndicators(),
    closeAllModals(),
    $("#loadingModal").show(),
    (loadingProgressTxt = "Loading Example Plan"),
    (document.getElementById("modalLoadingDataInfo").innerHTML =
      loadingProgressTxt),
    resetPlan(),
    (planHistory = []),
    (planHistoryPosition = 0),
    planHistory.push(JSON.stringify(plan)),
    setToolMode("pointer")
  try {
    ;(loadingProgressTxt = "Plan decoding\n" + loadingProgressTxt),
      (document.getElementById("modalLoadingDataInfo").innerHTML =
        loadingProgressTxt),
      $.ajax({
        url: "plans/examplePlanMM1.dat",
        type: "GET",
        contentType: "application/json",
        success: function (e) {
          drawPlan(JSON.parse(e))
        },
        error: function (e) {
          console.log("loadExamplePlan : ajax : " + e)
        },
      })
  } catch (e) {
    console.log("loadExamplePlan : " + e)
  }
}
function loadPlan(e) {
  window.location.href = "/edit/" + e
}
function updateFurniturePosX(e) {
  if (selectedItem.data.id) {
    let t = parseFloat(e)
    ;(selectedItem.position.x = t),
      (toolsGroup.position.x = t),
      (selectedItem.data.toolsRectangleInner.position.x = t),
      (clickableObjects[selectedItem.data.id].position.x = t),
      maskObjects[selectedItem.data.id] &&
        (maskObjects[selectedItem.data.id].position.x = t),
      (tween = new TWEEN.Tween(controls.target)
        .to(clickableObjects[selectedItem.data.id].position, 100)
        .onUpdate(render)
        .start()),
      updatePlanHistory(
        plan,
        null,
        selectedItem.data.id,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      )
  }
}
function updateFurniturePosZ(e) {
  if (selectedItem.data.id) {
    let t = parseFloat(e)
    ;(selectedItem.position.y = t),
      (toolsGroup.position.y = t),
      (selectedItem.data.toolsRectangleInner.position.y = t),
      (clickableObjects[selectedItem.data.id].position.z = t),
      maskObjects[selectedItem.data.id] &&
        (maskObjects[selectedItem.data.id].position.z = t),
      (tween = new TWEEN.Tween(controls.target)
        .to(clickableObjects[selectedItem.data.id].position, 100)
        .onUpdate(render)
        .start()),
      updatePlanHistory(
        plan,
        null,
        selectedItem.data.id,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      )
  }
}
function updateFurniturePosY(e) {
  if (selectedItem.data.id) {
    let t = parseFloat(e)
    ;(clickableObjects[selectedItem.data.id].position.y = t),
      maskObjects[selectedItem.data.id] &&
        (maskObjects[selectedItem.data.id].position.y = t),
      (tween = new TWEEN.Tween(controls.target)
        .to(clickableObjects[selectedItem.data.id].position, 100)
        .onUpdate(render)
        .start()),
      updatePlanHistory(
        plan,
        null,
        selectedItem.data.id,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      )
  }
}
function updateFurnitureWidth(e) {
  if (selectedItem.data.id) {
    let t = parseFloat(e)
    ;(clickableObjects[selectedItem.data.id].scale.x =
      t / clickableObjects[selectedItem.data.id].userData.width),
      maskObjects[selectedItem.data.id] &&
        (maskObjects[selectedItem.data.id].scale.x =
          clickableObjects[selectedItem.data.id].scale.x)
    let o = selectedItem.position,
      a = selectedItem.rotation
    ;(selectedItem.rotation = 0),
      (selectedItem.bounds.width = Math.abs(t)),
      selectedItem.data.toolsRectangleInner &&
        selectedItem.data.toolsRectangleInner.remove()
    let n = new paper.Path.Rectangle(selectedItem.bounds)
    ;(n.data.type = "toolsRectangle"),
      (n.strokeColor = "#b19064"),
      (n.strokeWidth = 1),
      (n.strokeScaling = !1),
      (n.locked = !0),
      (selectedItem.data.toolsRectangleInner = n),
      n.rotate(selectedItem.data.angle),
      (rotateIcon.position =
        selectedItem.data.toolsRectangleInner.segments[1].point),
      (resizeIcon.position =
        selectedItem.data.toolsRectangleInner.segments[3].point),
      (heightIcon.position =
        selectedItem.data.toolsRectangleInner.segments[2].point),
      (elevateIcon.position =
        selectedItem.data.toolsRectangleInner.segments[0].point),
      (plan.furniture[selectedItem.data.id].width = Math.abs(t)),
      (selectedItem.rotation = a),
      (selectedItem.position = o),
      (selectedItem.data.toolsRectangleInner.position = o),
      updatePlanHistory(
        plan,
        null,
        selectedItem.data.id,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ),
      render(),
      (rotateIcon.position =
        selectedItem.data.toolsRectangleInner.segments[1].point),
      (resizeIcon.position =
        selectedItem.data.toolsRectangleInner.segments[3].point),
      (heightIcon.position =
        selectedItem.data.toolsRectangleInner.segments[2].point),
      (elevateIcon.position =
        selectedItem.data.toolsRectangleInner.segments[0].point)
  }
}
function updateFurnitureDepth(e) {
  if (selectedItem.data.id) {
    let t = parseFloat(e)
    ;(clickableObjects[selectedItem.data.id].scale.z =
      t / clickableObjects[selectedItem.data.id].userData.depth),
      maskObjects[selectedItem.data.id] &&
        (maskObjects[selectedItem.data.id].scale.z =
          clickableObjects[selectedItem.data.id].scale.z)
    let o = selectedItem.position,
      a = selectedItem.rotation
    ;(selectedItem.rotation = 0),
      (selectedItem.bounds.height = Math.abs(t)),
      selectedItem.data.toolsRectangleInner &&
        selectedItem.data.toolsRectangleInner.remove()
    let n = new paper.Path.Rectangle(selectedItem.bounds)
    ;(n.data.type = "toolsRectangle"),
      (n.strokeColor = "#b19064"),
      (n.strokeWidth = 1),
      (n.strokeScaling = !1),
      (n.locked = !0),
      (selectedItem.data.toolsRectangleInner = n),
      n.rotate(selectedItem.data.angle),
      (rotateIcon.position =
        selectedItem.data.toolsRectangleInner.segments[1].point),
      (resizeIcon.position =
        selectedItem.data.toolsRectangleInner.segments[3].point),
      (heightIcon.position =
        selectedItem.data.toolsRectangleInner.segments[2].point),
      (elevateIcon.position =
        selectedItem.data.toolsRectangleInner.segments[0].point),
      (plan.furniture[selectedItem.data.id].depth = Math.abs(t)),
      (selectedItem.rotation = a),
      (selectedItem.position = o),
      (selectedItem.data.toolsRectangleInner.position = o),
      updatePlanHistory(
        plan,
        null,
        selectedItem.data.id,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ),
      render(),
      (rotateIcon.position =
        selectedItem.data.toolsRectangleInner.segments[1].point),
      (resizeIcon.position =
        selectedItem.data.toolsRectangleInner.segments[3].point),
      (heightIcon.position =
        selectedItem.data.toolsRectangleInner.segments[2].point),
      (elevateIcon.position =
        selectedItem.data.toolsRectangleInner.segments[0].point)
  }
}
function updateFurnitureHeight(e) {
  if (selectedItem.data.id) {
    let t = parseFloat(e)
    ;(clickableObjects[selectedItem.data.id].scale.y =
      t / clickableObjects[selectedItem.data.id].userData.height),
      maskObjects[selectedItem.data.id] &&
        (maskObjects[selectedItem.data.id].scale.y =
          clickableObjects[selectedItem.data.id].scale.y),
      render(),
      updatePlanHistory(
        plan,
        null,
        selectedItem.data.id,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ),
      render()
  }
}
function flipX(e) {
  e
    ? ((selectedItem.data.flipX = -1),
      (clickableObjects[selectedItem.data.id].scale.x *= -1),
      (plan.furniture[selectedItem.data.id].flipX = -1))
    : ((selectedItem.data.flipX = 1),
      (clickableObjects[selectedItem.data.id].scale.x *= -1),
      (plan.furniture[selectedItem.data.id].flipX = 1)),
    flipImageDataX(selectedItem),
    updatePlanHistory(
      plan,
      null,
      selectedItem.data.id,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    )
}
function flipZ(e) {
  e
    ? ((selectedItem.data.flipZ = -1),
      (clickableObjects[selectedItem.data.id].scale.z *= -1),
      (plan.furniture[selectedItem.data.id].flipZ = -1))
    : ((selectedItem.data.flipZ = 1),
      (clickableObjects[selectedItem.data.id].scale.z *= -1),
      (plan.furniture[selectedItem.data.id].flipZ = 1)),
    flipImageDataZ(selectedItem),
    updatePlanHistory(
      plan,
      null,
      selectedItem.data.id,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ),
    render()
}
function flipImageDataX(e) {
  for (
    let t = e.canvas.getContext("2d"),
      o = t.getImageData(0, 0, e.width, e.height),
      a = o.data,
      n = a.slice(),
      l = 0;
    l < e.height;
    l++
  )
    for (let i = 0; i < e.width; i++) {
      let r = l * e.width * 4 + 4 * i,
        s = l * e.width * 4 + 4 * (e.width - i)
      ;(a[r] = n[s]),
        (a[r + 1] = n[s + 1]),
        (a[r + 2] = n[s + 2]),
        (a[r + 3] = n[s + 3])
    }
  t.putImageData(o, 0, 0), render(), redrawGrid()
}
function flipImageDataZ(e) {
  for (
    let t = e.canvas.getContext("2d"),
      o = t.getImageData(0, 0, e.width, e.height),
      a = o.data,
      n = a.slice(),
      l = 0;
    l < e.height;
    l++
  )
    for (let i = 0; i < e.width; i++) {
      let r = l * e.width * 4 + 4 * i,
        s = e.height * e.width * 4 - l * e.width * 4 + 4 * i
      ;(a[r] = n[s]),
        (a[r + 1] = n[s + 1]),
        (a[r + 2] = n[s + 2]),
        (a[r + 3] = n[s + 3])
    }
  t.putImageData(o, 0, 0), redrawGrid()
}
function setDepthWriteMode(e) {
  ;(wallMaterial.depthWrite = e),
    (roofMaterial.depthWrite = e),
    (floorMaterial.depthWrite = e),
    (plan.depthWrite = e),
    render()
}
function setSortObjectsMode(e) {
  ;(renderer.sortObjects = e), (plan.sortObjects = e), render()
}
function setSunAzimuth(e) {
  azimuth = parseFloat(e)
  let t = Math.PI * (inclination - 0.5),
    o = 2 * Math.PI * (azimuth - 0.5),
    a = 4e5
  ;(sunSphere.position.x = a * Math.cos(o)),
    (sunSphere.position.y = a * Math.sin(o) * Math.sin(t)),
    (sunSphere.position.z = a * Math.sin(o) * Math.cos(t)),
    sky.material.uniforms.sunPosition.value.copy(sunSphere.position),
    dirLight.position.copy(sunSphere.position),
    render()
}
function setSunIncline(e) {
  inclination = parseFloat(e)
  let t = Math.PI * (inclination - 0.5),
    o = 2 * Math.PI * (azimuth - 0.5),
    a = 4e5
  ;(sunSphere.position.x = a * Math.cos(o)),
    (sunSphere.position.y = a * Math.sin(o) * Math.sin(t)),
    (sunSphere.position.z = a * Math.sin(o) * Math.cos(t)),
    sky.material.uniforms.sunPosition.value.copy(sunSphere.position),
    dirLight.position.copy(sunSphere.position),
    render()
}
function flipBackgroundTemplateX() {
  backgroundRaster && flipImageDataX(backgroundRaster)
}
function flipBackgroundTemplateZ() {
  backgroundRaster && flipImageDataZ(backgroundRaster)
}
function copyShareLink() {
  let e = document.getElementById("shareLinkUrl")
  e.select(), document.execCommand("copy")
}
function copyShareLink3d() {
  let e = document.getElementById("shareLinkUrl3d")
  e.select(), document.execCommand("copy")
}
function copyShareLinkPlan() {
  let e = document.getElementById("shareLinkUrlPlan")
  e.select(), document.execCommand("copy")
}
function exportToObj() {
  try {
    let e = new THREE.OBJExporter(),
      t = new THREE.Object3D()
    Object.keys(wallsRectangles3d).forEach(function (e) {
      let o = wallsRectangles3d[e]
      "object" == typeof o &&
        (o.visible ? t.add(o.clone()) : t.add(maskObjectsApplied[e].clone()))
    }),
      Object.keys(roofsRectangles3d).forEach(function (e) {
        let o = roofsRectangles3d[e]
        "object" == typeof o &&
          (o.visible
            ? t.add(o.clone())
            : t.add(maskObjectsAppliedRoof[e].clone()))
      }),
      Object.keys(Floors3d).forEach(function (e) {
        let o = Floors3d[e]
        "object" == typeof o && t.add(o.clone())
      })
    let o = e.parse(t),
      a = document.createElement("a")
    for (
      a.download = "HomeIdea3D.obj",
        a.innerHTML = "Download File",
        a.href = window.URL.createObjectURL(
          new Blob([o], { type: "text/plain" })
        ),
        a.onclick = destroyClickedElement,
        a.style.display = "none",
        document.body.appendChild(a),
        a.click();
      t.children.length > 0;

    )
      t.remove(t.children[0])
  } catch (e) {
    console.dir(e)
  }
}
function rgba2hex(e) {
  return (
    (e = e.match(
      /^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i
    )),
    e && 4 === e.length
      ? "0x" +
        ("0" + parseInt(e[1], 10).toString(16)).slice(-2) +
        ("0" + parseInt(e[2], 10).toString(16)).slice(-2) +
        ("0" + parseInt(e[3], 10).toString(16)).slice(-2)
      : ""
  )
}
function setInterfacePropertiesFromPlan(e) {
  e.wallDiffuse &&
    ((wallMaterial.color = new THREE.Color(e.wallDiffuse)),
    "default" === UILayout &&
      $("#wallDiffuse").minicolors(
        "value",
        "#" + wallMaterial.color.getHexString()
      )),
    e.wallOpacity &&
      ((wallMaterial.opacity = parseFloat(e.wallOpacity)),
      "default" === UILayout &&
        $("#wallDiffuse").minicolors("opacity", parseFloat(e.wallOpacity))),
    e.wallSpecular &&
      ((wallMaterial.specular = new THREE.Color(e.wallSpecular)),
      "default" === UILayout &&
        $("#wallSpecular").minicolors(
          "value",
          "#" + wallMaterial.specular.getHexString()
        )),
    e.roofDiffuse &&
      ((roofMaterial.color = new THREE.Color(e.roofDiffuse)),
      "default" === UILayout &&
        $("#roofDiffuse").minicolors(
          "value",
          "#" + roofMaterial.color.getHexString()
        )),
    e.roofOpacity &&
      ((roofMaterial.opacity = parseFloat(e.roofOpacity)),
      "default" === UILayout &&
        $("#roofDiffuse").minicolors("opacity", parseFloat(e.roofOpacity))),
    e.roofSpecular &&
      ((roofMaterial.specular = new THREE.Color(e.roofSpecular)),
      "default" === UILayout &&
        $("#roofSpecular").minicolors(
          "value",
          "#" + roofMaterial.specular.getHexString()
        )),
    e.floorDiffuse &&
      ((floorMaterial.color = new THREE.Color(e.floorDiffuse)),
      "default" === UILayout &&
        $("#floorDiffuse").minicolors(
          "value",
          "#" + floorMaterial.color.getHexString()
        )),
    e.floorOpacity &&
      ((floorMaterial.opacity = parseFloat(e.floorOpacity)),
      "default" === UILayout &&
        $("#floorDiffuse").minicolors("opacity", parseFloat(e.floorOpacity))),
    e.floorSpecular &&
      ((floorMaterial.specular = new THREE.Color(e.floorSpecular)),
      "default" === UILayout &&
        $("#floorSpecular").minicolors(
          "value",
          "#" + floorMaterial.specular.getHexString()
        )),
    e.groundDiffuse &&
      (e.groundDiffuse.startsWith("rgba")
        ? (groundMat.color = new THREE.Color(
            parseInt(rgba2hex(e.groundDiffuse))
          ))
        : (groundMat.color = new THREE.Color(parseInt("0x" + e.groundDiffuse))),
      "default" === UILayout &&
        $("#groundDiffuse").minicolors(
          "value",
          "#" + groundMat.color.getHexString()
        )),
    e.groundOpacity &&
      ((groundMat.opacity = parseFloat(e.groundOpacity)),
      "default" === UILayout &&
        $("#groundDiffuse").minicolors("opacity", parseFloat(e.groundOpacity))),
    e.groundSpecular &&
      (e.groundSpecular.startsWith("rgba")
        ? (groundMat.specular = new THREE.Color(
            parseInt(rgba2hex(e.groundSpecular))
          ))
        : (groundMat.specular = new THREE.Color(
            parseInt("0x" + e.groundSpecular)
          )),
      "default" === UILayout &&
        $("#groundSpecular").minicolors(
          "value",
          "#" + groundMat.specular.getHexString()
        )),
    e.depthWrite
      ? ((document.getElementById("depthWriteMode").checked = e.depthWrite),
        setDepthWriteMode(e.depthWrite))
      : ((document.getElementById("depthWriteMode").checked = !1),
        setDepthWriteMode(!1)),
    e.sortObjects
      ? ((document.getElementById("sortObjectsMode").checked = e.sortObjects),
        setSortObjectsMode(e.sortObjects))
      : ((document.getElementById("sortObjectsMode").checked = !1),
        setSortObjectsMode(!1)),
    e.azimuth &&
      ((azimuth = e.azimuth),
      (document.getElementById("sunAzimuth").value = azimuth),
      setSunAzimuth(e.azimuth)),
    e.inclination &&
      ((inclination = e.inclination),
      (document.getElementById("sunIncline").value = inclination),
      setSunIncline(e.inclination)),
    render()
}
function loadInViewThumbs() {
  $("img[realsrc]").each(function (e) {
    let t = $(this)
    t.position().top <
      $("#catalogItems").scrollTop() + $("#catalogItems").height() &&
      (t.attr("src", t.attr("realsrc")), t.removeAttr("realsrc"))
  })
}
function recenter3dview() {
  let e = 1,
    t = 0,
    o = 0,
    a = 0,
    n = 0,
    l = 0,
    i = 0,
    r = 0,
    s = 0,
    d = 0
  Object.keys(wallsRectangles3d).forEach(function (e) {
    let r = wallsRectangles3d[e]
    if ("object" == typeof r) {
      let s = new THREE.Box3().setFromObject(r)
      s.min.x < t && (t = s.min.x),
        s.max.x > o && (o = s.max.x),
        s.min.z < a && (a = s.min.z),
        s.max.z > n && (n = s.max.z),
        s.min.y < l && (l = s.min.y),
        s.max.y > i && (i = s.max.y)
    }
  }),
    Object.keys(roofsRectangles3d).forEach(function (e) {
      let r = roofsRectangles3d[e]
      if ("object" == typeof r) {
        let s = new THREE.Box3().setFromObject(r)
        s.min.x < t && (t = s.min.x),
          s.max.x > o && (o = s.max.x),
          s.min.z < a && (a = s.min.z),
          s.max.z > n && (n = s.max.z),
          s.min.y < l && (l = s.min.y),
          s.max.y > i && (i = s.max.y)
      }
    }),
    Object.keys(Floors3d).forEach(function (e) {
      let r = Floors3d[e]
      if ("object" == typeof r) {
        let s = new THREE.Box3().setFromObject(r)
        s.min.x < t && (t = s.min.x),
          s.max.x > o && (o = s.max.x),
          s.min.z < a && (a = s.min.z),
          s.max.z > n && (n = s.max.z),
          s.min.y < l && (l = s.min.y),
          s.max.y > i && (i = s.max.y)
      }
    }),
    (e = i - l),
    (r = t + (o - t) / 2),
    (d = a + (n - a) / 2),
    (s = e / 2),
    new TWEEN.Tween(camera.position)
      .to({ x: -954, y: 360, z: 517 }, 500)
      .onUpdate(render)
      .start(),
    new TWEEN.Tween(controls.target)
      .to({ x: r, y: s, z: d }, 500)
      .onUpdate(render)
      .start()
}
function recenterPlanView() {
  let e = { x: 0, y: 0 },
    t = { x: 1e3, y: 1e3 },
    o = { x: -1e3, y: -1e3 }
  Object.keys(Furniture).forEach(function (a) {
    let n = Furniture[a]
    "object" == typeof n &&
      ((e.x += Furniture[a].position.x),
      (e.y += Furniture[a].position.y),
      (t.x = Math.min(t.x, Furniture[a].position.x)),
      (t.y = Math.min(t.y, Furniture[a].position.y)),
      (o.x = Math.max(o.x, Furniture[a].position.x)),
      (o.y = Math.max(o.y, Furniture[a].position.y)))
  }),
    Object.keys(Floors).forEach(function (a) {
      let n = Floors[a]
      "object" == typeof n &&
        ((e.x += Floors[a].position.x),
        (e.y += Floors[a].position.y),
        (t.x = Math.min(t.x, Floors[a].position.x)),
        (t.y = Math.min(t.y, Floors[a].position.y)),
        (o.x = Math.max(o.x, Floors[a].position.x)),
        (o.y = Math.max(o.y, Floors[a].position.y)))
    }),
    Object.keys(Walls).forEach(function (a) {
      let n = Walls[a]
      "object" == typeof n &&
        ((e.x += Walls[a].position.x),
        (e.y += Walls[a].position.y),
        (t.x = Math.min(t.x, Walls[a].position.x)),
        (t.y = Math.min(t.y, Walls[a].position.y)),
        (o.x = Math.max(o.x, Walls[a].position.x)),
        (o.y = Math.max(o.y, Walls[a].position.y)))
    }),
    Object.keys(Roofs).forEach(function (a) {
      let n = Roofs[a]
      "object" == typeof n &&
        ((e.x += Roofs[a].position.x),
        (e.y += Roofs[a].position.y),
        (t.x = Math.min(t.x, Roofs[a].position.x)),
        (t.y = Math.min(t.y, Roofs[a].position.y)),
        (o.x = Math.max(o.x, Roofs[a].position.x)),
        (o.y = Math.max(o.y, Roofs[a].position.y)))
    }),
    (zoomRectangle = new paper.Path.Rectangle(t, o))
  let a = paper.view.bounds.width * paper.view.bounds.height,
    n = Math.max(
      zoomRectangle.bounds.width * zoomRectangle.bounds.height * 2,
      1e5
    ),
    l = Math.sqrt(a / n)
  ;(focusPoint = paper.view.center), (focusPoint.zoom = paper.view.zoom)
  let i = zoomRectangle.bounds.center.x,
    r = zoomRectangle.bounds.center.y
  tween = new TWEEN.Tween(focusPoint)
    .to({ x: i, y: r, zoom: l }, 500)
    .onUpdate(function () {
      reFocus()
    })
    .start()
}
function gotoPlanView() {
  ;(window.location.hash = "#" + fragment + "_plan"), location.reload()
}
function goto3dView() {
  ;(window.location.hash = "#" + fragment + "_3d"), location.reload()
}
function updateGroundWidth(e) {
  ;(groundWidth = parseInt(e)), scene.remove(clickableObjects[0])
  let t = new THREE.PlaneBufferGeometry(100 * groundWidth, 100 * groundLength)
  ;(groundMat = new THREE.MeshPhongMaterial({ transparent: !0, opacity: 1 })),
    (groundMat.color = new THREE.Color(2304293)),
    console.log(
      "groundDiffuse = " + document.getElementById("groundDiffuse").value
    ),
    (groundMat.specular = new THREE.Color(15925148)),
    (ground = new THREE.Mesh(t, groundMat)),
    (ground.rotation.x = -Math.PI / 2),
    (ground.position.y = -2),
    (ground.name = "groundLayer"),
    scene.add(ground),
    (clickableObjects[0] = ground),
    render()
}
function updateGroundLength(e) {
  ;(groundLength = parseInt(e)), scene.remove(clickableObjects[0])
  let t = new THREE.PlaneBufferGeometry(100 * groundWidth, 100 * groundLength)
  ;(groundMat = new THREE.MeshPhongMaterial({ transparent: !0, opacity: 1 })),
    (groundMat.color = new THREE.Color(2304293)),
    console.log(
      "groundDiffuse = " + document.getElementById("groundDiffuse").value
    ),
    (groundMat.specular = new THREE.Color(15925148)),
    (ground = new THREE.Mesh(t, groundMat)),
    (ground.rotation.x = -Math.PI / 2),
    (ground.position.y = -2),
    (ground.name = "groundLayer"),
    scene.add(ground),
    (clickableObjects[0] = ground),
    render()
}





// ========================================================
// [MM] HEY HEY HEY -- all functions have been loaded above
// now for the logic/execution instructions runtime baby...

// variables to use
let mouseMode = 0,
  toolMode = "pointer",
  selectedItem,
  defaultCursor = "default",
  // deselectAll,
  UILayout = "default",
  toolsGroup,
  gridGroup,
  furnitureGroup = {},
  wallsGroup = {},
  roofsGroup = {},
  floorsGroup = {},
  dimensionsGroup = {},
  textsGroup = {},
  guidesGroup,
  defaultWallHeight = 265,
  defaultWallThickness = 20,
  defaultRoofThickness = 25,
  defaultRoofWidth = 350,
  defaultRoofRise = 300,
  defaultRoofStartHeight = 0,
  defaultFloorThickness = 25,
  rotateIcon,
  resizeIcon,
  elevateIcon,
  heightIcon,
  planView,
  rulerLeft,
  rulerLeftCtx,
  rulerBottom,
  rulerBottomCtx,
  mouseIndicatorX,
  mouseIndicatorY,
  fullscreenPlanViewBtn,
  fullscreen3dViewBtn,
  modalCloseBtnAbout,
  modalCloseBtnModel3d,
  movePointIcons = [],
  movePointIconSelectedId = 0,
  selectedMovePointIcon,
  wallPath,
  wallIdCounter = 0,
  wallsRectangles = {},
  wallsRectangles3d = {},
  wallHelperPath,
  wallHelperRectangle,
  startedDrawingWalls = !1,
  floorPath,
  floorIdCounter = 0,
  floorHelperPath,
  startedDrawingFloor = !1,
  roofPath,
  roofIdCounter = 0,
  roofHelperPath,
  roofsRectangles = {},
  roofsRectangles3d = {},
  roofHelperRectangle,
  startedDrawingRoofs = !1,
  dimensionPath,
  dimensionIdCounter = 0,
  dimensionHelperPath,
  startedDrawingDimension = !1,
  stretchYPath,
  stretchYStartHeight = 0,
  elevatePath,
  elevating = !1,
  elevateStartHeight = 0,
  dragging = !1,
  scalingXY = !1,
  scalingY = !1,
  rotating = !1,
  wallHelper3dCube,
  roofHelper3dCube,
  // redrawGrid,
  xLines = [],
  yLines = [],
  furnitureToLoadCount = 0,
  loadedFurnitureCount = 0,
  tools,
  offsetMousePoint,
  ctrlKeyPressed = !1,
  scaleFactor = 1.1,
  cumulclick = 0,
  screenScale,
  ratioX = 0,
  ratioY = 0,
  lastNewWallSegmentClick = Date.now(),
  lastNewRoofSegmentClick = Date.now(),
  lastNewFloorSegmentClick = Date.now(),
  furnitureItems = {},
  canvas3d,
  camera,
  renderer,
  container,
  scene,
  mesh,
  ground,
  groundMat,
  hemiLight,
  dirLight,
  ambientLight,
  pointLight,
  controls,
  wallMaterial,
  floorMaterial,
  roofMaterial,
  tween,
  raycaster,
  mouse,
  clickableObjects = {},
  clickableObjectsCounter = -1,
  maskObjects = {},
  maskObjectsApplied = {},
  maskObjectsAppliedRoof = {},
  verticalSlider,
  verticalSliderDragging,
  horizontalSliderLeft,
  horizontalSliderLeftDragging,
  horizontalSliderRight,
  horizontalSliderRightDragging,
  furnitureDragDiv,
  draggingFurnitureIcon = !1,
  draggingFurnitureId = -1,
  draggingFurnitureAngle = 0,
  draggingFurnitureRectangle,
  wallCornersX = [],
  wallCornersY = [],
  roofCornersX = [],
  roofCornersY = [],
  snapPoint,
  unjoinedWallSegments = [],
  allWallSegments = [],
  unjoinedRoofSegments = [],
  allRoofSegments = [],
  snapPointOverride = {},
  textPath,
  textIdCounter = 0,
  startedDrawingText = !1,
  editingTextId = -1,
  Furniture = {},
  Walls = {},
  Roofs = {},
  Floors = {},
  Floors3d = {},
  Dimensions = {},
  Texts = {},
  plan = {}
;(plan.furniture = {}),
  (plan.walls = {}),
  (plan.roofs = {}),
  (plan.floors = {}),
  (plan.levels = {}),
  (plan.levels[0] = { id: 0, height: 0 }),
  (plan.dimensions = {}),
  (plan.texts = {}),
  (plan.verticalGuides = {}),
  (plan.horizontalGuides = {})
let planHistory = [],
  planHistoryPosition = 0
planHistory.push(JSON.stringify(plan))
let backgroundRaster,
  backgroundRasterRatioX = 1,
  backgroundRasterRatioY = 1,
  idToCopyPaste = -1,
  lastPasteX = 0,
  lastPasteY = 0,
  progressBar,
  focusPoint,
  selectedItem3DAxes,
  activeLevel,
  levelButtons,
  otherLayerWallsRasters = [],
  otherLayerFurnitureRasters = [],
  extrudeSettings = {
    steps: 1,
    depth: defaultFloorThickness,
    bevelEnabled: !1,
  },
  modalModel3dFurnitureId = -1,
  model3dObjectRef,
  model3dViewOpen = !1,
  model3dScene,
  model3dSceneRenderer,
  model3dViewContainer,
  model3dSceneCamera,
  model3dViewCanvas,
  loadingProgressTxt = "",
  lastMousePoint,
  dltext,
  zoomRectangle,
  sky,
  sunSphere,
  inclination,
  azimuth,
  examplePlan,
  fLineX,
  fLineY,
  fLineZ,
  modalsActive = !1,
  shareLinkUrl = "",
  shareLinkUrl3d = "",
  shareLinkUrlPlan = "",
  verticalGuides = {},
  horizontalGuides = {},
  selectedGuideId,
  guideCounter = 0,
  draggingNewGuide = !1,
  snapTolerance = 1,
  groundWidth = 5e3,
  groundLength = 5e3


// ========================================================
// [MM] LOOKIE LOOKIE HERE -- time for DOM manipulation
// with jQuery :( -- time to convert to React + Next.JS

/*
$(document).ready(function () {
  switch (UILayout) {
    case "3dView":
      ;(readOnly = !0),
        (document.getElementById("planView").style.display = "none"),
        (document.getElementById("view3d").style.top = "0px"),
        (document.getElementById("view3d").style.bottom = "0px"),
        (document.getElementById("view3d").style.left = "0px"),
        (document.getElementById("view3d").style.right = "0px"),
        (document.getElementById("view3d").style.display = "block"),
        (document.getElementById("catalogView").style.display = "none"),
        (document.getElementById("verticalSlider").style.display = "none"),
        (document.getElementById("horizontalSliderLeft").style.display =
          "none"),
        (document.getElementById("horizontalSliderRight").style.display =
          "none"),
        (document.getElementById("fullscreenPlanViewBtn").style.display =
          "none"),
        (document.getElementById("fullscreen3dViewBtn").style.right = "6px"),
        (document.getElementById("fullscreen3dViewBtn").style.bottom = "6px"),
        (document.getElementById("fullscreen3dViewBtn").style.opacity = "0.33"),
        (document.getElementById("fullscreen3dViewBtn").style.display =
          "block"),
        (document.getElementById("propertiesView").style.display = "none"),
        (document.getElementById("rulerLeft").style.display = "none"),
        (document.getElementById("rulerBottom").style.display = "none"),
        (document.getElementById("mouseIndicatorX").style.display = "none"),
        (document.getElementById("mouseIndicatorY").style.display = "none"),
        (document.getElementById("overlayLogo3dView").style.display = "block"),
        (document.getElementById("overlayMenu3dView").style.display = "block")
      break
    case "planView":
      ;(readOnly = !0),
        (document.getElementById("planView").style.top = "0px"),
        (document.getElementById("planView").style.bottom = "0px"),
        (document.getElementById("planView").style.left = "0px"),
        (document.getElementById("planView").style.right = "0px"),
        (document.getElementById("planView").style.display = "block"),
        (document.getElementById("view3d").style.display = "none"),
        (document.getElementById("catalogView").style.display = "none"),
        (document.getElementById("verticalSlider").style.display = "none"),
        (document.getElementById("horizontalSliderLeft").style.display =
          "none"),
        (document.getElementById("horizontalSliderRight").style.display =
          "none"),
        (document.getElementById("fullscreenPlanViewBtn").style.right = "6px"),
        (document.getElementById("fullscreenPlanViewBtn").style.bottom =
          "30px"),
        (document.getElementById("fullscreenPlanViewBtn").style.opacity =
          "0.33"),
        (document.getElementById("fullscreenPlanViewBtn").style.display =
          "block"),
        (document.getElementById("fullscreen3dViewBtn").style.display = "none"),
        (document.getElementById("propertiesView").style.display = "none"),
        (document.getElementById("rulerLeft").style.top = "0px"),
        (document.getElementById("rulerLeft").style.bottom = "20px"),
        (document.getElementById("rulerLeft").style.left = "0px"),
        (document.getElementById("rulerLeft").style.display = "block"),
        (document.getElementById("rulerBottom").style.marginTop = "-20px"),
        (document.getElementById("rulerBottom").style.bottom = "0px"),
        (document.getElementById("rulerBottom").style.left = "30px"),
        (document.getElementById("rulerBottom").style.right = "0px"),
        (document.getElementById("rulerBottom").style.display = "block"),
        (document.getElementById("mouseIndicatorX").style.top = "0px"),
        (document.getElementById("mouseIndicatorX").style.left = "0px"),
        (document.getElementById("mouseIndicatorX").style.width = "1px"),
        (document.getElementById("mouseIndicatorX").style.bottom = "0px"),
        (document.getElementById("mouseIndicatorX").style.display = "block"),
        (document.getElementById("mouseIndicatorY").style.top = "0px"),
        (document.getElementById("mouseIndicatorY").style.left = "0px"),
        (document.getElementById("mouseIndicatorY").style.right = "0px"),
        (document.getElementById("mouseIndicatorY").style.height = "1px"),
        (document.getElementById("mouseIndicatorY").style.display = "block"),
        (document.getElementById("overlayLogoPlanView").style.display =
          "block"),
        (document.getElementById("overlayMenuPlanView").style.display = "block")
      break
    default:
      ;(UILayout = "default"),
        (document.getElementById("planView").style.top = "54px"),
        (document.getElementById("planView").style.bottom = "50%"),
        (document.getElementById("planView").style.left = "318px"),
        (document.getElementById("planView").style.right = "0px"),
        (document.getElementById("planView").style.display = "block"),
        (document.getElementById("view3d").style.top = "50%"),
        (document.getElementById("view3d").style.bottom = "0px"),
        (document.getElementById("view3d").style.left = "318px"),
        (document.getElementById("view3d").style.right = "0px"),
        (document.getElementById("view3d").style.display = "block"),
        (document.getElementById("catalogView").style.top = "54px"),
        (document.getElementById("catalogView").style.left = "0px"),
        (document.getElementById("catalogView").style.width = "316px"),
        (document.getElementById("catalogView").style.height = "605px"),
        (document.getElementById("catalogView").style.display = "block"),
        (document.getElementById("verticalSlider").style.top = "54px"),
        (document.getElementById("verticalSlider").style.bottom = "0px"),
        (document.getElementById("verticalSlider").style.left = "316px"),
        (document.getElementById("verticalSlider").style.width = "4px"),
        (document.getElementById("verticalSlider").style.display = "block"),
        (document.getElementById("horizontalSliderLeft").style.top = "659px"),
        (document.getElementById("horizontalSliderLeft").style.left = "0px"),
        (document.getElementById("horizontalSliderLeft").style.width = "316px"),
        (document.getElementById("horizontalSliderLeft").style.height = "4px"),
        (document.getElementById("horizontalSliderLeft").style.display =
          "block"),
        (document.getElementById("horizontalSliderRight").style.top = "50%"),
        (document.getElementById("horizontalSliderRight").style.left = "318px"),
        (document.getElementById("horizontalSliderRight").style.width = "100%"),
        (document.getElementById("horizontalSliderRight").style.height = "4px"),
        (document.getElementById("horizontalSliderRight").style.display =
          "block"),
        (document.getElementById("fullscreenPlanViewBtn").style.right = "6px"),
        (document.getElementById("fullscreenPlanViewBtn").style.top = "50%"),
        (document.getElementById("fullscreenPlanViewBtn").style.opacity =
          "0.33"),
        (document.getElementById("fullscreenPlanViewBtn").style.marginTop =
          "-58px"),
        (document.getElementById("fullscreenPlanViewBtn").style.display =
          "block"),
        (document.getElementById("fullscreen3dViewBtn").style.right = "6px"),
        (document.getElementById("fullscreen3dViewBtn").style.bottom = "6px"),
        (document.getElementById("fullscreen3dViewBtn").style.opacity = "0.33"),
        (document.getElementById("fullscreen3dViewBtn").style.display =
          "block"),
        (document.getElementById("propertiesView").style.top = "660px"),
        (document.getElementById("propertiesView").style.left = "0px"),
        (document.getElementById("propertiesView").style.width = "306px"),
        (document.getElementById("propertiesView").style.bottom = "0px"),
        (document.getElementById("propertiesView").style.display = "block"),
        (document.getElementById("rulerLeft").style.top = "54px"),
        (document.getElementById("rulerLeft").style.bottom = "50px"),
        (document.getElementById("rulerLeft").style.left = "318px"),
        (document.getElementById("rulerLeft").style.display = "block"),
        (document.getElementById("rulerBottom").style.top = "50%"),
        (document.getElementById("rulerBottom").style.marginTop = "-20px"),
        (document.getElementById("rulerBottom").style.bottom = "0px"),
        (document.getElementById("rulerBottom").style.left = "318px"),
        (document.getElementById("rulerBottom").style.right = "0px"),
        (document.getElementById("rulerBottom").style.display = "block"),
        (document.getElementById("mouseIndicatorX").style.top = "54px"),
        (document.getElementById("mouseIndicatorX").style.left = "318px"),
        (document.getElementById("mouseIndicatorX").style.width = "1px"),
        (document.getElementById("mouseIndicatorX").style.bottom = "50%"),
        (document.getElementById("mouseIndicatorX").style.display = "block"),
        (document.getElementById("mouseIndicatorY").style.top = "57px"),
        (document.getElementById("mouseIndicatorY").style.left = "318px"),
        (document.getElementById("mouseIndicatorY").style.right = "0px"),
        (document.getElementById("mouseIndicatorY").style.height = "1px"),
        (document.getElementById("mouseIndicatorY").style.display = "block")
  }
  "default" === UILayout &&
    $("#catalogItems").scroll(function () {
      loadInViewThumbs()
    }),
    (focusPoint = new paper.Point(0, 0)),
    (raycaster = new THREE.Raycaster()),
    (mouse = new THREE.Vector2()),
    $.ajax({
      url: "objects/objects-1.json",
      type: "GET",
      contentType: "application/json",
      success: function (e) {
        if (((furnitureItems = e), "default" === UILayout)) {
          let t = 0
          Object.keys(furnitureItems)
            .sort()
            .forEach(function (e) {
              let o = camelCaseToSentence(e)
              $("#catalogItems").append(
                "<div id='" +
                  e +
                  "' class='furnitureItem disableSelection' onmousedown='beginDrag(event, \"" +
                  e +
                  "\");'><img " +
                  (t < 18
                    ? "src='objects/" + e + ".png'"
                    : "src='media/thumbPlaceHolder.png'") +
                  " realsrc='objects/" +
                  e +
                  ".png' class='furnitureThumb' alt='" +
                  o +
                  "' title='" +
                  o +
                  "' /></div>"
              ),
                t++
            })
        }
        if (
          ($.ajax({
            url: "plans/examplePlanMM1.dat?Math.random()=" + Math.random(),
            type: "GET",
            contentType: "application/json",
            success: function (e) {
              let t = JSON.parse(e)
              featuredPlanImage.src = t.thumb
            },
            error: function (e) {
              console.log("document.ready : get thumb ajax : " + e)
            },
          }),
          "default" === UILayout &&
            ($("#wallDiffuse").minicolors({
              opacity: !0,
              change: function (e, t) {
                let o = parseInt(e.replace("#", "0x"))
                ;(wallMaterial.color = new THREE.Color(o)),
                  (wallMaterial.opacity = parseFloat(t)),
                  (plan.wallDiffuse = wallMaterial.color),
                  (plan.wallOpacity = wallMaterial.opacity),
                  render()
              },
            }),
            $("#roofDiffuse").minicolors({
              opacity: !0,
              change: function (e, t) {
                let o = parseInt(e.replace("#", "0x"))
                ;(roofMaterial.color = new THREE.Color(o)),
                  (roofMaterial.opacity = parseFloat(t)),
                  (plan.roofDiffuse = roofMaterial.color),
                  (plan.roofOpacity = roofMaterial.opacity),
                  render()
              },
            }),
            $("#wallSpecular").minicolors({
              change: function (e) {
                let t = parseInt(e.replace("#", "0x"))
                ;(wallMaterial.specular = new THREE.Color(t)),
                  (plan.wallSpecular = wallMaterial.specular),
                  render()
              },
            }),
            $("#roofSpecular").minicolors({
              change: function (e) {
                let t = parseInt(e.replace("#", "0x"))
                ;(roofMaterial.specular = new THREE.Color(t)),
                  (plan.roofSpecular = roofMaterial.specular),
                  render()
              },
            }),
            $("#floorDiffuse").minicolors({
              opacity: !0,
              change: function (e, t) {
                let o = parseInt(e.replace("#", "0x"))
                ;(floorMaterial.color = new THREE.Color(o)),
                  (floorMaterial.opacity = parseFloat(t)),
                  (plan.floorDiffuse = floorMaterial.color),
                  (plan.floorOpacity = floorMaterial.opacity),
                  render()
              },
            }),
            $("#floorSpecular").minicolors({
              change: function (e) {
                let t = parseInt(e.replace("#", "0x"))
                ;(floorMaterial.specular = new THREE.Color(t)),
                  (plan.floorSpecular = floorMaterial.specular),
                  render()
              },
            }),
            $("#groundDiffuse").minicolors({
              opacity: !0,
              change: function (e, t) {
                let o = parseInt(e.replace("#", "0x"))
                ;(groundMat.color = new THREE.Color(o)),
                  (groundMat.opacity = parseFloat(t)),
                  (plan.groundDiffuse = groundMat.color.getHexString()),
                  (plan.groundOpacity = groundMat.opacity),
                  render()
              },
            }),
            $("#groundSpecular").minicolors({
              change: function (e) {
                let t = parseInt(e.replace("#", "0x"))
                ;(groundMat.specular = new THREE.Color(t)),
                  (plan.groundSpecular = groundMat.specular.getHexString()),
                  render()
              },
            })),
          fragment)
        )
          $.ajax({
            url: "api/getsharelink/" + fragment,
            type: "GET",
            contentType: "application/json",
            success: function (e) {
              let t = JSON.parse(e)
              e.error
                ? console.log(e.error)
                : ((loadingProgressTxt = "Loading Shared Plan"),
                  (document.getElementById("modalLoadingDataInfo").innerHTML =
                    loadingProgressTxt),
                  $("#loadingModal").show(),
                  hideMouseIndicators(),
                  drawPlan(t))
            },
            error: function (e) {
              console.log("document.ready : getsharelink : " + e)
            },
          })
        else {
          let o = localStorage.getItem("plan")
          if (o) {
            let o = JSON.parse(o)
            ;(loadingProgressTxt = "Loading Cached Plan"),
              (document.getElementById("modalLoadingDataInfo").innerHTML =
                loadingProgressTxt),
              $("#loadingModal").show(),
              hideMouseIndicators(),
              drawPlan(o)
          } else showAbout(), setNewPlan()
        }
      },
      error: function (e) {
        console.dir(e)
      },
    }),
    (progressBar = document.getElementById("progressBar")),
    (progressBar.style.display = "none"),
    (verticalSlider = document.getElementById("verticalSlider")),
    (verticalSliderDragging = !1),
    (verticalSlider.onmousedown = function (e) {
      ;(verticalSliderDragging = !0),
        (verticalSlider.style.left = e.x - 2 + "px")
    }),
    (horizontalSliderLeft = document.getElementById("horizontalSliderLeft")),
    (horizontalSliderLeftDragging = !1),
    (horizontalSliderLeft.onmousedown = function (e) {
      ;(horizontalSliderLeftDragging = !0),
        (horizontalSliderLeft.style.top = e.y - 2 + "px")
    }),
    (horizontalSliderRight = document.getElementById("horizontalSliderRight")),
    (horizontalSliderRightDragging = !1),
    (horizontalSliderRight.onmousedown = function (e) {
      ;(horizontalSliderRightDragging = !0),
        (horizontalSliderRight.style.top = e.y - 2 + "px")
    }),
    paper.install(window),
    paper.setup(planCanvas),
    (paper.settings.hitTolerance = 3),
    initPlanView(),
    initThreeJS(),
    resize3dView(),
    resizePlanView(),
    animate(),
    (furnitureDragDiv = document.getElementById("furnitureDragDiv")),
    (document.getElementById("catalogTextFilter").oninput = function (e) {
      let t = this.value.toLowerCase()
      t.length > 0
        ? Object.keys(furnitureItems).forEach(function (e) {
            e.toLowerCase().indexOf(t) > -1
              ? (document.getElementById(e).style.display = "block")
              : (document.getElementById(e).style.display = "none")
          })
        : Object.keys(furnitureItems).forEach(function (e) {
            document.getElementById(e).style.display = "block"
          }),
        loadInViewThumbs()
    }),
    (fullscreenPlanViewBtn = document.getElementById("fullscreenPlanViewBtn")),
    (fullscreen3dViewBtn = document.getElementById("fullscreen3dViewBtn"))
}),
  (document.onmousemove = function (e) {
    if (verticalSliderDragging)
      return (
        (verticalSlider.style.left = e.x - 2 + "px"),
        (catalogView.style.width = e.x - 2 + "px"),
        (propertiesView.style.width = e.x - 12 + "px"),
        (planView.style.left = e.x + 2 + "px"),
        (rulerLeft.style.left = e.x + 2 + "px"),
        (rulerBottom.style.left = e.x + 2 + "px"),
        (mouseIndicatorY.style.left = e.x + 2 + "px"),
        (view3d.style.left = e.x + 2 + "px"),
        (horizontalSliderLeft.style.width = e.x - 2 + "px"),
        (horizontalSliderRight.style.left = e.x + 2 + "px"),
        Object.keys(levelButtons).forEach(function (t) {
          levelButtons[t].style.left = e.x + 37 + "px"
        }),
        resize3dView(),
        resizePlanView(),
        loadInViewThumbs(),
        !1
      )
    if (horizontalSliderLeftDragging)
      return (
        (horizontalSliderLeft.style.top = e.y - 2 + "px"),
        (catalogView.style.height = e.y - 56 + "px"),
        (propertiesView.style.top = e.y + 2 + "px"),
        loadInViewThumbs(),
        !1
      )
    if (horizontalSliderRightDragging)
      return (
        (horizontalSliderRight.style.top = e.y - 2 + "px"),
        (planView.style.height = e.y - 66 + "px"),
        (rulerLeft.style.bottom = e.y - 66 + "px"),
        (rulerBottom.style.top = e.y - 2 + "px"),
        (mouseIndicatorX.style.height = e.y - 58 + "px"),
        (view3d.style.top = e.y + 2 + "px"),
        (fullscreenPlanViewBtn.style.top = e.y - 2 + "px"),
        Object.keys(levelButtons).forEach(function (t) {
          levelButtons[t].style.top = e.y - 48 + "px"
        }),
        resize3dView(),
        resizePlanView(),
        !1
      )
    if (draggingFurnitureIcon) {
      let t, o
      ;(t = draggingFurnitureRectangle.bounds.width),
        (o = draggingFurnitureRectangle.bounds.height),
        (t *= paper.view.zoom),
        (o *= paper.view.zoom)
      let a = paper.view.viewToProject(
          new paper.Point(
            e.pageX - planView.offsetLeft,
            e.pageY - planView.offsetTop
          )
        ),
        n = null
      if (furnitureItems[draggingFurnitureId].useMask) {
        let l = 51,
          i = 0
        if (
          (Object.keys(Walls).forEach(function (e) {
            let t = Walls[e]
            if (
              "object" == typeof t &&
              t.data.level === project.activeLayer.data.id
            ) {
              let o = t.getNearestPoint(a),
                r = a.getDistance(o)
              if (r < 50 && r < l) {
                ;(l = r), (n = o)
                let s = t.segments[0].point.subtract(t.segments[1].point)
                i = s.angle
              }
            }
          }),
          n)
        ) {
          new Path.Circle({
            center: n,
            radius: screenScale / 2,
            fillColor: new paper.Color(0.3, 1, 0.5, 0.75),
            strokeWidth: 1,
          })
            .removeOnMove()
            .removeOnDrag(),
            (a = n)
          let r = "rotate(" + i + "deg)"
          ;(furnitureDragDiv.style.transform = r), (draggingFurnitureAngle = i)
        } else {
          let r = "rotate(0deg)"
          ;(furnitureDragDiv.style.transform = r), (draggingFurnitureAngle = 0)
        }
      }
      if (null === n) {
        let s
        Object.keys(verticalGuides).forEach(function (e) {
          a.x >= verticalGuides[e].position.x - 10 &&
            a.x <= verticalGuides[e].position.x + 10 &&
            (s = new paper.Point(verticalGuides[e].position.x, a.y))
        }),
          Object.keys(horizontalGuides).forEach(function (e) {
            a.y >= horizontalGuides[e].position.y - 10 &&
              a.y <= horizontalGuides[e].position.y + 10 &&
              (s
                ? (s.y = horizontalGuides[e].position.y)
                : (s = new paper.Point(a.x, horizontalGuides[e].position.y)))
          }),
          s &&
            ((a = s),
            new Path.Circle({
              center: a,
              radius: screenScale / 2,
              fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
              strokeWidth: 1,
            })
              .removeOnMove()
              .removeOnDrag())
      }
      if (furnitureItems[draggingFurnitureId].pivot) {
        let d = a.add(
            new paper.Point(furnitureItems[draggingFurnitureId].pivot).rotate(
              draggingFurnitureAngle
            )
          ),
          c = a,
          u = c.subtract(d)
        a = a.add(u)
      }
      draggingFurnitureRectangle.position = a
      let p = paper.view.projectToView(a)
      ;(furnitureDragDiv.style.left = p.x + planView.offsetLeft - t / 2 + "px"),
        (furnitureDragDiv.style.top = p.y + planView.offsetTop - o / 2 + "px")
    }
    if (draggingNewGuide) {
      let m = paper.view.viewToProject(
        new paper.Point(
          e.pageX - planView.offsetLeft,
          e.pageY - planView.offsetTop
        )
      )
      9 === mouseMode
        ? (verticalGuides[selectedGuideId].position.x =
            parseInt(m.x / snapTolerance) * snapTolerance)
        : 10 === mouseMode &&
          (horizontalGuides[selectedGuideId].position.y =
            parseInt(m.y / snapTolerance) * snapTolerance)
    }
  }),
  (document.onmouseup = function (e) {
    return verticalSliderDragging
      ? ((verticalSliderDragging = !1), !1)
      : horizontalSliderLeftDragging
      ? ((horizontalSliderLeftDragging = !1), !1)
      : horizontalSliderRightDragging
      ? ((horizontalSliderRightDragging = !1), !1)
      : (draggingFurnitureId !== -1 && addFurniture(e),
        void (draggingNewGuide && (draggingNewGuide = !1)))
  }),
  window.addEventListener("keydown", function (e) {
    try {
      if ("editable" !== document.activeElement.className) {
        let t = e.ctrlKey || e.metaKey
        if (17 === e.keyCode) setCtrlKeyPressed(!0)
        else if (46 === e.keyCode || 8 === e.keyCode) deleteSelectedItem()
        else if (190 === e.keyCode) {
          let o = paper.view.bounds.width * paper.view.bounds.height,
            a = Math.max(
              selectedItem.bounds.width * selectedItem.bounds.height,
              1e5
            )
          Math.sqrt(o / a)
          ;(focusPoint = paper.view.center),
            (focusPoint.zoom = paper.view.zoom),
            (tween = new TWEEN.Tween(focusPoint)
              .to(
                {
                  x: selectedItem.bounds.center.x,
                  y: selectedItem.bounds.center.y,
                  zoom: 1,
                },
                500
              )
              .onUpdate(function () {
                reFocus()
              })
              .start())
        }
        if ("catalogTextFilter" !== document.activeElement.id) {
          if (37 === e.keyCode) {
            if (selectedItem)
              if ("furniture" === selectedItem.data.type) {
                let n = 1
                t && (n = 10),
                  (toolsGroup.position.x -= n),
                  (selectedItem.data.toolsRectangleInner.position.x -= n),
                  (selectedItem.position.x -= n),
                  (clickableObjects[selectedItem.data.id].position.x -= n),
                  maskObjects[selectedItem.data.id] &&
                    (maskObjects[selectedItem.data.id].position.x -= n),
                  (controls.target.x -= n),
                  render()
              } else if ("background" === selectedItem.data.type) {
                let n = 1
                t && (n = 10),
                  (backgroundRaster.data.toolsRectangleInner.position.x -= n),
                  (backgroundRaster.position.x -= n),
                  (resizeIcon.position =
                    backgroundRaster.data.toolsRectangleInner.segments[3].point)
              } else if (
                "wallPath" === selectedItem.data.type &&
                selectedMovePointIcon
              ) {
                let n = 1
                t && (n = 10),
                  (Walls[selectedMovePointIcon.data.wallId].segments[
                    selectedMovePointIcon.data.id
                  ].point.x -= n),
                  (selectedMovePointIcon.position.x -= n),
                  relinkWallReferences(project.activeLayer.data.id)
              } else if (
                "roofPath" === selectedItem.data.type &&
                selectedMovePointIcon
              ) {
                let n = 1
                t && (n = 10),
                  (Roofs[selectedMovePointIcon.data.roofId].segments[
                    selectedMovePointIcon.data.id
                  ].point.x -= n),
                  (selectedMovePointIcon.position.x -= n),
                  relinkRoofReferences(project.activeLayer.data.id)
              } else if (
                "floor" === selectedItem.data.type &&
                selectedMovePointIcon
              ) {
                let n = 1
                t && (n = 10),
                  (selectedItem.segments[
                    selectedMovePointIcon.data.id
                  ].point.x -= n),
                  (selectedMovePointIcon.position.x -= n),
                  redrawFloor(selectedItem)
              }
          } else if (38 === e.keyCode) {
            if (selectedItem)
              if ("furniture" === selectedItem.data.type) {
                let n = 1
                t && (n = 10),
                  (toolsGroup.position.y -= n),
                  (selectedItem.data.toolsRectangleInner.position.y -= n),
                  (selectedItem.position.y -= n),
                  (clickableObjects[selectedItem.data.id].position.z -= n),
                  maskObjects[selectedItem.data.id] &&
                    (maskObjects[selectedItem.data.id].position.z -= n),
                  (controls.target.z -= n),
                  render()
              } else if ("background" === selectedItem.data.type) {
                let n = 1
                t && (n = 10),
                  (backgroundRaster.data.toolsRectangleInner.position.y -= n),
                  (backgroundRaster.position.y -= n),
                  (resizeIcon.position =
                    backgroundRaster.data.toolsRectangleInner.segments[3].point)
              } else if (
                "wallPath" === selectedItem.data.type &&
                selectedMovePointIcon
              ) {
                let n = 1
                t && (n = 10),
                  (Walls[selectedMovePointIcon.data.wallId].segments[
                    selectedMovePointIcon.data.id
                  ].point.y -= n),
                  (selectedMovePointIcon.position.y -= n),
                  relinkWallReferences(project.activeLayer.data.id)
              } else if (
                "roofPath" === selectedItem.data.type &&
                selectedMovePointIcon
              ) {
                let n = 1
                t && (n = 10),
                  (Roofs[selectedMovePointIcon.data.roofId].segments[
                    selectedMovePointIcon.data.id
                  ].point.y -= n),
                  (selectedMovePointIcon.position.y -= n),
                  relinkRoofReferences(project.activeLayer.data.id)
              } else if (
                "floor" === selectedItem.data.type &&
                selectedMovePointIcon
              ) {
                let n = 1
                t && (n = 10),
                  (selectedItem.segments[
                    selectedMovePointIcon.data.id
                  ].point.y -= n),
                  (selectedMovePointIcon.position.y -= n),
                  redrawFloor(selectedItem)
              }
          } else if (39 === e.keyCode) {
            if (selectedItem)
              if ("furniture" === selectedItem.data.type) {
                let n = 1
                t && (n = 10),
                  (toolsGroup.position.x += n),
                  (selectedItem.data.toolsRectangleInner.position.x += n),
                  (selectedItem.position.x += n),
                  (clickableObjects[selectedItem.data.id].position.x += n),
                  maskObjects[selectedItem.data.id] &&
                    (maskObjects[selectedItem.data.id].position.x += n),
                  (controls.target.x += n),
                  render()
              } else if ("background" === selectedItem.data.type) {
                let n = 1
                t && (n = 10),
                  (backgroundRaster.data.toolsRectangleInner.position.x += n),
                  (backgroundRaster.position.x += n),
                  (resizeIcon.position =
                    backgroundRaster.data.toolsRectangleInner.segments[3].point)
              } else if (
                "wallPath" === selectedItem.data.type &&
                selectedMovePointIcon
              ) {
                let n = 1
                t && (n = 10),
                  (Walls[selectedMovePointIcon.data.wallId].segments[
                    selectedMovePointIcon.data.id
                  ].point.x += n),
                  (selectedMovePointIcon.position.x += n),
                  relinkWallReferences(project.activeLayer.data.id)
              } else if (
                "roofPath" === selectedItem.data.type &&
                selectedMovePointIcon
              ) {
                let n = 1
                t && (n = 10),
                  (Roofs[selectedMovePointIcon.data.roofId].segments[
                    selectedMovePointIcon.data.id
                  ].point.x += n),
                  (selectedMovePointIcon.position.x += n),
                  relinkRoofReferences(project.activeLayer.data.id)
              } else if (
                "floor" === selectedItem.data.type &&
                selectedMovePointIcon
              ) {
                let n = 1
                t && (n = 10),
                  (selectedItem.segments[
                    selectedMovePointIcon.data.id
                  ].point.x += n),
                  (selectedMovePointIcon.position.x += n),
                  redrawFloor(selectedItem)
              }
          } else if (40 === e.keyCode && selectedItem)
            if ("furniture" === selectedItem.data.type) {
              let n = 1
              t && (n = 10),
                (toolsGroup.position.y += n),
                (selectedItem.data.toolsRectangleInner.position.y += n),
                (selectedItem.position.y += n),
                (clickableObjects[selectedItem.data.id].position.z += n),
                maskObjects[selectedItem.data.id] &&
                  (maskObjects[selectedItem.data.id].position.z += n),
                (controls.target.z += n),
                render()
            } else if ("background" === selectedItem.data.type) {
              let n = 1
              t && (n = 10),
                (backgroundRaster.data.toolsRectangleInner.position.y += n),
                (backgroundRaster.position.y += n),
                (resizeIcon.position =
                  backgroundRaster.data.toolsRectangleInner.segments[3].point)
            } else if (
              "wallPath" === selectedItem.data.type &&
              selectedMovePointIcon
            ) {
              let n = 1
              t && (n = 10),
                (Walls[selectedMovePointIcon.data.wallId].segments[
                  selectedMovePointIcon.data.id
                ].point.y += n),
                (selectedMovePointIcon.position.y += n),
                relinkWallReferences(project.activeLayer.data.id)
            } else if (
              "roofPath" === selectedItem.data.type &&
              selectedMovePointIcon
            ) {
              let n = 1
              t && (n = 10),
                (Roofs[selectedMovePointIcon.data.roofId].segments[
                  selectedMovePointIcon.data.id
                ].point.y += n),
                (selectedMovePointIcon.position.y += n),
                relinkRoofReferences(project.activeLayer.data.id)
            } else if (
              "floor" === selectedItem.data.type &&
              selectedMovePointIcon
            ) {
              let n = 1
              t && (n = 10),
                (selectedItem.segments[selectedMovePointIcon.data.id].point.y +=
                  n),
                (selectedMovePointIcon.position.y += n),
                redrawFloor(selectedItem)
            }
          e.preventDefault()
        }
      }
      27 === e.keyCode &&
        ("walls" === toolMode
          ? setEndDrawingWalls()
          : "floor" === toolMode
          ? setEndDrawingFloors()
          : "roof" === toolMode
          ? setEndDrawingRoofs()
          : "dimension" === toolMode
          ? setEndDrawingDimension()
          : "text" === toolMode
          ? setEndDrawingText()
          : "ground" === toolMode
          ? setEndDrawingGround()
          : (deselectAll(), setToolMode("pointer")),
        e.preventDefault()),
        89 === e.keyCode && t
          ? (doRedo(), e.preventDefault())
          : 90 === e.keyCode && t
          ? (doUndo(), e.preventDefault())
          : 67 === e.keyCode && t
          ? modalsActive || (doCopy(), e.preventDefault())
          : 86 === e.keyCode &&
            t &&
            (modalsActive || (doPaste(), e.preventDefault()))
    } catch (e) {}
  }),
  window.addEventListener("keyup", function (e) {
    17 === e.keyCode && setCtrlKeyPressed(!1)
  }),
  window.addEventListener("click", function (e) {
    e.target == aboutModal
      ? ($("#aboutModal").hide(), showMouseIndicators())
      : e.target == model3dModal
      ? ((model3dViewOpen = !1),
        $("#model3dModal").hide(),
        showMouseIndicators())
      : e.target == loadingModal
      ? ($("#loadingModal").hide(), showMouseIndicators())
      : e.target == shareModal &&
        ($("#shareModal").hide(), showMouseIndicators())
  })
*/

// ========================================================
// [MM] HEY HEY HEY -- more variables

let busy = !1,
  onProgress = function (e) {
    if (e.lengthComputable) {
      let t = (e.loaded / e.total) * 100
      ;(progressBar.value = t), (progressBar.style.display = "block")
    }
  },
  onError = function (e) {},
  screenAvg = (screen.width + screen.height) / 2,
  redrawing = !1,
  strokeWidth = 0,
  getAngleRadians = function (e, t) {
    return Math.atan2(t.y - e.y, t.x - e.x)
  },
  getDistance = function (e, t) {
    let o = e.x - t.x,
      a = e.y - t.y,
      n = Math.sqrt(o * o + a * a)
    return n
  }

// ========================================================
// [MM] HEY HEY HEY -- a prototype function :)

String.prototype.capitalize = function () {
  return this.replace(/(^|\s)([a-z])/g, function (e, t, o) {
    return t + o.toUpperCase()
  })
}

// ========================================================
// [MM] HEY HEY HEY -- that's it !!
