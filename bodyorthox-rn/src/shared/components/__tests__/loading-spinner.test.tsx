import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingSpinner } from '../loading-spinner';

describe('LoadingSpinner', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<LoadingSpinner />);
    expect(toJSON()).toBeTruthy();
  });

  it('shows message when provided', () => {
    const { getByText } = render(<LoadingSpinner message="Chargement..." />);
    expect(getByText('Chargement...')).toBeTruthy();
  });

  it('does not show message when not provided', () => {
    const { queryByText } = render(<LoadingSpinner />);
    expect(queryByText('Chargement...')).toBeNull();
  });

  it('renders with fullScreen prop', () => {
    const { toJSON } = render(<LoadingSpinner fullScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with small size', () => {
    const { toJSON } = render(<LoadingSpinner size="small" />);
    expect(toJSON()).toBeTruthy();
  });
});
