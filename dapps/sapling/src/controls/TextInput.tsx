import styled from '@emotion/styled';
import { colors } from '../styles';

export const TextInput = styled.input`
  background-color: ${colors.textInputBg};
  border: 1px solid ${colors.textInputBorder};
  border-radius: 3px;
  color: ${colors.textInputColor};
  outline: none;
  padding: 6px 8px;

  &:focus {
    box-shadow: 0 0 1px 2px inset ${colors.focusOutline};
  }

  &::selection {
    background-color: ${colors.textInputSelectionBg};
    color: ${colors.textInputSelectionColor};
  }
`;
