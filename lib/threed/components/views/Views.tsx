import {
  FC,
  useEffect,
} from 'react'


// ** Different Views
const CatalogView: FC = (): JSX.Element => {
  // console.debug("CatalogView")
  useEffect(() => {
    console.debug('CatalogView onMount')
    return () => {
      console.debug('CatalogView onUnmount')
    }
  }, [])
  return (
    <div id='catalogView'>
      <div id='catalogFilters'>
        <input
          type='text'
          id='catalogTextFilter'
          placeholder='Filter'
        />
      </div>
      <div id='catalogItems'></div>
    </div>
  )
}

const PropertiesView: FC = (): JSX.Element => {
  // console.debug("PropertiesView")
  useEffect(() => {
    console.debug('PropertiesView onMount')
    return () => {
      console.debug('PropertiesView onUnmount')
    }
  }, [])
  return (
    <div
      id='propertiesView'
      style={{ paddingLeft: '10px' }}
    >
      <div
        id='furniture3DModelPropertiesView'
        style={{ display: 'none' }}
      >
        <h3>3d Model Properties</h3>
        <table
          className='propertiesTable'
          style={{ minWidth: '290px' }}
        >
          <tr>
            <td
              colSpan='2'
              style={{ textAlign: 'center' }}
            >
              <div
                onMouseDown='beginDrag(event, modalModel3dFurnitureId);'
                className='disableSelection'
              >
                <img
                  id='model3dLargeThumb'
                  className='disableSelection'
                  style={{ pointerEvents: 'none' }}
                />
              </div>
            </td>
          </tr>
          <tr>
            <td width='70'>Name</td>
            <td>
              <span id='model3dName'></span>
            </td>
          </tr>
          <tr>
            <td>Author</td>
            <td>
              <span id='model3dAuthor'></span>
            </td>
          </tr>
          <tr>
            <td>License</td>
            <td>
              <span id='model3dLicense'></span>
            </td>
          </tr>
          <tr>
            <td>3D Model</td>
            <td>
              <Button
                className='moreInfoBtn'
                onClick={() => showModel3dView}
              >
                View
              </Button>
            </td>
          </tr>
        </table>
      </div>
      <div
        id='furniturePropertiesView'
        style={{ display: 'none' }}
      >
        <h3>Furniture Properties</h3>
        <table
          className='propertiesTable'
          style={{ minWidth: '290px' }}
        >
          <tr>
            <td width='70'>Id</td>
            <td>
              <span id='objectId'></span>
            </td>
          </tr>
          <tr>
            <td>Name</td>
            <td>
              <span id='objectName'></span>
            </td>
          </tr>
          <tr>
            <td>X</td>
            <td>
              <input
                type='text'
                id='furnitureXProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusOrMinusNumber(this, updateFurniturePosX);'
                maxLength='8'
              />
              cm
            </td>
          </tr>
          <tr>
            <td>Z</td>
            <td>
              <input
                type='text'
                id='furnitureZProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusOrMinusNumber(this, updateFurniturePosZ);'
                maxLength='8'
              />
              cm
            </td>
          </tr>
          <tr>
            <td>Y</td>
            <td>
              <input
                type='text'
                id='furnitureYProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusOrMinusNumber(this, updateFurniturePosY);'
                maxLength='8'
              />
              cm
            </td>
          </tr>
          <tr>
            <td>Width</td>
            <td>
              <input
                type='text'
                id='furnitureWidthProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusNumber(this, updateFurnitureWidth);'
                maxLength='8'
              />
              cm
              <input
                type='checkbox'
                id='flipX'
                onChange='flipX(this.checked)'
              />
              Flip X
            </td>
          </tr>
          <tr>
            <td>Depth</td>
            <td>
              <input
                type='text'
                id='furnitureDepthProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusNumber(this, updateFurnitureDepth);'
                maxLength='8'
              />
              cm
              <input
                type='checkbox'
                id='flipZ'
                onChange='flipZ(this.checked)'
              />
              Flip Z
            </td>
          </tr>
          <tr>
            <td>Height</td>
            <td>
              <input
                type='text'
                id='furnitureHeightProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusOrMinusNumber(this, updateFurnitureHeight);'
                maxLength='8'
              />
              cm
            </td>
          </tr>
          <tr>
            <td>Angle</td>
            <td>
              <span id='furnitureAngleProp'></span>°
            </td>
          </tr>
          <tr>
            <td>Level</td>
            <td>
              <span id='furnitureLevelProp'></span>
            </td>
          </tr>
          <tr>
            <td>3D Model</td>
            <td>
              <Button
                className='moreInfoBtn'
                onClick='showModel3dView();'
              >
                View
              </Button>
            </td>
          </tr>
        </table>
      </div>
      <div
        id='defaultsPropertiesView'
        style={{ display: 'none' }}
      >
        <h3>Default Settings</h3>
        <table
          className='propertiesTable'
          style={{ minWidth: '290px' }}
        >
          <tr>
            <td>Compass Heading</td>
            <td>
              <input
                type='range'
                id='compassHdg'
                name='compassHdg'
                min='0'
                max='360'
                step='1'
                value='0'
                onInput='rotateCompass(this.value)'
                onChange='rotateCompass(this.value)'
              />
              <span id='compassHdgLbl'>0°</span>
            </td>
          </tr>
        </table>
      </div>
      <div
        id='wallDefaultsPropertiesView'
        style={{ display: 'none' }}
      >
        <h3>Default Wall Settings</h3>
        <table
          className='propertiesTable'
          style={{ minWidth: '290px' }}
        >
          <tr>
            <td width='70'>Wall Height</td>
            <td>
              <input
                type='text'
                id='defaultWallHeightProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusNumber(this, updateDefaultWallHeight);'
                maxLength='8'
              />
              cm
            </td>
          </tr>
          <tr>
            <td>Wall Thickness</td>
            <td>
              <input
                type='text'
                id='defaultWallThicknessProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusNumber(this, updateDefaultWallThickness);'
                maxLength='8'
              />
              cm
            </td>
          </tr>
        </table>
      </div>
      <div
        id='floorDefaultsPropertiesView'
        style={{ display: 'none' }}
      >
        <h3>Default Floor Settings</h3>
        <table
          className='propertiesTable'
          style={{ minWidth: '290px' }}
        >
          <tr>
            <td>Floor Thickness</td>
            <td>
              <input
                type='text'
                id='defaultFloorThicknessProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusNumber(this, updateDefaultFloorThickness);'
                maxLength='8'
              />
              cm
            </td>
          </tr>
        </table>
      </div>
      <div
        id='roofDefaultsPropertiesView'
        style={{ display: 'none' }}
      >
        <h3>Default Roof Settings</h3>
        <table
          className='propertiesTable'
          style={{ minWidth: '290px' }}
        >
          <tr>
            <td>Roof Thickness</td>
            <td>
              <input
                type='text'
                id='defaultRoofThicknessProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusNumber(this, updateDefaultRoofThickness);'
                maxLength='8'
              />
              cm
            </td>
          </tr>
          <tr>
            <td>Rise</td>
            <td>
              <input
                type='text'
                id='defaultRoofRiseProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusNumber(this, updateDefaultRoofRise);'
                maxLength='8'
              />
              cm
            </td>
          </tr>
          <tr>
            <td>Base Offset</td>
            <td>
              <input
                type='text'
                id='defaultRoofStartHeightProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusOrMinusNumber(this, updateDefaultRoofStartHeight);'
                maxLength='8'
              />
              cm
            </td>
          </tr>
          <tr>
            <td>Run</td>
            <td>
              <input
                type='text'
                id='defaultRoofWidthProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusNumber(this, updateDefaultRoofWidth);'
                maxLength='8'
              />
              cm
            </td>
          </tr>
          <tr>
            <td>Rafter Length</td>
            <td>
              <span id='defaultRafterLengthProp'></span> cm
            </td>
          </tr>
          <tr>
            <td>Roof Pitch</td>
            <td>
              <span id='defaultRoofPitchProp'></span>°
            </td>
          </tr>
        </table>
      </div>
      <div
        id='dimensionDefaultsPropertiesView'
        style={{ display: 'none' }}
      >
        <h3>Default Dimension Settings</h3>
      </div>
      <div
        id='textDefaultsPropertiesView'
        style={{ display: 'none' }}
      >
        <h3>Default Text Settings</h3>
      </div>

      <div
        id='planViewPropertiesView'
        style={{ display: 'none' }}
      >
        <h3>Background Template</h3>
        <table
          className='propertiesTable'
          style={{ minWidth: '290px' }}
        >
          <tr>
            <td width='70'>File</td>
            <td>
              <input
                type='file'
                id='backgroundImageFile'
                name='backgroundImageFile'
                onChange='loadBackgroundImage(event)'
              />
            </td>
          </tr>
          <tr>
            <td>Opacity</td>
            <td>
              <input
                type='range'
                id='bgTemplateOpacity'
                name='bgTemplateOpacity'
                min='0'
                max='1.0'
                step='.01'
                value='0.33'
                onInput='setBgTemplateOpacity(this.value)'
                onChange='setBgTemplateOpacity(this.value)'
              />
            </td>
          </tr>
          <tr>
            <td>Flip Horizontal</td>
            <td>
              <input
                type='checkbox'
                id='bgTplFlipX'
                onChange='flipBackgroundTemplateX(this.checked)'
              />
            </td>
          </tr>
          <tr>
            <td>Flip Vertical</td>
            <td>
              <input
                type='checkbox'
                id='bgTplFlipZ'
                onChange='flipBackgroundTemplateZ(this.checked)'
              />
            </td>
          </tr>
          <tr>
            <td width='60'></td>
            <td>
              <Button
                id='resizeBackgroundImageBtn'
                onClick='enableResizeBackgroundTemplate();'
                className='moreInfoBtn'
              >
                Resize
              </Button>
            </td>
          </tr>
          <tr>
            <td width='60'></td>
            <td>
              <Button
                id='deleteBackgroundImageBtn'
                onClick='deleteBackgroundImage()'
                className='moreInfoBtn'
              >
                Delete
              </Button>
            </td>
          </tr>
        </table>
      </div>
      <div
        id='3dViewPropertiesView'
        style={{ display: 'none' }}
      >
        <h3>3d View Properties</h3>
        <table
          className='propertiesTable'
          style={{ minWidth: '290px' }}
        >
          <tr>
            <td width='70'>Wall Color</td>
            <td>
              <input
                type='hidden'
                id='wallDiffuse'
                value='rgba(255,255,255,0.5)'
              />
            </td>
          </tr>
          <tr>
            <td width='70'>Wall Specular</td>
            <td>
              <input
                type='hidden'
                id='wallSpecular'
                value='#00ff00'
              />
            </td>
          </tr>
          <tr>
            <td width='70'>Wall Emissive</td>
            <td>
              <input
                type='hidden'
                id='wallEmissive'
                value='#ffffff'
              />
            </td>
          </tr>
          <tr>
            <td width='70'>Floor Color</td>
            <td>
              <input
                type='hidden'
                id='floorDiffuse'
                value='rgba(15,15,15,0.5)'
              />
            </td>
          </tr>
          <tr>
            <td width='70'>Floor Specular</td>
            <td>
              <input
                type='hidden'
                id='floorSpecular'
                value='#00ffff'
              />
            </td>
          </tr>
          <tr>
            <td width='70'>Roof Color</td>
            <td>
              <input
                type='hidden'
                id='roofDiffuse'
                value='rgba(255,255,255,0.5)'
              />
            </td>
          </tr>
          <tr>
            <td width='70'>Roof Specular</td>
            <td>
              <input
                type='hidden'
                id='roofSpecular'
                value='#ff0000'
              />
            </td>
          </tr>
          <tr>
            <td>Ground Color</td>
            <td>
              <input
                type='hidden'
                id='groundDiffuse'
                value='rgba(03,141,221,1.0)'
              />
            </td>
          </tr>
          <tr>
            <td>Ground Specular</td>
            <td>
              <input
                type='hidden'
                id='groundSpecular'
                value='#f2ff9c'
              />
            </td>
          </tr>
          <tr>
            <td width='70'>Depth Write</td>
            <td>
              <input
                type='checkbox'
                id='depthWriteMode'
                onChange='setDepthWriteMode(this.checked);'
              />
            </td>
          </tr>
          <tr>
            <td width='70'>Sort Objects</td>
            <td>
              <input
                type='checkbox'
                id='sortObjectsMode'
                onChange='setSortObjectsMode(this.checked);'
              />
            </td>
          </tr>
          <tr>
            <td>Sun Azimuth</td>
            <td>
              <input
                type='range'
                id='sunAzimuth'
                name='sunAzimuth'
                min='0'
                max='1.0'
                step='.01'
                value='0.33'
                onInput='setSunAzimuth(this.value)'
                onChange='setSunAzimuth(this.value)'
              />
            </td>
          </tr>
          <tr>
            <td>Sun Incline</td>
            <td>
              <input
                type='range'
                id='sunIncline'
                name='sunIncline'
                min='0'
                max='1.0'
                step='.01'
                value='0.0'
                onInput='setSunIncline(this.value)'
                onChange='setSunIncline(this.value)'
              />
            </td>
          </tr>
          <tr>
            <td>Ambient Intensity</td>
            <td>
              <input
                type='range'
                id='ambientLightBrightness'
                name='ambientLightBrightness'
                min='0.0'
                max='1.0'
                step='0.1'
                onInput='adjustAmbientLightBrightness(this.value)'
                onChange='adjustAmbientLightBrightness(this.value)'
              />
            </td>
          </tr>
          <tr>
            <td>Directional Intensity</td>
            <td>
              <input
                type='range'
                id='dirLightBrightness'
                name='dirLightBrightness'
                min='0.0'
                max='1.0'
                step='0.1'
                onInput='adjustDirLightBrightness(this.value)'
                onChange='adjustDirLightBrightness(this.value)'
              />
            </td>
          </tr>
          <tr>
            <td>Hemisphere Intensity</td>
            <td>
              <input
                type='range'
                id='hemiLightBrightness'
                name='hemiLightBrightness'
                min='0.0'
                max='1.0'
                step='0.1'
                onInput='adjustHemiLightBrightness(this.value)'
                onChange='adjustHemiLightBrightness(this.value)'
              />
            </td>
          </tr>
        </table>
      </div>
      <div
        id='wallPropertiesView'
        style={{ display: 'none' }}
      >
        <h3>Wall Properties</h3>
        <table
          className='propertiesTable'
          style={{ minWidth: '290px' }}
        >
          <tr>
            <td width='70'>Id</td>
            <td>
              <input
                type='hidden'
                id='wallIdHidden'
              />
              <span id='wallIdProp'></span>
            </td>
          </tr>
          <tr>
            <td>Height</td>
            <td>
              <input
                type='text'
                id='wallHeightProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusNumber(this, updateWallHeight);'
                maxLength='8'
              />
              cm
            </td>
          </tr>
          <tr>
            <td>Height Start</td>
            <td>
              <input
                type='text'
                id='wallHeight0Prop'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusNumber(this, updateWallHeight0);'
                maxLength='8'
              />
              cm
            </td>
          </tr>
          <tr>
            <td>Height End</td>
            <td>
              <input
                type='text'
                id='wallHeight1Prop'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusNumber(this, updateWallHeight1);'
                maxLength='8'
              />
              cm
            </td>
          </tr>
          <tr>
            <td>Thickness</td>
            <td>
              <input
                type='text'
                id='wallThicknessProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusNumber(this, updateWallThickness);'
                maxLength='8'
              />
              cm
            </td>
          </tr>
          <tr>
            <td>Level</td>
            <td>
              <span id='wallLevelProp'></span>
            </td>
          </tr>
        </table>
      </div>
      <div
        id='roofPropertiesView'
        style={{ display: 'none' }}
      >
        <h3>Roof Properties</h3>
        <table
          className='propertiesTable'
          style={{ minWidth: '290px' }}
        >
          <tr>
            <td width='70'>Id</td>
            <td>
              <input
                type='hidden'
                id='roofIdHidden'
              />
              <span id='roofIdProp'></span>
            </td>
          </tr>
          <tr>
            <td>Thickness</td>
            <td>
              <input
                type='text'
                id='roofThicknessProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusNumber(this, updateRoofThickness);'
                maxLength='8'
              />
              cm
            </td>
          </tr>
          <tr>
            <td>Rise</td>
            <td>
              <input
                type='text'
                id='roofRiseProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusNumber(this, updateRoofRise);'
                maxLength='8'
              />
              cm
            </td>
          </tr>
          <tr>
            <td>Base Offset</td>
            <td>
              <input
                type='text'
                id='roofStartHeightProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusOrMinusNumber(this, updateRoofStartHeight);'
                maxLength='8'
              />
              cm
            </td>
          </tr>
          <tr>
            <td>Run</td>
            <td>
              <input
                type='text'
                id='roofWidthProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusNumber(this, updateRoofWidth);'
                maxLength='8'
              />
              cm
            </td>
          </tr>
          <tr>
            <td>Rafter Length</td>
            <td>
              <span id='rafterLengthProp'></span> cm
            </td>
          </tr>
          <tr>
            <td>Roof Pitch</td>
            <td>
              <span id='roofPitchProp'></span>°
            </td>
          </tr>
          <tr>
            <td>Level</td>
            <td>
              <span id='roofLevelProp'></span>
            </td>
          </tr>
        </table>
      </div>
      <div
        id='floorPropertiesView'
        style={{ display: 'none' }}
      >
        <h3>Floor Properties</h3>
        <table
          className='propertiesTable'
          style={{ minWidth: '290px' }}
        >
          <tr>
            <td width='70'>Id</td>
            <td>
              <span id='floorIdProp'></span>
            </td>
          </tr>
          <tr>
            <td>Area</td>
            <td>
              <span id='floorAreaProp'></span>
            </td>
          </tr>
          <tr>
            <td>Thickness</td>
            <td>
              <span id='floorThicknessProp'></span>
            </td>
          </tr>
          <tr>
            <td>Level</td>
            <td>
              <span id='floorLevelProp'></span>
            </td>
          </tr>
        </table>
      </div>
      <div
        id='dimensionPropertiesView'
        style={{ display: 'none' }}
      >
        <h3>Dimension Properties</h3>
        <table
          className='propertiesTable'
          style={{ minWidth: '290px' }}
        >
          <tr>
            <td width='70'>Id</td>
            <td>
              <span id='dimensionIdProp'></span>
            </td>
          </tr>
          <tr>
            <td>Length</td>
            <td>
              <span id='dimensionLengthProp'></span>
            </td>
          </tr>
          <tr>
            <td>Adjacent</td>
            <td>
              <span id='dimensionAdjacentProp'></span>
            </td>
          </tr>
          <tr>
            <td>Level</td>
            <td>
              <span id='dimensionLevelProp'></span>
            </td>
          </tr>
        </table>
      </div>
      <div
        id='textPropertiesView'
        style={{ display: 'none' }}
      >
        <h3>Text Annotation Properties</h3>
        <table
          className='propertiesTable'
          style={{ minWidth: '290px' }}
        >
          <tr>
            <td width='70'>Id</td>
            <td>
              <span id='textIdProp'></span>
            </td>
          </tr>
          <tr>
            <td>Text</td>
            <td>
              <input
                type='text'
                id='textValueProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onKeyUp='validateText(event, this, updateTextValue);'
                maxLength='100'
              />
            </td>
          </tr>
          <tr>
            <td>X</td>
            <td>
              <input
                type='text'
                id='textXProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusOrMinusNumber(this, updateTextX);'
                maxLength='8'
              />
            </td>
          </tr>
          <tr>
            <td>Y</td>
            <td>
              <input
                type='text'
                id='textYProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusOrMinusNumber(this, updateTextY);'
                maxLength='8'
              />
            </td>
          </tr>
          <tr>
            <td>Level</td>
            <td>
              <span id='textLevelProp'></span>
            </td>
          </tr>
        </table>
        <div>
          Type<span id='textDataTypeProp'></span>
        </div>
        <div>
          <Button
            id='deleteTextAnnotationBtn'
            onClick='deleteTextBtnClick()'
          >
            Delete
          </Button>
        </div>
      </div>
      <div
        id='levelPropertiesView'
        style={{ display: 'none' }}
      >
        <h3>Level Properties</h3>
        <table
          className='propertiesTable'
          style={{ minWidth: '290px' }}
        >
          <tr>
            <td width='70'>Id</td>
            <td>
              <span id='levelIdProp'></span>
            </td>
          </tr>
          <tr>
            <td>Name</td>
            <td>
              <span id='levelNameProp'></span>
            </td>
          </tr>
          <tr>
            <td>Height</td>
            <td>
              <input
                type='text'
                id='levelHeightProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusOrMinusNumber(this, updateLevelHeight);'
                maxLength='8'
              />
            </td>
          </tr>
        </table>
      </div>
      <div
        id='groundPropertiesView'
        style={{ display: 'none' }}
      >
        <h3>Ground Layer Properties</h3>
        <table
          className='propertiesTable'
          style={{ minWidth: '290px' }}
        >
          <tr>
            <td>Width</td>
            <td>
              <input
                type='text'
                id='groundWidthProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusNumber(this, updateGroundWidth);'
                maxLength='8'
              />
              cm
            </td>
          </tr>
          <tr>
            <td>Legth</td>
            <td>
              <input
                type='text'
                id='groundLengthProp'
                style={{
                  width: '80px',
                  border: '1px solid #2a2a2a',
                  fontSize: '14px',
                  color: 'white',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                className='editable'
                onChange='validatePlusNumber(this, updateGroundLength);'
                maxLength='8'
              />
              cm
            </td>
          </tr>
        </table>
      </div>
    </div>
  )
}

const PlanView: FC = (): JSX.Element => {
  // console.debug("PlanView")
  useEffect(() => {
    console.debug('PlanView onMount')
    return () => {
      console.debug('PlanView onUnmount')
    }
  }, [])
  return (
    <div id='planView'>
      <canvas
        id='planCanvas'
        width='1024'
        height='450'
      ></canvas>
      <div
        id='overlayLogoPlanView'
        className='overlayLogo'
      >
        <a
          href='https://threedgarden.com'
          style={{ float: 'left', padding: '0px', marginTop: '0px' }}
        >
          <img
            src='/favicon/favicon.png'
            height='77px'
            title='ThreeD Garden'
            alt='ThreeD Garden'
          />
        </a>
        <a
          href='https://threedgarden.com'
          style={{ paddingLeft: '10px', textDecoration: 'none', fontSize: '32px' }}
        >
          ThreeD Garden
        </a>
      </div>
      <div id='overlayMenuPlanView'>
        <Button
          id='overlayPlanViewRecenterBtn'
          onClick='recenterPlanView()'
          className='smallButton'
        >
          Recenter
        </Button>
        <Button
          id='overlayPlanViewGoto3dViewBtn'
          onClick='goto3dView()'
          className='smallButton'
        >
          3d View
        </Button>
      </div>
    </div>
  )
}

const TheBottom: FC = (): JSX.Element => {
  const word = `[MM] TheBottom @ ${new Date().toISOString()}`

  // console.debug("MyComponent")
  useEffect(() => {
    console.debug('MyComponent onMount')
    return () => {
      console.debug('MyComponent onUnmount')
    }
  }, [])

  return (
    <Box>
      <canvas
        id='rulerLeft'
        width='30'
        height='500'
        onMouseDown='addVerticalGuide();'
        onMouseUp='removeVerticalGuide()'
      />
      <canvas
        id='rulerBottom'
        width='1024'
        height='20'
        onMouseDown='addHorizontalGuide();'
        onMouseUp='removeHorizontalGuide()'
      />

      <div id='mouseIndicatorY' />
      <div id='mouseIndicatorX' />

      <div id='compass' />

      <div id='view3d'>
        <canvas id='threeCanvas' />

        <div
          id='overlayLogo3dView'
          className='overlayLogo'
        >
          HEY HEY HEY
        </div>

        <div id='overlayMenu3dView'>
          <Button
            id='overlay3dviewRecenterBtn'
            onClick='recenter3dview()'
            className='smallButton'
          >
            Recenter
          </Button>
          <Button
            id='overlay3dviewGotoPlanViewBtn'
            onClick='gotoPlanView()'
            className='smallButton'
          >
            Plan View
          </Button>
        </div>
      </div>

      <div id='verticalSlider' />
      <div id='horizontalSliderLeft' />
      <div id='horizontalSliderRight' />

      <div id='furnitureDragDiv' />

      <Image
        id='fullscreenPlanViewBtn'
        src='/demo/media/fullscreen.png'
        width={24}
        height={24}
        alt='fullscreenPlanViewBtn'
        onClick="doOpenFullscreen('planView');"
      />
      <Image
        id='fullscreen3dViewBtn'
        src='/demo/media/fullscreen.png'
        width={24}
        height={24}
        alt='fullscreen3dViewBtn'
        onClick="doOpenFullscreen('view3d');"
      />

      <Progress
        value='50'
        max='100'
        className='center'
        id='progressBar'
      />
    </Box>
  )
}
