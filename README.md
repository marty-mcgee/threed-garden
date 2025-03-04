# 🥕 ThreeD Garden

[🥕 ThreeD Garden: WebGL 3D Environment Interface for Next.JS React TypeScript Three.JS React-Three Physics, 2D Paper.JS, APIs: Apollo GraphQL, WordPress, CSS: Tailwind, Radix-UI, Libraries: FarmBot React 3D, AI: OpenAI, DeepThink](https://github.com/marty-mcgee/threed-garden/)

## Live Demo (v0.17.1-x)

🌱 [threedgarden.com](https://threedgarden.com)

🏡 [Demo: Advanced 3D + 2D](https://threedgarden.com/home-design)

🥕 [Demo: Basic 3D](https://threedgarden.com/participate)

## For Developers

🤖 Source Code: [github](https://github.com/marty-mcgee/threed-garden)

### Install + Run Options

`git clone https://github.com/marty-mcgee/threed-garden.git`

`yarn install threed-garden`

- note: you can use `yarn` or `npm` or `pnpm`

1. install app: `yarn install`
2. run in local env: `yarn dev`
3. build for production: `yarn build`
4. start in production env: `yarn start`
4. deploy to preset location: `yarn deploy`

====


The threed-garden package on npm is a JavaScript library designed to help developers create and manage 3D gardens or landscapes in web applications. It leverages WebGL or other 3D rendering technologies to render 3D plants, trees, and other garden elements in a browser environment. This library is particularly useful for creating interactive 3D visualizations, simulations, or games involving natural environments.
Key Features:

    3D Plant Rendering:

        The library provides tools to render various types of plants, trees, and shrubs in 3D.

        It may include customizable parameters for plant size, shape, color, and growth stages.

    Interactive Garden Design:

        Users can interactively design and modify gardens by adding, removing, or rearranging plants.

        It may support drag-and-drop functionality for placing plants in the 3D space.

    Realistic Environment Simulation:

        The library might include features to simulate environmental factors like sunlight, water, and soil conditions, affecting plant growth and appearance.

    Cross-Browser Compatibility:

        Built using WebGL or similar technologies, it ensures compatibility across modern web browsers.

    Customizable and Extendable:

        Developers can extend the library to add custom plants, textures, or environmental effects.

        It may support plugins or integrations with other 3D libraries like Three.js.

    Lightweight and Performant:

        Optimized for performance to ensure smooth rendering even with complex garden designs.

Use Cases:

    Educational Tools: Teaching about botany, ecology, or sustainable gardening practices.

    Gaming: Creating immersive 3D environments for games.

    Architectural Visualization: Designing landscapes for architectural projects.

    E-commerce: Allowing customers to visualize how plants will look in their gardens.

Installation:

You can install the library via npm:

yarn install threed-garden

Basic Usage Example:

Here’s a simple example of how you might use threed-garden to create a basic 3D garden:

import { ThreeDComponents, Garden, Plant } from 'threed-garden';

// Initialize a garden scene
const garden = new Garden({ container: '#garden-container' });

// Add a plant to the garden
const rose = new Plant({ type: 'rose', position: { x: 0, y: 0, z: 0 } });
garden.addPlant(rose);

// Render the garden
garden.render();

Documentation and Resources:

    The official documentation for threed-garden can typically be found on its npm page or GitHub repository.

    Look for examples, API references, and tutorials to get started.

Community and Support:

    Check the GitHub repository (if available) for issues, discussions, and contributions.

    The npm page may also include links to community forums or support channels.

If you’re interested in using this library, I recommend exploring its documentation and examples to understand its full capabilities and how it can fit into your project. Let me know if you need further assistance!


----



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
