// @ ts-nocheck /* OR @ ts-expect-error */

import { ResourceIndex } from "./stub";

export const BindingTargetDropdown = (props: {
  change(): void;
  resources: ResourceIndex;
  sequenceIdInput: number | undefined;
  specialActionInput: string | undefined;
}) => {
  props;
  return <div />;
};
