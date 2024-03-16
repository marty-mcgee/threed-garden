# [🥕 ThreeD Garden: 3D Object Environment w NextJS React TypeScript Web3 ThreeJS Poimandres React-Three w Valtio Leva Control UI w Apollo Stores w MUI + Tailwind CSS](https://github.com/marty-mcgee/threed-garden/)

3D Dev Environment using React 18, TypeScript 5, Three.js React-Three-Fiber, on Next.js 14, Apollo Client, GraphQL, WordPress REST API, MUI 5 + Tailwind. ThreeD Web3 Interface for Three-Dimensional JavaScript Objects with React Server + Client Components, Web3 Contracts + more..

## Live Demo

🌱 [threedgarden.com](https://threedgarden.com)
🥕 [Demo: Participate](https://threedgarden.com/participate)

====

## For Developers

🤖 ["name": "threed-garden",](https://www.npmjs.com/package/threed-garden)
🤖 ["version": "0.15.0-beta.x",](https://www.npmjs.com/package/threed-garden?activeTab=versions)
🤖 ["code": "0.15.0-beta.x",](https://www.npmjs.com/package/threed-garden?activeTab=code)

### Install + Run

#### npm i threed-garden
#### git clone https://github.com/marty-mcgee/threed-garden.git

- app currently requires yarn: `npm install -G yarn`
- (you can instead, of course, use pnpm or npm easily)

1. install app: `yarn install`
2. run in local env: `yarn dev`
3. build for production: `yarn build`
4. start in production env: `yarn start`
4. deploy to preset location: `yarn deploy`

====

## FUNCTIONAL NOUNS : ACTIONS : GROUPS == NOUNS + ACTIONS + METADATA 🌱 🤖 🍅 🥕

- Noun | as root JS Object | interface INoun | wp_type threed_noun

--- Nouns

- Project | as JS Object | interface IProject | wp_type threed_project
- Scene | extends THREE.Scene | interface IScene | wp_type threed_scene
- Plan | as JS Object | interface IPlan | wp_type threed_plan
- ThreeD | as root JS Object | interface IThreeD | wp_type threed_threed
- File | as JS Object | interface IFile | wp_type threed_file
- Participant | as JS Object | interface IParticipant | wp_type threed_participant
- Character | as JS Object | interface ICharacter | wp_type threed_character

--- Actions

- Simulation | as JS Object | interface ISimulation | wp_type threed_simulation
- Game | extends Simulation | interface IGame | wp_type threed_game

--- Groups

- World | as JS Object | interface IWorld | wp_type threed_world
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

--- Helpers

- Tool | as JS Object | extends ThreeD? | interface ITool
- PlaneTool | extends Tool | interface IPlane
- Camera | extends Tool | extends THREE.Camera | interface ICamera
- Renderer | extends Tool | extends THREE.Renderer | interface IRenderer
- Light | extends Tool | extends THREE.Light.DirectionalLight | interface ILight
- Raster | extends Tool | extends THREE.Raster.Rasterizer | interface IRaster
- Shader | extends Tool | extends THREE.Shader.Shaderizer | interface IShader
- Animation | extends Tool | extends OBJ.animation | interface IAnimation

====

> a part of the 🌱 threed.ai code family
