import React from 'react';
import { css } from 'emotion';
import { BUTTON_BACKGROUND_COLOR } from './tokens';

//const BUTTON_BACKGROUND_COLOR = '#efefef';

const buttonStyling = css`
  background: ${BUTTON_BACKGROUND_COLOR};
  border: 1px solid #808080;
  cursor: pointer;
  padding: 5px;
`;

const containerStyling = css`
  .${buttonStyling} {
    border: 3px solid #000;
  }
`;

export default function Button({ children }) {
  return <button className={buttonStyling}>{children}</button>;
}
