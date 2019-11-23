import styled, { css } from "styled-components/macro";

type Props = {
  disabled?: boolean;
  fullWidth?: boolean;
  color?: string;
  margin?: string;
};

const getColor = (props: Props) => {
  return props.color || `#7F39D3`;
};

const Button = styled.button<Props>`
  color: #fff;
  font-size: 15px;
  font-weight: bold;
  padding: 10px 24px;
  border: 2px solid ${getColor};
  border-radius: 4px;
  outline: none;
  cursor: pointer;

  background-color: ${getColor};

  ${props =>
    props.disabled &&
    css`
      opacity: 0.4;
    `}

  ${props =>
    props.fullWidth &&
    css`
      width: 100%;
    `}

  margin: ${p => p.margin || `0`}
`;

export default Button;
