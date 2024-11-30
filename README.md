# 🥕 ThreeD Garden

[WebGL 3D Environment Interface for Next.JS React TypeScript Three.JS React-Three Physics, 2D Paper.JS, APIs: WordPress, Apollo GraphQL, Leva Control GUI, Radix-UI, Tailwind CSS, 3D FarmBot React (Beta), Open AI](https://github.com/marty-mcgee/threed-garden/)

3D Dev Environment w React, TypeScript, Three.js, React-Three (pmndrs), on Next.js, Apollo Client, GraphQL, WordPress, REST APIs. ThreeD Interface for Three-Dimensional Objects. Now integrating with FarmBot 3D on React.

## Live Demo

🌱 [threedgarden.com](https://threedgarden.com/particpate)

🥕 [Demo: Actively Participate](https://threedgarden.com/participate)

## For Developers

🤖 ["name": "threed-garden"](https://www.npmjs.com/package/threed-garden)

🤖 ["version": "0.17.0-x"](https://www.npmjs.com/package/threed-garden?activeTab=versions)

🤖 ["code": "0.17.0-x"](https://www.npmjs.com/package/threed-garden?activeTab=code)

### Install + Run

#### npm i threed-garden
#### git clone https://github.com/marty-mcgee/threed-garden.git

- app currently requires yarn: `npm install -g yarn`
- (you can instead, of course, use pnpm or npm easily)

1. install app: `yarn install`
2. run in local env: `yarn dev`
3. build for production: `yarn build`
4. start in production env: `yarn start`
4. deploy to preset location: `yarn deploy`

====

## FUNCTIONAL NOUNS : ACTIONS : GROUPS == NOUNS + ACTIONS + METADATA 🌱 🤖 🍅 🥕

- Noun | as root JS Object | interface INoun | type TNoun | wp_type threed_noun

--- Nouns

- Project | interface IProject | type TProject | wp_type threed_project
- Scene | extends THREE.Scene | interface IScene | type TScene | wp_type threed_scene
- Plan | interface IPlan | type TPlan | wp_type threed_plan
- ThreeD | as root JS Object | interface IThreeD | type TThreed | wp_type threed_threed
- File | interface IFile | type TFile | wp_type threed_file
- Participant | interface IParticipant | type TParticipant | wp_type threed_participant
- Character | interface ICharacter | type TCharacter | wp_type threed_character

--- Actions

- Simulation | interface ISimulation | type TSimulation | wp_type threed_simulation
- Demo | extends Simulation | interface IDemo | type TDemo | wp_type threed_demo
- Game | extends Simulation | interface IGame | type TGame | wp_type threed_game

--- Groups [of Nouns]

- World | interface IWorld | wp_type threed_world
- Structure | extends THREE.Object3D | interface IStructure | wp_type threed_structure
- Farm | extends THREE.Group | interface IFarm | wp_type threed_farm
- Garden | extends THREE.Group | interface IGarden | wp_type threed_garden
- Allotment | extends Structure | interface IAllotment | wp_type threed_allotment
- Bed | extends Structure | interface IBed | wp_type threed_bed
- Furniture | extends Structure | interface IFurniture | wp_type threed_furniture
- Equipment | extends Structure | interface IEquipment | wp_type threed_equipment
- Plant | extends Structure | interface IPlant | wp_type threed_plant
- Soil | extends Structure | interface ISoil | wp_type threed_soil
- SoilAddendum | extends Soil | interface ISoilAddendum | wp_type threed_soil_addendum
- SoilPlan | Actions | Relationships | interface ISoilPlan | wp_type threed_soil_plan
- PlantingPlan | Actions | Relationships | interface IPlantingPlan | wp_type threed_planting_plan
- BuildingPlan | Actions | Relationships | interface IBuildingPlan | wp_type threed_building_plan

--- Helpers (Actions, Utilities)

- Tool | extends ThreeD? | interface ITool | type TTool
- PlaneTool | extends Tool | interface IPlane | type TPlane
- Camera | extends Tool | extends THREE.Camera | interface ICamera | type TCamera
- Light | extends Tool | extends THREE.Light.DirectionalLight | interface ILight | type Light
- Raster | extends Tool | extends THREE.Raster.Rasterizer | interface IRaster | type TRaster
- Shader | extends Tool | extends THREE.Shader.Shaderizer | interface IShader | type TShader
- Animation | extends Tool | extends OBJ.animation | interface IAnimation | type TAnimation

--- Testing (Physics)

- Collider | extends Physics? | interface ICollider | type TCollider
- Energy | extends Physics? | interface IEnergy | type TEnergy

====

> a part of the 🌱 threed.ai code family
