import React from 'react';
import { FC } from 'react';
import { ControlGroup } from '../controls/ControlGroup';
import { PropertyEdit } from '../properties/PropertyEdit';
import { AddRemoveGroups } from '../controls/AddRemoveGroups';
import { RepeatingPropertyGroup } from './RepeatingPropertyGroup';
import { usePropertyValue } from './Property';

interface Props {
  group: RepeatingPropertyGroup<any>;
  groupName: string;
}

export const RepeatingPropertyGroupEdit: FC<Props> = ({ group, groupName }) => {
  usePropertyValue(group);

  return (
    <React.Fragment>
      {group.groups.map((gr, index) => (
        <ControlGroup key={`${groupName}.${index}`}>
          <header>
            {groupName}[{index}]
            {index === 0 && <AddRemoveGroups group={group} />}
          </header>
          {Object.keys(gr).map(propName => (
            <PropertyEdit key={propName} name={propName} property={(gr as any)[propName]} />
          ))}
        </ControlGroup>
      ))}
    </React.Fragment>
  );
};
