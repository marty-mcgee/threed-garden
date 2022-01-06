import { Property, PropertyDefn } from './Property';

export interface FloatPropertyDefn extends PropertyDefn<number> {
  init?: number;
  min?: number;
  max?: number;
  increment?: number;
  precision?: number;
  logScale?: boolean;
}

export class FloatProperty extends Property<number, FloatPropertyDefn> {
  constructor(defn: FloatPropertyDefn) {
    const { min = 0, max = 1 } = defn;
    super('float', defn.init || 0, { precision: 2, increment: (max - min) / 100, ...defn });
  }

  public reset() {
    this.update(this.defn.init || 0);
  }
}
