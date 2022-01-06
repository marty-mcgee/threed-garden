import styled from '@emotion/styled';
import { colors } from '../styles';

export const Button = styled.button`
  border: 1px solid ${colors.buttonBorder};
  border-radius: 4px;
  background: ${colors.buttonBg};
  color: ${colors.text};
  font-weight: 500;
  height: 2rem;
  padding: 0 16px;
  outline: none;
  &:focus {
    box-shadow: 0 0 1px 2px ${colors.focusOutline};
  }

  &[disabled] {
    opacity: 0.5;
  }
`;
