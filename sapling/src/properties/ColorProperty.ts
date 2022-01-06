import { Property, PropertyDefn } from './Property';

export class ColorProperty extends Property<number, PropertyDefn<number>> {
  static updateHSL = false;

  constructor(defn: PropertyDefn<number>) {
    super('color', defn.init || 0, defn);
  }

  public reset() {
    this.update(this.defn.init || 0);
  }
}
