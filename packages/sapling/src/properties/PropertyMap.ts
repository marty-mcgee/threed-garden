import { PropertyGroup } from './PropertyGroup';
import { RepeatingPropertyGroup } from './RepeatingPropertyGroup';

export interface PropertyMap {
  [key: string]: PropertyGroup | RepeatingPropertyGroup<any>;
}

export function propertyMapToJson(propMap: PropertyMap): any {
  const result: any = {};
  for (const key in propMap) {
    const group = propMap[key];
    if (group instanceof RepeatingPropertyGroup) {
      result[key] = group.toJson();
    } else {
      result[key] = group.toJson();
    }
  }
  return result;
}
