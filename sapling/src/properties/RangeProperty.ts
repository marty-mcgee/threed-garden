import Prando from "prando";
import { Property, PropertyDefn } from "./Property";

export type Range = [number, number];

export interface RangePropertyDefn extends PropertyDefn<Range> {
  init?: Range;
  min?: number;
  max?: number;
  increment?: number;
  precision?: number;
  logScale?: boolean;
}

export class RangeProperty extends Property<Range, RangePropertyDefn> {
  constructor(defn: RangePropertyDefn) {
    super('range', defn.init || [0, 0], { ...defn });
  }

  public reset() {
    this.update(this.defn.init || [0, 0]);
  }

  public get min(): number {
    return this.defn.min ?? 0;
  }

  public get max(): number {
    return this.defn.max ?? 1;
  }

  public get precision(): number {
    return this.defn.precision ?? 2;
  }

  public get increment(): number {
    return this.defn.increment ?? (this.max - this.min) / 100;
  }

  /** Return the median value of this range */
  public get medianValue(): number {
    return (this.data[0] + this.data[1]) * 0.5;
  }

  /** Return a random sample from within this range. */
  public sample(rnd: Prando) {
    return rnd.next(this.data[0], this.data[1]);
  }
}
