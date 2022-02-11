import React from 'react';
import { FC } from 'react';
import { ControlGroup } from '../controls/ControlGroup';
import { PropertyEdit } from './PropertyEdit';
import { PropertyGroup } from '.';

interface Props {
  group: PropertyGroup;
  groupName: string;
}

export const PropertyGroupEdit: FC<Props> = ({ group, groupName }) => {
  return (
    <ControlGroup key={groupName}>
      <header>{groupName}</header>
      {Object.keys(group).map(propName => (
        <PropertyEdit key={propName} name={propName} property={(group as any)[propName]} />
      ))}
    </ControlGroup>
  );
};
