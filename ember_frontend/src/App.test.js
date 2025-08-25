import { render } from '@testing-library/react';
import App from './App';

test('renders game component', () => {
  const { container } = render(<App />);
  expect(container).toBeTruthy();
});
