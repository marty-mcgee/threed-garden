import { PropertyDefn, Property, UnsubscribeCallback } from './Property';

/** A property which is computed from another property. */
export class ComputedProperty<T, S> extends Property<T, PropertyDefn<any>> {
  constructor(private base: Property<S, any>, private transform: (value: S) => T) {
    super('computed', base.defn.init, base.defn);
  }

  public reset(): void {
    this.base.reset();
  }

  public update(value: T) {
    throw new Error('Derived properties cannot be updated');
  }

  public get value(): T {
    return this.transform(this.base.value);
  }

  public subscribe(callback: (value: T) => void): UnsubscribeCallback {
    return this.base.subscribe((value: S) => callback(this.transform(value)));
  }
}
