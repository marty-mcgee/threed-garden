import { findIndex } from "lodash";
import { Config } from "./config";
import { threeSpace, zDir, zZero } from "./helpers";

export type VectorXyz = [x: number, y: number, z: number];

interface Focus {
  label: string;
  info: {
    description: string;
    position: VectorXyz;
    scale: number;
  };
  position: VectorXyz;
  camera: {
    position: VectorXyz;
    target: VectorXyz;
  };
}

export const FOCI = (config: Config): Focus[] => [
  {
    label: "What you can grow",
    info: {
      description: `<p>
        FarmBot is well suited to growing a polycrop of many common
        garden veggies at the same time. Crops we've had success with include
        Bok Choy, Lettuces, Radish, Beets, Chard, Arugula, Broccoli, and much
        more.
      <p>
      </p>
        By placing vining and other indeterminate crops near the ends
        of the bed and training them outwards, you can easily double or
        triple the area your plants can utilize while still being maintained
        by the FarmBot.
      </p>`,
      position: [
        0,
        config.bedWidthOuter * .8,
        300,
      ],
      scale: config.sizePreset == "Genesis XL" ? 7000 : 3500,
    },
    position: [
      threeSpace(config.bedLengthOuter / 2, config.bedLengthOuter),
      threeSpace(config.bedWidthOuter / 2, config.bedWidthOuter),
      150,
    ],
    camera: {
      position: [
        0,
        0,
        config.sizePreset == "Genesis XL" ? 10000 : 5000,
      ],
      target: [
        0,
        0,
        0,
      ],
    },
  },
  {
    label: "Included tools",
    info: {
      description: `<p>
        FarmBot comes with four tools to cover the basics of food production:
        the Seed Injector, Watering Nozzle, Soil Sensor, and Rotary Tool.
      </p>
      <p>
        Also included are the seed bin, seed tray, seed troughs, and the camera
        which remains permanently mounted to the Z-axis.
      </p>
      <iframe width="560" height="315"
        src="https://www.youtube.com/embed/f_GqlMAMWPk?si=q_gmlrgLiv1u-b1J"
        title="YouTube video player" frameborder="0" allow="accelerometer;
        autoplay; clipboard-write; encrypted-media; gyroscope;
        picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen>
      </iframe>`,
      position: [
        0,
        0,
        75,
      ],
      scale: 600,
    },
    position: [
      threeSpace(0, config.bedLengthOuter),
      threeSpace(config.bedWidthOuter / 2, config.bedWidthOuter),
      100,
    ],
    camera: {
      position: [
        650,
        -650,
        300,
      ],
      target: [
        0,
        0,
        -125,
      ],
    },
  },
  {
    label: "Universal Tool Mounting",
    info: {
      description: `<p>The Universal Tool Mount (UTM) allows FarmBot to automatically switch between a variety of lightweight
      tools — whichever one is appropriate for the task at hand (seeding,
      watering, weeding, etc). Using three neodymium ring magnets, tools
      are magnetically held in place during operation, but can be
      automatically dismounted in a toolbay when not in use.</p>

      <p>Once a tool has been mounted, FarmBot can power it up and communicate
      with it using the 12 gold-plated pogo pins inside the UTM. The stock
      connections include ground, 5v, 24v, as well as analog and digital I/O.
      Meanwhile, the remaining electrical connections are available for
      custom tooling such as specialized sensors or low power motorized
      implements. Additionally, the three liquid/gas ports provide water,
      vacuum air, and an expansion port for custom applications.</p>

      <p>Because FarmBot is 100% open-source, you can download our
      CAD models to start designing your own compatible creations.
      Tools can be 3D printed and wired up with common electrical hardware in
      just an afternoon.</p>`,
      position: [
        0,
        25,
        0,
      ],
      scale: 400,
    },
    position: [
      threeSpace(config.x, config.bedLengthOuter) + config.bedXOffset,
      threeSpace(config.y + 150, config.bedWidthOuter) + config.bedYOffset,
      zZero(config) + zDir * config.z,
    ],
    camera: {
      position: [
        500,
        -300,
        225,
      ],
      target: [
        0,
        -75,
        -25,
      ],
    },
  },
  {
    label: "Electronics",
    info: {
      description: `<p>
        FarmBot is powered by the workhorses of the DIY movement:
        the Raspberry Pi and a custom designed Arduino we call the <i>Farmduino</i>.
      </p>
      <p>
      This custom circuit board includes Trinamic TMC2130 stepper drivers
        with built-in quiet mode, an STM32 co-processor for monitoring the
        rotary encoders, five 24v peripheral outputs, and an H-bridge for
        reversible DC motor control at the UTM.
      </p>`,
      position: [
        0,
        200,
        175,
      ],
      scale: 600,
    },
    position: [
      threeSpace(config.x, config.bedLengthOuter) + config.bedXOffset - 50,
      threeSpace(-200, config.bedWidthOuter),
      config.columnLength - 150,
    ],
    camera: {
      position: [
        150,
        -550,
        400,
      ],
      target: [
        0,
        100,
        100,
      ],
    },
  },
  {
    label: "What you need to provide",
    info: {
      description: `<p>
        FarmBot must be plugged into a 110 or 220V outlet.
        The 30cm (1ft) power cord comes with a standard US 3-prong plug.
        You must connect this to your own extension cord if needed.
        Customers outside the US: you must provide a plug adapter if needed.
      </p>
      <p>
        FarmBot's water system has a 3/4″ female Garden Hose Thread (GHT)
        connection, meaning you can take a standard US garden hose and
        screw it into your FarmBot. You will need to provide a hose of
        the appropriate length.
      </p>
      <p>
        FarmBot can only be controlled using the web app, so an internet
        connection is required. The Raspberry Pi has built-in WiFi, though
        you may need to reposition your WiFi router or install a repeater
        to ensure a reliable connection.
      </p>`,
      position: [
        200,
        -200,
        0,
      ],
      scale: 1000,
    },
    position: [
      threeSpace(config.bedLengthOuter + 700, config.bedLengthOuter),
      threeSpace(config.legSize / 2, config.bedWidthOuter),
      250 - config.bedZOffset - config.bedHeight,
    ],
    camera: {
      position: [
        -1000,
        -1200,
        600,
      ],
      target: [
        0,
        -150,
        -100,],
    },
  },
  {
    label: "Planter bed",
    info: {
      description: `<p>
      All FarmBots must be mounted to a <a href="http://bed.farm.bot/" target="_blank">raised
      bed</a> or similar infrastructure. Neither materials for the bed nor
      soil are included with the kits because every installation will be
      different, and shipping lumber and soil would be prohibitively expensive.
      </p>`,
      position: [
        0,
        -config.bedWidthOuter / 2,
        config.sizePreset == "Genesis XL" ? 600 : 400,
      ],
      scale: config.sizePreset == "Genesis XL" ? 3000 : 1500,
    },
    position: [
      threeSpace(config.bedLengthOuter + 50, config.bedLengthOuter),
      0,
      -config.bedHeight / 2,
    ],
    camera: {
      position: [
        config.sizePreset == "Genesis XL" ? 4500 : 2500,
        config.sizePreset == "Genesis XL" ? -4500 : -1500 - config.bedWidthOuter / 2,
        1500,
      ],
      target: [
        0,
        -config.bedWidthOuter / 2,
        500,],
    },
  },
];

// eslint-disable-next-line react-refresh/only-export-components
export const getFocus = (config: Config, activeFocus: string) =>
  FOCI(config)[findIndex(FOCI(config), ["label", activeFocus])];

// eslint-disable-next-line react-refresh/only-export-components
export const getCamera = (
  config: Config,
  activeFocus: string,
  fallback: { position: VectorXyz, target: VectorXyz },
): { position: VectorXyz, target: VectorXyz } => {
  const focus = getFocus(config, activeFocus);
  return focus
    ? {
      position: [
        focus.position[0] + focus.camera.position[0],
        focus.position[1] + focus.camera.position[1],
        focus.position[2] + focus.camera.position[2],
      ],
      target: [
        focus.position[0] + focus.camera.target[0],
        focus.position[1] + focus.camera.target[1],
        focus.position[2] + focus.camera.target[2],
      ]
    }
    : fallback;
};
