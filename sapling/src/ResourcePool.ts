/** Various three.js objects need to be disposed after use. This class tracks such
    entities so that the app logic doesn't have to. */
export interface Disposable {
  dispose(): void;
}

/** Collection of disposeable objects. */
export class ResourcePool implements Disposable {
  private contents: Disposable[] = [];

  constructor() {
    this.add = this.add.bind(this);
  }

  /** Dispose all objects in the pool, and then clear the pool. */
  public dispose() {
    this.contents.forEach(disposable => disposable.dispose());
    this.contents.length = 0;
  }

  /** Add an object to the pool. Returns the object after adding it. */
  public add<T extends Disposable>(disposable: T): T {
    this.contents.push(disposable);
    return disposable;
  }

  /** Remove an object from the pool. */
  public remove<T extends Disposable>(disposable: T): T {
    const index = this.contents.indexOf(disposable);
    if (index >= 0) {
      this.contents.splice(index, 1);
    }
    return disposable;
  }
}