import styled from "@emotion/styled";
import React, { FC } from "react";
import { MeshGenerator } from "./MeshGenerator";
import { usePropertyValue } from "./properties";
import { colors } from "./styles";

const StyledEl = styled.div`
  position: absolute;
  left: 16px;
  bottom: 16px;
  font-size: 14px;
  color: ${colors.overlayColor};
`;

interface Props {
  generator: MeshGenerator;
}

export const TriangleCount: FC<Props> = ({ generator }) => {
  const count = usePropertyValue(generator.triangleCount);
  return <StyledEl>{count}</StyledEl>
};
