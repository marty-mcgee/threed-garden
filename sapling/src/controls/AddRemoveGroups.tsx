import React, { FC, useCallback } from 'react';
import styled from '@emotion/styled';
import { RepeatingPropertyGroup } from '../properties';
import { Button } from './Button';

const AddRemoveElt = styled.div`
  display: flex;
  position: absolute;
  right: 0;
  top: 0;
`;

const SmallButton = styled(Button)`
  height: 20px;
  padding: 0 8px;
  margin-left: 4px;
  line-height: 18px;
`;

interface Props {
  group: RepeatingPropertyGroup<any>;
}

export const AddRemoveGroups: FC<Props> = ({ group }) => {
  const onClickAdd = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      group.push();
    },
    [group]
  );

  const onClickRemove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      group.pop();
    },
    [group]
  );

  return (
    <AddRemoveElt className="control">
      <SmallButton onClick={onClickRemove} disabled={group.groups.length < 2}>
        &minus;
      </SmallButton>
      <SmallButton onClick={onClickAdd}>+</SmallButton>
    </AddRemoveElt>
  );
};
