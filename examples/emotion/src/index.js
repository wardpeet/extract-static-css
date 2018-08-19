import React from 'react';
import ReactDOM from 'react-dom';
import Button from './components/Button';

class App extends React.Component {
  render() {
    return <Button>Click me!</Button>;
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
