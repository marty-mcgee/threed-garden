import { Color } from 'three';
import { BooleanProperty } from '.';
import { ColorProperty } from './ColorProperty';
import { FloatProperty } from './FloatProperty';
import { IntegerProperty } from './IntegerProperty';
import { Property, SerializableGroup } from './Property';
import { RangeProperty, Range } from './RangeProperty';

type PropertyValue<T> = T extends BooleanProperty
  ? boolean
  : T extends IntegerProperty
  ? number
  : T extends FloatProperty
  ? number
  : T extends ColorProperty
  ? number
  : T extends RangeProperty
  ? Range
  : never;

export type GroupValues<T> = {
  readonly [P in keyof T]: PropertyValue<T[P]>;
};

export class PropertyGroup implements SerializableGroup {
  public get names(): string[] {
    return Object.getOwnPropertyNames(this);
  }

  public reset(): void {
    ColorProperty.updateHSL = true;
    Object.getOwnPropertyNames(this).forEach(name => {
      const prop = (this as any)[name] as Property<any, any>;
      if (prop?.reset) {
        prop?.reset();
      }
    });
    ColorProperty.updateHSL = false;
  }

  public toJson(): any {
    const result: any = {};
    Object.getOwnPropertyNames(this).forEach(name => {
      const property = (this as any)[name] as Property<any, any>;
      if (property.isEnabled) {
        const value = (this as any)[name].value;
        if (property.type === 'integer' && property.defn.enumVals) {
          result[name] = property.defn.enumVals[value] || 0;
        } else if (property.type === 'color') {
          result[name] = new Color(value).getStyle();
        } else {
          result[name] = value;
        }
      }
    });
    return result;
  }

  public fromJson(json: any): this {
    if (typeof json === 'object') {
      for (const propName in json) {
        const value = json[propName];
        const prop = (this as any)[propName] as Property<any, any>;
        switch (prop?.type) {
          case 'boolean': {
            if (typeof value === 'boolean') {
              prop.update(value);
            } else {
              console.warn(`incorrect type for property: ${propName}: ${typeof value}`)
            }
            break;
          }
          case 'float':
            if (typeof value === 'number') {
              prop.update(value);
            } else {
              console.warn(`incorrect type for property: ${propName}: ${typeof value}`)
            }
            break;
          case 'integer': {
            if (typeof value === 'number') {
              prop.update(value);
            } else if (typeof value === 'string') {
              const intProp = prop as IntegerProperty;
              const index = intProp.defn.enumVals?.indexOf(value) ?? -1;
              if (index >= 0) {
                prop.update(index);
              } else {
                console.warn(`unknown enum value for property: ${propName}: ${value}`)
              }
            } else {
              console.warn(`incorrect type for property: ${propName}: ${typeof value}`)
            }
            break;
          }
          case 'color': {
            const saveSyncColor = ColorProperty.updateHSL;
            if (typeof value === 'number') {
              ColorProperty.updateHSL = true;
              prop.update(value);
              ColorProperty.updateHSL = saveSyncColor;
            } else if (typeof value === 'string') {
              const color = new Color(value);
              ColorProperty.updateHSL = true;
              prop.update(color.getHex());
              ColorProperty.updateHSL = saveSyncColor;
            } else {
              console.warn(`incorrect type for property: ${propName}: ${typeof value}`)
            }
            break;
          }
          case 'range': {
            if (
              Array.isArray(value) &&
              value.length === 2 &&
              typeof value[0] === 'number' &&
              typeof value[1] === 'number'
            ) {
              prop.update(value);
            } else {
              console.warn(`incorrect type for property: ${propName}: ${typeof value}`)
            }
          }
        }
      }
    }
    return this;
  }

  public get values(): GroupValues<this> {
    const result: any = {};
    Object.getOwnPropertyNames(this).forEach(name => {
      result[name] = (this as any)[name].value;
    });
    return result;
  }
}
