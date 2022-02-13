import styled from '@emotion/styled';
import { colors } from '../styles';

export const ControlGroup = styled.section`
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;

  > header {
    align-self: stretch;
    color: ${colors.text};
    margin-bottom: 8px;
    position: relative;
    text-align: center;
  }

  & > .control:first-of-type {
    border-top: 1px solid ${colors.comboBorder};
    border-top-right-radius: 6px;
    border-top-left-radius: 6px;
  }

  & > .control:last-of-type {
    border-bottom-right-radius: 6px;
    border-bottom-left-radius: 6px;
  }
`;
