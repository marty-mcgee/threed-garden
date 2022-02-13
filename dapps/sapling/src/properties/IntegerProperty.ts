import { Property, PropertyDefn } from "./Property";

export interface IntegerPropertyDefn extends PropertyDefn<number> {
  init?: number;
  min?: number;
  max?: number;
  increment?: number;
  enumVals?: string[];
}

export class IntegerProperty extends Property<number, IntegerPropertyDefn> {
  constructor(defn: IntegerPropertyDefn) {
    const { min = 0, max = 1 } = defn;
    super('integer', defn.init || 0, { min, max, increment: 1, ...defn });
  }

  public reset() {
    this.update(this.defn.init || 0);
  }
}
