import styled from '@emotion/styled';
import { colors } from '../styles';
import { MomentaryButton } from './MomentaryButton';

export const ControlName = styled.span`
  align-self: stretch;
  color: ${colors.comboLabel};
  flex: 1;
  font-size: 12px;
  line-height: 22px;
  z-index: 1;
  pointer-events: none;
`;

export const ControlValue = styled.span`
  color: ${colors.comboText};
  font-size: 12px;
  z-index: 1;
  pointer-events: none;
`;

const ArrowButton = styled(MomentaryButton)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 25px;

  &:after {
    position: relative;
    font-size: 12px;
    line-height: 24px;
    color: ${colors.comboArrow};
  }

  &.active:after {
    color: #000;
  }

  &:hover {
    background-color: ${colors.comboArrowBgHover};
  }
`;

export const ArrowButtonLeft = styled(ArrowButton)`
  &:after {
    content: '\\25c0';
  }
`;

export const ArrowButtonRight = styled(ArrowButton)`
  &:after {
    content: '\\25b6';
  }
`;
