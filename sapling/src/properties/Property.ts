import { useCallback, useEffect, useState } from 'react';

export type PropertyType =
  | 'boolean'
  | 'integer'
  | 'float'
  | 'color'
  | 'range'
  | 'repeat'
  | 'computed';
export type UnsubscribeCallback = () => void;

/** Property metadata for editing. */
export interface PropertyDefn<T> {
  init?: T;

  // Allows selective enabling / disabling of properties.
  enabled?: Property<boolean, any>;
}

/** An editable property that notifies listeners. */
export abstract class Property<T, D extends PropertyDefn<T>> {
  public readonly defn: Readonly<D>;
  protected data: T;
  private listeners = new Set<(value: T) => void>();

  constructor(public readonly type: PropertyType, init: T, defn: D) {
    this.data = init;
    this.defn = defn;
  }

  public abstract reset(): void;

  /** Update the value of the property.
      @param value The new value of the property.
      @param jump .
  */
  public update(value: T) {
    if (this.data !== value) {
      this.data = value;
      this.emit();
    }
  }

  /** Return the current value of the property. */
  public get value(): T {
    return this.data;
  }

  public emit() {
    this.listeners.forEach(listener => listener(this.data));
    globalListeners.forEach(listener => listener(this));
  }

  public subscribe(callback: (value: T) => void): UnsubscribeCallback {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public get isEnabled(): boolean {
    return this.defn.enabled ? this.defn.enabled.value : true;
  }
}

/** React hook that automatically subscribes to the value. */
export function usePropertyValue<T>(prop: Property<T, PropertyDefn<T>>): T {
  const [, updateState] = useState({});
  useEffect(() => prop.subscribe(() => updateState({})), [prop]);
  return prop.value;
}

/** React hook that automatically subscribes to the value and allows updates. */
export function useProperty<T>(prop: Property<T, PropertyDefn<T>>): [T, (value: T) => void] {
  const value = usePropertyValue(prop);
  return [value, useCallback(newVal => prop.update(newVal), [prop])];
}

/** Hook that updates when the enabled / disabled state of a property changes. */
export function usePropertyEnabled<T>(prop: Property<T, PropertyDefn<T>>): boolean {
  const [enabled, setEnabled] = useState(prop.isEnabled);

  useEffect(() => {
    if (prop.defn.enabled) {
      return prop.defn.enabled.subscribe(setEnabled);
    }
  }, [prop]);

  return enabled;
}

export const globalListeners = new Set<(prop: Property<any, PropertyDefn<any>>) => void>();

export function addGlobalListener(
  callback: (value: Property<any, PropertyDefn<any>>) => void
): UnsubscribeCallback {
  globalListeners.add(callback);
  return () => globalListeners.delete(callback);
}

export interface SerializableGroup {
  toJson(): any;
  fromJson(json: any): this;
  reset(): void;
}
