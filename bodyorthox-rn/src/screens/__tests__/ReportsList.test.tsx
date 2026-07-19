import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ReportsList, type ReportListItem } from "../ReportsList";

const items: readonly ReportListItem[] = [
  {
    analysisId: "a1",
    patientId: "patient-1",
    patientName: "Jean Dupont",
    date: "24 avr 2026",
    range: "in_range",
  },
  {
    analysisId: "a2",
    patientId: "patient-2",
    patientName: "Sophie Leclerc",
    date: "20 avr 2026",
    range: "out_of_range",
  },
];

const noop = () => undefined;

describe("ReportsList", () => {
  describe("recherche", () => {
    it("affiche la barre de recherche", () => {
      const { getByTestId } = render(
        <ReportsList
          items={items}
          hasAnyReports
          searchQuery=""
          onSearchChange={noop}
          rangeFilter="all"
          onRangeFilterChange={noop}
        />,
      );
      expect(getByTestId("reports-search-input")).toBeTruthy();
    });

    it("appelle onSearchChange à la saisie", () => {
      const onSearchChange = jest.fn();
      const { getByTestId } = render(
        <ReportsList
          items={items}
          hasAnyReports
          searchQuery=""
          onSearchChange={onSearchChange}
          rangeFilter="all"
          onRangeFilterChange={noop}
        />,
      );
      fireEvent.changeText(getByTestId("reports-search-input"), "Sophie");
      expect(onSearchChange).toHaveBeenCalledWith("Sophie");
    });

    it("affiche 'Aucun résultat' quand la recherche ne matche rien mais qu'il existe des rapports", () => {
      const { getByTestId, queryByTestId } = render(
        <ReportsList
          items={[]}
          hasAnyReports
          searchQuery="zzz"
          onSearchChange={noop}
          rangeFilter="all"
          onRangeFilterChange={noop}
        />,
      );
      expect(getByTestId("reports-empty-search")).toBeTruthy();
      expect(queryByTestId("reports-empty-none")).toBeNull();
    });

    it("affiche 'Aucun rapport' (message distinct) quand il n'existe aucun rapport du tout", () => {
      const { getByTestId, queryByTestId } = render(
        <ReportsList
          items={[]}
          hasAnyReports={false}
          searchQuery=""
          onSearchChange={noop}
          rangeFilter="all"
          onRangeFilterChange={noop}
        />,
      );
      expect(getByTestId("reports-empty-none")).toBeTruthy();
      expect(queryByTestId("reports-empty-search")).toBeNull();
    });
  });

  describe("filtre plage de référence", () => {
    it("affiche les chips avec 'Tous' actif par défaut", () => {
      const { getByTestId } = render(
        <ReportsList
          items={items}
          hasAnyReports
          searchQuery=""
          onSearchChange={noop}
          rangeFilter="all"
          onRangeFilterChange={noop}
        />,
      );
      expect(getByTestId("reports-range-chip-all").props.accessibilityState.selected).toBe(
        true,
      );
      expect(
        getByTestId("reports-range-chip-out_of_range").props.accessibilityState.selected,
      ).toBe(false);
    });

    it("appelle onRangeFilterChange au tap sur un chip", () => {
      const onRangeFilterChange = jest.fn();
      const { getByTestId } = render(
        <ReportsList
          items={items}
          hasAnyReports
          searchQuery=""
          onSearchChange={noop}
          rangeFilter="all"
          onRangeFilterChange={onRangeFilterChange}
        />,
      );
      fireEvent.press(getByTestId("reports-range-chip-out_of_range"));
      expect(onRangeFilterChange).toHaveBeenCalledWith("out_of_range");
    });
  });

  describe("liste", () => {
    it("affiche les rapports fournis et déclenche onItemPress", () => {
      const onItemPress = jest.fn();
      const { getByText } = render(
        <ReportsList
          items={items}
          hasAnyReports
          searchQuery=""
          onSearchChange={noop}
          rangeFilter="all"
          onRangeFilterChange={noop}
          onItemPress={onItemPress}
        />,
      );
      fireEvent.press(getByText("Jean Dupont"));
      expect(onItemPress).toHaveBeenCalledWith(items[0]);
    });
  });
});
