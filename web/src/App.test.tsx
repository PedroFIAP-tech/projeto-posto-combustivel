import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login title', () => {
  render(<App />);
  expect(screen.getByText(/acesso do frentista/i)).toBeInTheDocument();
});
