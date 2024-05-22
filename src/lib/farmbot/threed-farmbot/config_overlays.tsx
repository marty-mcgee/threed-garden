// @ts-nocheck /* OR @ ts-expect-error */

import React from "react";
import { Config, modifyConfig } from "./config";

export interface ToolTip {
  timeoutId: number;
  text: string;
}

interface OverlayProps {
  config: Config;
  setConfig(config: Config): void;
  toolTip: ToolTip;
  setToolTip(tooltip: ToolTip): void;
  activeFocus: string;
  setActiveFocus(focus: string): void;
}

interface SectionProps {
  title: string;
  configKey: keyof Config;
  options: Record<string, string>;
}

export const PublicOverlay = (props: OverlayProps) => {
  const { config, setConfig, toolTip, setToolTip } = props;

  const Section = (sectionProps: SectionProps) => {
    const { title, configKey, options } = sectionProps;
    return <div className={"setting-section"}>
      <div className="setting-title">{title}</div>
      <div className={"row"}>
        {Object.entries(options).map(([preset, label]) => {
          const active = label == config[configKey];
          const disabled = label == "Mobile"
            && config.sizePreset == "Genesis XL";
          const className = [
            preset,
            active ? "active" : "",
            disabled ? "disabled" : "",
          ].join(" ");
          const update = { [configKey]: label };
          return <button key={preset} className={className}
            onClick={() => {
              clearTimeout(toolTip.timeoutId);
              if (disabled) {
                const text = "Mobile beds are not recommended for Genesis XL machines";
                const timeoutId = setTimeout(() =>
                  setToolTip({ timeoutId: 0, text: "" }), 3000);
                setToolTip(({ timeoutId, text }));
                return;
              } else {
                setToolTip({ timeoutId: 0, text: "" });
              }
              setConfig(modifyConfig(config, update));
            }}>
            {label}
          </button>;
        })}
      </div>
    </div>;
  };

  return <div className={"overlay"}>
    {!props.activeFocus &&
    <div className={"settings-bar"}>
      <Section
        title={"FarmBot"}
        configKey={"sizePreset"}
        options={{
          "genesis": "Genesis",
          "genesis-xl": "Genesis XL",
        }} />
      <Section
        title={"Season"}
        configKey={"plants"}
        options={{
          "winter": "Winter",
          "spring": "Spring",
          "summer": "Summer",
          "fall": "Fall",
        }} />
      <Section
        title={"Bed Type"}
        configKey={"bedType"}
        options={{
          "standard": "Standard",
          "mobile": "Mobile",
        }} />
      <Section
        title={"Environment"}
        configKey={"scene"}
        options={{
          "outdoor": "Outdoor",
          "lab": "Lab",
        }} />
    </div>}
    {config.promoInfo && !props.activeFocus &&
      <PromoInfo isGenesis={config.sizePreset == "Genesis"} />}
  </div>;
};

interface PromoInfoProps {
  isGenesis: boolean;
}

const PromoInfo = (props: PromoInfoProps) => {
  const { isGenesis } = props;
  return <div className="promo-info">
    <h2 className="title">Explore our models</h2>
    {isGenesis ? (
      <div className="description">
        <p className="short">FarmBot Genesis is our flagship kit for prosumers and enthusiasts.</p>
        <p className="full">
          FarmBot Genesis is our flagship kit for prosumers and enthusiasts featuring
          our most advanced technology, features, and options. Coming 90% pre-assembled
          in the box, Genesis can be installed on an existing raised bed in an afternoon.
          It is suitable for fixed or mobile raised beds in classrooms, research labs,
          and backyards.
        </p>
      </div>
    ) : (
      <div className="description">
        <p className="short">Covering 400% the area, Genesis XL can grow enough veggies for a family of four.</p>
        <p className="full">
          Covering 400% the area, FarmBot Genesis XL can grow enough veggies
          for a family of four, provides ample room for student competitions,
          and can take research experiments to new scale. Suitable for fixed installations
          at home, farm to fork restaurants, schools and universities, and commercial research facilities.
        </p>
      </div>
    )}
    <a className="buy-button"
      target="_top"
      href={isGenesis ?
        "https://farm.bot/collections/farmbot-kits/products/farmbot-genesis-v1-7" :
        "https://farm.bot/collections/farmbot-kits/products/farmbot-genesis-xl-v1-7"}>
      <p>Order Genesis</p>
      <p className="genesis-xl" style={{ display: isGenesis ? "none" : "inline-block" }}>
        XL
      </p>
    </a>
  </div>;
};

interface ConfigRowProps {
  configKey: keyof Config;
  children: React.ReactNode;
}

const ConfigRow = (props: ConfigRowProps) => {
  const { configKey } = props;
  return <div className={"config-row"}>
    <span className={"config-key"}>{configKey}</span>
    {props.children}
  </div>;
};

interface SliderProps extends OverlayProps {
  configKey: keyof Config;
  min: number;
  max: number;
}

const Slider = (props: SliderProps) => {
  const { config, setConfig, configKey, min, max } = props;
  const change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.currentTarget.value);
    if (isNaN(newValue)) { return; }
    const update = { [configKey]: newValue };
    setConfig(modifyConfig(config, update));
  };
  const value = config[configKey] as number;
  return <ConfigRow configKey={configKey}>
    <input type={"number"} value={value} onChange={change} />
    <input
      type={"range"}
      min={min}
      max={max}
      value={value}
      onChange={change}
    />
  </ConfigRow>;
};

interface ToggleProps extends OverlayProps {
  configKey: keyof Config;
}

const Toggle = (props: ToggleProps) => {
  const { config, setConfig, configKey } = props;
  return <ConfigRow configKey={configKey}>
    <input
      type={"checkbox"}
      checked={!!config[configKey]}
      onChange={e => {
        const newValue = e.currentTarget.checked;
        const update = { [configKey]: newValue };
        setConfig(modifyConfig(config, update));
      }}
    />
  </ConfigRow>;
};

interface RadioProps extends OverlayProps {
  configKey: keyof Config;
  options: string[];
}

const Radio = (props: RadioProps) => {
  const { config, setConfig, configKey, options } = props;
  const change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.currentTarget.value;
    const update = { [configKey]: newValue };
    setConfig(modifyConfig(config, update));
  };
  return <ConfigRow configKey={configKey}>
    <div className={"options"}>
      {options.map(value =>
        <div key={value}>
          <input key={value}
            type={"radio"}
            name={configKey}
            value={value}
            checked={config[configKey] == value}
            onChange={change}
          />
          <label>{value}</label>
        </div>)}
    </div>
  </ConfigRow>;
};

export const PrivateOverlay = (props: OverlayProps) => {
  const bedMin = props.config.bedWallThickness * 2;
  const { config, setConfig } = props;
  return <div className={"all-configs"}>
    <details>
      <summary>
        {"Configs"}
        <p className={"close"}
          onClick={() => setConfig(modifyConfig(config, { config: false }))}>
          X
        </p>
      </summary>
      <div className={"spacer"} />
      <Toggle {...props} configKey={"promoInfo"} />
      <label>{"Presets"}</label>
      <Radio {...props} configKey={"sizePreset"}
        options={["Jr", "Genesis", "Genesis XL"]} />
      <Radio {...props} configKey={"bedType"}
        options={["Standard", "Mobile"]} />
      <Radio {...props} configKey={"otherPreset"}
        options={["Initial", "Minimal", "Maximal", "Reset all"]} />
      <label>{"Bot Position"}</label>
      <Slider {...props} configKey={"x"} min={0} max={props.config.botSizeX} />
      <Slider {...props} configKey={"y"} min={0} max={props.config.botSizeY} />
      <Slider {...props} configKey={"z"} min={0} max={props.config.botSizeZ} />
      <Radio {...props} configKey={"tool"} options={["rotaryTool", "None"]} />
      <Toggle {...props} configKey={"trail"} />
      <Toggle {...props} configKey={"laser"} />
      <label>{"Bot Dimensions"}</label>
      <Slider {...props} configKey={"botSizeX"} min={0} max={6000} />
      <Slider {...props} configKey={"botSizeY"} min={0} max={4000} />
      <Slider {...props} configKey={"botSizeZ"} min={0} max={1000} />
      <Toggle {...props} configKey={"bounds"} />
      <Toggle {...props} configKey={"xyDimensions"} />
      <Toggle {...props} configKey={"zDimension"} />
      <Toggle {...props} configKey={"axes"} />
      <Slider {...props} configKey={"beamLength"} min={0} max={4000} />
      <Slider {...props} configKey={"columnLength"} min={0} max={1000} />
      <Slider {...props} configKey={"zAxisLength"} min={0} max={2000} />
      <Slider {...props} configKey={"bedXOffset"} min={-500} max={500} />
      <Slider {...props} configKey={"bedYOffset"} min={-1500} max={1500} />
      <Slider {...props} configKey={"zGantryOffset"} min={0} max={500} />
      <Toggle {...props} configKey={"tracks"} />
      <Toggle {...props} configKey={"cableCarriers"} />
      <Toggle {...props} configKey={"bot"} />
      <label>{"Bed Properties"}</label>
      <Slider {...props} configKey={"bedWallThickness"} min={0} max={200} />
      <Slider {...props} configKey={"bedHeight"} min={0} max={1000} />
      <Slider {...props} configKey={"ccSupportSize"} min={0} max={200} />
      <Slider {...props} configKey={"bedWidthOuter"} min={bedMin} max={3100} />
      <Slider {...props} configKey={"bedLengthOuter"} min={bedMin} max={6100} />
      <Slider {...props} configKey={"bedZOffset"} min={0} max={1000} />
      <Slider {...props} configKey={"legSize"} min={0} max={200} />
      <Toggle {...props} configKey={"legsFlush"} />
      <Slider {...props} configKey={"extraLegsX"} min={0} max={10} />
      <Slider {...props} configKey={"extraLegsY"} min={0} max={10} />
      <Slider {...props} configKey={"bedBrightness"} min={1} max={12} />
      <Slider {...props} configKey={"soilBrightness"} min={1} max={12} />
      <Slider {...props} configKey={"soilHeight"} min={0} max={1000} />
      <label>{"Garden"}</label>
      <Radio {...props} configKey={"plants"}
        options={["Winter", "Spring", "Summer", "Fall", "Random", "None"]} />
      <label>{"Camera"}</label>
      <Toggle {...props} configKey={"perspective"} />
      <Toggle {...props} configKey={"zoom"} />
      <Toggle {...props} configKey={"pan"} />
      <Toggle {...props} configKey={"lowDetail"} />
      <label>{"Environment"}</label>
      <Radio {...props} configKey={"scene"}
        options={["Outdoor", "Lab"]} />
      <Toggle {...props} configKey={"ground"} />
      <Toggle {...props} configKey={"grid"} />
      <Toggle {...props} configKey={"utilitiesPost"} />
      <Toggle {...props} configKey={"packaging"} />
      <Toggle {...props} configKey={"labels"} />
      <Toggle {...props} configKey={"labelsOnHover"} />
      <Toggle {...props} configKey={"clouds"} />
      <Toggle {...props} configKey={"solar"} />
      <Toggle {...props} configKey={"lab"} />
      <Toggle {...props} configKey={"people"} />
      <Slider {...props} configKey={"sunInclination"} min={0} max={180} />
      <Slider {...props} configKey={"sunAzimuth"} min={0} max={360} />
      <label>{"Dev"}</label>
      <Toggle {...props} configKey={"threeAxes"} />
      <Toggle {...props} configKey={"stats"} />
      <Toggle {...props} configKey={"viewCube"} />
      <Toggle {...props} configKey={"config"} />
    </details>
  </div>;
};

