import React from 'react';
import { css } from 'emotion';

const backgroundColor = '#efefef';

const buttonStyling = css`
  background: ${backgroundColor};
  border: 1px solid #808080;
  cursor: pointer;
  padding: 5px;
`;

export default function Button({ children }) {
  return <button className={buttonStyling}>{children}</button>;
}
