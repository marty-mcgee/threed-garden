import { Property, PropertyDefn, SerializableGroup } from './Property';

export class RepeatingPropertyGroup<T extends SerializableGroup>
  extends Property<null, PropertyDefn<null>>
  implements SerializableGroup {
  public groups: T[] = [];

  constructor(public factory: () => T) {
    super('repeat', null, { init: null });
  }

  public reset(): void {
    return this.groups.forEach(gr => gr.reset());
  }

  public toJson(): any {
    return this.groups.map(gr => gr.toJson());
  }

  public fromJson(json: any): this {
    if (Array.isArray(json)) {
      this.groups = json.map(jsonGroup => this.factory().fromJson(jsonGroup));
    }
    this.emit();
    return this;
  }

  public push() {
    this.groups.push(this.factory());
    this.emit();
  }

  public pop() {
    this.groups.pop();
    this.emit();
  }

  public insert(index: number) {
    this.groups.splice(index, 0, this.factory());
    this.emit();
  }

  public remove(index: number) {
    this.groups.splice(index, 1);
    this.emit();
  }
}
