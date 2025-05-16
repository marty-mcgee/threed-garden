/* eslint-disable max-len */
import { sampleSize } from "lodash";

export const LIB_DIR = "/3D/lib/";

export const ASSETS: Record<string, Record<string, string>> = {
  fonts: {
    cabinBold: "/3D/fonts/Cabin_Bold.json",
  },
  textures: {
    cloud: "/3D/textures/cloud.avif",
    grass: "/3D/textures/grass.avif",
    wood: "/3D/textures/wood.avif",
    soil: "/3D/textures/soil.avif",
    aluminum: "/3D/textures/aluminum.avif",
    concrete: "/3D/textures/concrete.avif",
    screen: "/3D/textures/screen.avif",
    bricks: "/3D/textures/bricks.avif",
  },
  shapes: {
    track: "/3D/shapes/track.svg",
    column: "/3D/shapes/column.svg",
    beam: "/3D/shapes/beam.svg",
    zAxis: "/3D/shapes/z_axis.svg",
  },
  models: {
    gantryWheelPlate: "/3D/models/gantry_wheel_plate.glb",
    leftBracket: "/3D/models/left_bracket.glb",
    rightBracket: "/3D/models/right_bracket.glb",
    crossSlide: "/3D/models/cross_slide.glb",
    beltClip: "/3D/models/belt_clip.glb",
    zStop: "/3D/models/z_stop.glb",
    utm: "/3D/models/utm.glb",
    ccHorizontal: "/3D/models/cc_horizontal.glb",
    ccVertical: "/3D/models/cc_vertical.glb",
    housingVertical: "/3D/models/housing_vertical.glb",
    horizontalMotorHousing: "/3D/models/horizontal_motor_housing.glb",
    zAxisMotorMount: "/3D/models/z_axis_motor_mount.glb",
    toolbay3: "/3D/models/toolbay_3.glb",
    rotaryTool: "/3D/models/rotary_tool.glb",
    seeder: "/3D/models/seeder.glb",
    seedTray: "/3D/models/seed_tray.glb",
    seedBin: "/3D/models/seed_bin.glb",
    seedTroughAssembly: "/3D/models/seed_trough_assembly.glb",
    seedTroughHolder: "/3D/models/seed_trough_holder.glb",
    soilSensor: "/3D/models/soil_sensor.glb",
    wateringNozzle: "/3D/models/watering_nozzle.glb",
    vacuumPumpCover: "/3D/models/vacuum_pump_cover.glb",
    pi: "/3D/models/pi.glb",
    farmduino: "/3D/models/farmduino.glb",
    cameraMountHalf: "/3D/models/camera_mount_half.glb",
    solenoid: "/3D/models/solenoid.glb",
    xAxisCCMount: "/3D/models/x_axis_cc_mount.glb",
    box: "/3D/models/box.glb",
    btn: "/3D/models/push_button.glb",
    led: "/3D/models/led_indicator.glb",
  },
  other: {
    gear: "/app-resources/img/icons/settings.svg",
    weed: "/3D/icons/generic-weed.avif",
    plant: "/3D/icons/generic-plant.avif",
  },
  people: {
    person1: "/3D/people/person_1.avif",
    person1Flipped: "/3D/people/person_1_flipped.avif",
    person2: "/3D/people/person_2.avif",
    person2Flipped: "/3D/people/person_2_flipped.avif",
    person3: "/3D/people/person_3.avif",
    person3Flipped: "/3D/people/person_3_flipped.avif",
    person4: "/3D/people/person_4.avif",
    person4Flipped: "/3D/people/person_4_flipped.avif",
  },
};

interface Plant {
  label: string;
  spread: number;
  size: number;
}

interface Gardens {
  [key: string]: string[];
}

export const PLANTS: Record<string, Plant> = {
  anaheimPepper: {
    label: "Anaheim Pepper",
    spread: 400,
    size: 150,
  },
  arugula: {
    label: "Arugula",
    spread: 250,
    size: 180,
  },
  basil: {
    label: "Basil",
    spread: 250,
    size: 160,
  },
  beet: {
    label: "Beet",
    spread: 175,
    size: 150,
  },
  bibbLettuce: {
    label: "Bibb Lettuce",
    spread: 250,
    size: 200,
  },
  bokChoy: {
    label: "Bok Choy",
    spread: 210,
    size: 160,
  },
  broccoli: {
    label: "Broccoli",
    spread: 375,
    size: 250,
  },
  brusselsSprout: {
    label: "Brussels Sprout",
    spread: 300,
    size: 250,
  },
  carrot: {
    label: "Carrot",
    spread: 150,
    size: 125,
  },
  cauliflower: {
    label: "Cauliflower",
    spread: 400,
    size: 250,
  },
  celery: {
    label: "Celery",
    spread: 350,
    size: 200,
  },
  chard: {
    label: "Swiss Chard",
    spread: 300,
    size: 300,
  },
  cherryBelleRadish: {
    label: "Cherry Bell Radish",
    spread: 100,
    size: 100,
  },
  cilantro: {
    label: "Cilantro",
    spread: 180,
    size: 150,
  },
  collardGreens: {
    label: "Collard Greens",
    spread: 230,
    size: 230,
  },
  cucumber: {
    label: "Cucumber",
    spread: 400,
    size: 200,
  },
  eggplant: {
    label: "Eggplant",
    spread: 400,
    size: 200,
  },
  frenchBreakfastRadish: {
    label: "French Breakfast Radish",
    spread: 100,
    size: 100,
  },
  garlic: {
    label: "Garlic",
    spread: 175,
    size: 100,
  },
  goldenBeet: {
    label: "Golden Beet",
    spread: 175,
    size: 150,
  },
  hillbillyTomato: {
    label: "Hillbilly Tomato",
    spread: 400,
    size: 200,
  },
  icicleRadish: {
    label: "Icicle Radish",
    spread: 100,
    size: 100,
  },
  laciantoKale: {
    label: "Lacianto Kale",
    spread: 250,
    size: 220,
  },
  leek: {
    label: "Leek",
    spread: 200,
    size: 200,
  },
  napaCabbage: {
    label: "Napa Cabbage",
    spread: 400,
    size: 220,
  },
  okra: {
    label: "Okra",
    spread: 400,
    size: 200,
  },
  parsnip: {
    label: "Parsnip",
    spread: 180,
    size: 120,
  },
  rainbowChard: {
    label: "Rainbow Chard",
    spread: 250,
    size: 250,
  },
  redBellPepper: {
    label: "Red Bell Pepper",
    spread: 350,
    size: 200,
  },
  redCurlyKale: {
    label: "Red Curly Kale",
    spread: 350,
    size: 220,
  },
  redRussianKale: {
    label: "Red Russian Kale",
    spread: 250,
    size: 200,
  },
  runnerBean: {
    label: "Runner Bean",
    spread: 350,
    size: 200,
  },
  rutabaga: {
    label: "Rutabaga",
    spread: 200,
    size: 150,
  },
  savoyCabbage: {
    label: "Savoy Cabbage",
    spread: 400,
    size: 250,
  },
  shallot: {
    label: "Shallot",
    spread: 200,
    size: 140,
  },
  snapPea: {
    label: "Snap Pea",
    spread: 200,
    size: 150,
  },
  spinach: {
    label: "Spinach",
    spread: 250,
    size: 200,
  },
  sweetPotato: {
    label: "Sweet Potato",
    spread: 400,
    size: 180,
  },
  turmeric: {
    label: "Turmeric",
    spread: 250,
    size: 150,
  },
  turnip: {
    label: "Turnip",
    spread: 175,
    size: 150,
  },
  yellowOnion: {
    label: "Yellow Onion",
    spread: 200,
    size: 150,
  },
  zucchini: {
    label: "Zucchini",
    spread: 400,
    size: 250,
  },
};

export const GARDENS: Gardens = {
  "Spring": [
    "beet", "bibbLettuce", "broccoli", "carrot", "cauliflower", "rainbowChard",
    "icicleRadish", "redRussianKale", "bokChoy", "spinach", "snapPea",
  ],
  "Summer": [
    "anaheimPepper", "basil", "cucumber", "eggplant", "hillbillyTomato", "okra",
    "redBellPepper", "runnerBean", "sweetPotato", "zucchini",
  ],
  "Fall": [
    "arugula", "cherryBelleRadish", "cilantro", "collardGreens", "garlic",
    "goldenBeet", "leek", "laciantoKale", "turnip", "yellowOnion",
  ],
  "Winter": [
    "frenchBreakfastRadish", "napaCabbage", "parsnip", "redCurlyKale",
    "rutabaga", "savoyCabbage", "shallot", "turmeric", "celery", "brusselsSprout",
  ],
  "Random": sampleSize(Object.keys(PLANTS), 20),
};

export enum SeedTroughAssemblyMaterial {
  zero = "0.800000_0.800000_0.800000_0.000000_0.000000",
  one = "0.400000_0.400000_0.400000_0.000000_0.000000",
  two = "0.603922_0.647059_0.686275_0.000000_0.000000",
}

export enum SeedTroughHolderMaterial {
  zero = "0.603922_0.647059_0.686275_0.000000_0.000000",
  one = "0.800000_0.800000_0.800000_0.000000_0.000000",
}

export enum VacuumPumpCoverMaterial {
  zero = "0.800000_0.800000_0.800000_0.000000_0.000000",
  one = "0.603922_0.647059_0.686275_0.000000_0.000000",
}

export enum PartName {
  gantryWheelPlate = "Gantry_Wheel_Plate",
  leftBracket = "Left_Gantry_Corner_Bracket",
  rightBracket = "Right_Gantry_Corner_Bracket",
  crossSlide = "Cross-Slide_Plate",
  zStop = "Z-Axis_Hardstop",
  beltClip = "Belt_Clip_-_Slim",
  utm = "M5_Barb",
  ccHorizontal = "60mm_Horizontal_Cable_Carrier_Support",
  ccVertical = "60mm_Vertical_Cable_Carrier_Support",
  housingVertical = "80mm_Vertical_Motor_Housing",
  horizontalMotorHousing = "75mm_Horizontal_Motor_Housing",
  zAxisMotorMount = "Z-Axis_Motor_Mount",
  toolbay3 = "mesh0_mesh",
  toolbay3Logo = "mesh0_mesh_1",
  seeder = "Seeder_Brass_Insert",
  vacuumPump = "Lower_Vacuum_Tube",
  wateringNozzle = "M5_x_30mm_Screw",
  seedBin = "Seed_Bin",
  seedTray = "Seed_Tray",
  cameraMountHalf = "Camera_Mount_Half",
  pi = "Raspberry_Pi_4B",
  farmduino = "Farmduino",
  solenoid = "200mm_Zip_Tie",
  xAxisCCMount = "X-Axis_CC_Mount",
}

export enum ElectronicsBoxMaterial {
  box = "0.901961_0.901961_0.901961_0.000000_0.000000",
  gasket = "0.301961_0.301961_0.301961_0.000000_0.000000",
  lid = "0.564706_0.811765_0.945098_0.000000_0.623529",
  button = "0.701961_0.701961_0.701961_0.000000_0.000000",
  led = "0.600000_0.600000_0.600000_0.000000_0.000000",
}

// ***************************************************
// ** OLD CONSTANTS -- NOT BEING USED
export const EXAMPLE_PATH = 'cms-wordpress'
export const CMS_NAME = 'WordPress'
export const CMS_URL = 'https://wordpress.org'
export const HOME_OG_IMAGE_URL =
  'https://og-image.vercel.app/Next.js%20Blog%20Example%20with%20**WordPress**.png?theme=light&md=1&fontSize=75px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fnextjs-black-logo.svg&images=data%3Aimage%2Fsvg%2Bxml%2C%253C%253Fxml+version%3D%271.0%27+encoding%3D%27UTF-8%27%253F%253E%253Csvg+preserveAspectRatio%3D%27xMidYMid%27+version%3D%271.1%27+viewBox%3D%270+0+256+255%27+xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%253E%253Cg+fill%3D%27%2523464342%27%253E%253Cpath+d%3D%27m18.124+127.5c0+43.295+25.161+80.711+61.646+98.441l-52.176-142.96c-6.0691+13.603-9.4699+28.657-9.4699+44.515zm183.22-5.5196c0-13.518-4.8557-22.88-9.0204-30.166-5.5446-9.01-10.742-16.64-10.742-25.65+0-10.055+7.6259-19.414+18.367-19.414+0.48494+0+0.94491+0.060358+1.4174+0.087415-19.46-17.828-45.387-28.714-73.863-28.714-38.213+0-71.832+19.606-91.39+49.302+2.5662+0.077008+4.9847+0.13112+7.039+0.13112+11.441+0+29.151-1.3882+29.151-1.3882+5.8963-0.34758+6.5915+8.3127+0.7014+9.01+0+0-5.9255+0.69724-12.519+1.0427l39.832+118.48+23.937-71.79-17.042-46.692c-5.8901-0.3455-11.47-1.0427-11.47-1.0427-5.8942-0.3455-5.2033-9.3575+0.69099-9.01+0+0+18.064+1.3882+28.811+1.3882+11.439+0+29.151-1.3882+29.151-1.3882+5.9005-0.34758+6.5936+8.3127+0.7014+9.01+0+0-5.938+0.69724-12.519+1.0427l39.528+117.58+10.91-36.458c4.7287-15.129+8.3273-25.995+8.3273-35.359zm-71.921+15.087l-32.818+95.363c9.7988+2.8805+20.162+4.4561+30.899+4.4561+12.738+0+24.953-2.202+36.323-6.2002-0.29346-0.46829-0.55987-0.96572-0.77841-1.5069l-33.625-92.112zm94.058-62.046c0.47037+3.4841+0.73678+7.2242+0.73678+11.247+0+11.1-2.073+23.577-8.3169+39.178l-33.411+96.599c32.518-18.963+54.391-54.193+54.391-94.545+0.002081-19.017-4.8557-36.899-13.399-52.48zm-95.977-75.023c-70.304+0-127.5+57.196-127.5+127.5+0+70.313+57.2+127.51+127.5+127.51+70.302+0+127.51-57.194+127.51-127.51-0.002082-70.304-57.209-127.5-127.51-127.5zm0+249.16c-67.08+0-121.66-54.578-121.66-121.66+0-67.08+54.576-121.65+121.66-121.65+67.078+0+121.65+54.574+121.65+121.65+0+67.084-54.574+121.66-121.65+121.66z%27%2F%253E%253C%2Fg%253E%253C%2Fsvg%253E'
