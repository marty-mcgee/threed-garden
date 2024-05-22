export interface ResourceIndex {

}
export const pinBindingLabel = (props: {
  resources: ResourceIndex;
  sequenceIdInput: number | undefined;
  specialActionInput: string | undefined;
}) => {
  props;
  return { label: undefined };
};
export const t = (string: string) => string;
export interface BoxTopBaseProps {
  showLabels?: boolean;
  isEditing: boolean;
  dispatch(): void;
  resources: ResourceIndex;
  botOnline: boolean;
  bot: {
    hardware: {
      informational_settings: {
        locked: boolean;
        sync_status: string;
      };
    };
  };
  firmwareHardware: string | undefined;
}
export interface PinBindingListItems {
  sequence_id: number;
  special_action: string;
}
export enum ButtonPin {
  estop = 1,
  unlock = 2,
  btn3 = 3,
  btn4 = 4,
  btn5 = 5,
}
export const setPinBinding = (props: {
  resources: ResourceIndex;
  binding: PinBindingListItems;
  dispatch(): void;
  pinNumber: number;
}) => {
  props;
  return () => { };
};
export const findBinding = (resources: ResourceIndex) => {
  resources;
  return (pinNumber: number) => {
    pinNumber;
    return {
      sequence_id: 1,
      special_action: "sync",
    };
  };
};
export const triggerBinding = (resources: ResourceIndex, botOnline: boolean) => {
  resources;
  botOnline;
  return (pinNumber: number) => {
    pinNumber;
    return () => { };
  };
};
export const isExpress = (firmwareHardware: string | undefined) => {
  return firmwareHardware == "express";
};
