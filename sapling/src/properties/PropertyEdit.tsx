import React, { FC, useCallback, useEffect, useState } from 'react';
import { Color } from 'three';
import { ColorEditor } from '../controls/ColorEditor';
import { ComboRangeSlider } from '../controls/ComboRangeSlider';
import { ComboSlider } from '../controls/ComboSlider';
import { BooleanEditor } from '../controls/BooleanEditor';
import { BooleanProperty } from './BooleanProperty';
import { ColorProperty } from './ColorProperty';
import { FloatProperty } from './FloatProperty';
import { IntegerProperty } from './IntegerProperty';
import { Property, useProperty, usePropertyEnabled } from './Property';
import { RangeProperty } from './RangeProperty';
import { EnumEditor } from '../controls/EnumEditor';

export const BooleanPropertyEdit: FC<{ name: string; property: BooleanProperty }> = ({
  name,
  property,
}) => {
  const [value, setValue] = useProperty(property);

  return <BooleanEditor name={name} value={value} onChange={setValue} />;
};

export const IntegerPropertyEdit: FC<{ name: string; property: IntegerProperty }> = ({
  name,
  property,
}) => {
  const [value, setValue] = useProperty(property);
  const { min, max, enumVals } = property.defn;

  if (enumVals) {
    return <EnumEditor name={name} value={value} enumVals={enumVals!} onChange={setValue} />;
  }

  return (
    <ComboSlider
      name={name}
      value={value}
      min={min}
      max={max || 0}
      precision={0}
      increment={1}
      onChange={setValue}
    />
  );
};

export const FloatPropertyEdit: FC<{ name: string; property: FloatProperty }> = ({
  name,
  property,
}) => {
  const [value, setValue] = useProperty(property);
  const { min, max, increment, precision, logScale } = property.defn;

  return (
    <ComboSlider
      name={name}
      value={value}
      min={min}
      max={max || 0}
      precision={precision}
      increment={increment}
      logScale={logScale}
      onChange={setValue}
    />
  );
};

export const RangePropertyEdit: FC<{ name: string; property: RangeProperty }> = ({
  name,
  property,
}) => {
  const [value, setValue] = useProperty(property);

  return (
    <ComboRangeSlider
      name={name}
      value={value}
      min={property.min}
      max={property.max}
      precision={property.precision}
      increment={property.increment}
      logScale={property.defn.logScale}
      onChange={setValue}
    />
  );
};

export const ColorPropertyEdit: FC<{ name: string; property: ColorProperty }> = ({
  name,
  property,
}) => {
  const [color, setColor] = useState(() => new Color(property.value));

  const onChange = useCallback(
    (value: number) => {
      // Changing the value triggers an onChange callback in the color editor due to HSL
      // conversion, we don't want that to happen if we're updating HSL.
      if (!ColorProperty.updateHSL) {
        color.setHex(value);
        property.update(value);
      }
    },
    [color, property]
  );

  useEffect(
    () =>
      property.subscribe(value => {
        color.setHex(value);
        // Trigger an HSL conversion
        if (ColorProperty.updateHSL) {
          setColor(color.clone());
        }
      }),
    [color, property]
  );

  return <ColorEditor name={name} value={color} onChange={onChange} />;
};

export const PropertyEdit: FC<{
  name: string;
  property: Property<any, any>;
}> = ({ name, property }) => {
  const enabled = usePropertyEnabled(property);

  if (!enabled) {
    return null;
  }

  switch (property.type) {
    case 'boolean':
      return <BooleanPropertyEdit name={name} property={property as BooleanProperty} />;

    case 'integer': {
      return <IntegerPropertyEdit name={name} property={property as IntegerProperty} />;
    }

    case 'float':
      return <FloatPropertyEdit name={name} property={property as FloatProperty} />;

    case 'range':
      return <RangePropertyEdit name={name} property={property as RangeProperty} />;

    case 'color':
      return <ColorPropertyEdit name={name} property={property as ColorProperty} />;

    default:
      throw Error(`Invalid property type: ${property.type} (${name})`);
  }
};
