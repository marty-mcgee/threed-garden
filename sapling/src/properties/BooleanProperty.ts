import { Property, PropertyDefn } from './Property';

export class BooleanProperty extends Property<boolean, PropertyDefn<boolean>> {
  constructor(defn: PropertyDefn<boolean>) {
    super('boolean', defn.init || false, {});
  }

  public reset() {
    this.update(this.defn.init || false);
  }
}
