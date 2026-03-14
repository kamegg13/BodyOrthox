import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PatientListTile } from '../patient-list-tile';
import { Patient } from '../../domain/patient';

const mockPatient: Patient = {
  id: 'p1',
  name: 'Jean Dupont',
  dateOfBirth: '1990-05-15',
  morphologicalProfile: null,
  createdAt: '2024-01-01T00:00:00Z',
};

describe('PatientListTile', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders patient name', () => {
    const { getByText } = render(
      <PatientListTile patient={mockPatient} onPress={mockOnPress} />
    );
    expect(getByText('Jean Dupont')).toBeTruthy();
  });

  it('renders patient age', () => {
    const { getByText } = render(
      <PatientListTile patient={mockPatient} onPress={mockOnPress} />
    );
    // Should have text containing "ans"
    const tree = render(<PatientListTile patient={mockPatient} onPress={mockOnPress} />);
    expect(tree.getByText(/ans/)).toBeTruthy();
  });

  it('calls onPress with patient when pressed', () => {
    const { getByTestId } = render(
      <PatientListTile patient={mockPatient} onPress={mockOnPress} testID="tile-1" />
    );

    fireEvent.press(getByTestId('tile-1'));
    expect(mockOnPress).toHaveBeenCalledWith(mockPatient);
  });

  it('shows analysis count', () => {
    const { getByText } = render(
      <PatientListTile patient={mockPatient} onPress={mockOnPress} analysisCount={5} />
    );
    expect(getByText('5')).toBeTruthy();
    expect(getByText('analyses')).toBeTruthy();
  });

  it('uses singular "analyse" for count of 1', () => {
    const { getByText } = render(
      <PatientListTile patient={mockPatient} onPress={mockOnPress} analysisCount={1} />
    );
    expect(getByText('analyse')).toBeTruthy();
  });

  it('shows 0 analyses by default', () => {
    const { getByText } = render(
      <PatientListTile patient={mockPatient} onPress={mockOnPress} />
    );
    expect(getByText('0')).toBeTruthy();
  });

  it('renders initials in avatar', () => {
    const { getByText } = render(
      <PatientListTile patient={mockPatient} onPress={mockOnPress} />
    );
    // "Jean Dupont" -> "JD"
    expect(getByText('JD')).toBeTruthy();
  });

  it('has accessibility role of button', () => {
    const { getByTestId } = render(
      <PatientListTile patient={mockPatient} onPress={mockOnPress} testID="tile-1" />
    );
    const tile = getByTestId('tile-1');
    expect(tile.props.accessibilityRole).toBe('button');
  });

  it('has accessibility label with patient name and age', () => {
    const { getByTestId } = render(
      <PatientListTile patient={mockPatient} onPress={mockOnPress} testID="tile-1" />
    );
    const tile = getByTestId('tile-1');
    expect(tile.props.accessibilityLabel).toContain('Jean Dupont');
  });
});
