/**
 * HkaAngleCard affiche la mesure d'angle HKA — donnée médicale centrale du
 * rapport. Ces tests couvrent le classement clinique (dans/hors plage),
 * le formatage de l'angle, les deux modes d'affichage (bilatéral vs simple)
 * et les cas limites (côté non mesuré, angle indisponible).
 */
import React from "react";
import { render } from "@testing-library/react-native";
import { HkaAngleCard, classifyHka } from "../hka-angle-card";

describe("classifyHka", () => {
  it("classe 'below' sous la norme adulte (175°)", () => {
    expect(classifyHka(174.9)).toBe("below");
  });

  it("classe 'in_range' aux bornes de la norme (175°–180°)", () => {
    expect(classifyHka(175)).toBe("in_range");
    expect(classifyHka(180)).toBe("in_range");
    expect(classifyHka(177.5)).toBe("in_range");
  });

  it("classe 'above' au-dessus de la norme adulte (180°)", () => {
    expect(classifyHka(180.1)).toBe("above");
  });
});

describe("HkaAngleCard — affichage simple (angleValue)", () => {
  it("affiche l'angle formaté à une décimale avec le badge 'Dans la plage'", () => {
    const { getByText } = render(
      <HkaAngleCard angleValue={177.46} confidenceScore={0.9} />,
    );
    // toFixed(1) arrondit 177.46 → 177.5
    expect(getByText("177.5°")).toBeTruthy();
    expect(getByText("Dans la plage")).toBeTruthy();
  });

  it("affiche le badge 'Sous la plage' pour un angle en dessous de la norme", () => {
    const { getByText } = render(
      <HkaAngleCard angleValue={170} confidenceScore={0.7} />,
    );
    expect(getByText("170.0°")).toBeTruthy();
    expect(getByText("Sous la plage")).toBeTruthy();
  });

  it("affiche le badge 'Au-dessus de la plage' pour un angle au-dessus de la norme", () => {
    const { getByText } = render(
      <HkaAngleCard angleValue={185} confidenceScore={0.7} />,
    );
    expect(getByText("185.0°")).toBeTruthy();
    expect(getByText("Au-dessus de la plage")).toBeTruthy();
  });

  it("affiche la sous-légende de la norme adulte", () => {
    const { getByText } = render(
      <HkaAngleCard angleValue={178} confidenceScore={0.9} />,
    );
    expect(getByText("Norme adulte : 175–180°")).toBeTruthy();
  });

  it("affiche le score ML arrondi en pourcentage", () => {
    const { getByText } = render(
      <HkaAngleCard angleValue={178} confidenceScore={0.873} />,
    );
    expect(getByText("Score ML : 87%")).toBeTruthy();
  });

  it("affiche un tiret pour un angle à 0 (non mesurable) tout en classant 'below'", () => {
    // formatAngle traite 0 comme une valeur indisponible (sentinelle),
    // mais classifyHka(0) < 175 → toujours classé "below" par le composant.
    const { getByText } = render(
      <HkaAngleCard angleValue={0} confidenceScore={0.5} />,
    );
    expect(getByText("—")).toBeTruthy();
    expect(getByText("Sous la plage")).toBeTruthy();
  });

  it("utilise le testID par défaut 'hka-angle-card'", () => {
    const { getByTestId } = render(
      <HkaAngleCard angleValue={178} confidenceScore={0.9} />,
    );
    expect(getByTestId("hka-angle-card")).toBeTruthy();
  });

  it("accepte un testID personnalisé", () => {
    const { getByTestId } = render(
      <HkaAngleCard angleValue={178} confidenceScore={0.9} testID="custom-id" />,
    );
    expect(getByTestId("custom-id")).toBeTruthy();
  });
});

describe("HkaAngleCard — affichage bilatéral (leftHKA + rightHKA)", () => {
  it("affiche l'en-tête bilatéral et les deux colonnes gauche/droite quand les deux côtés sont mesurés", () => {
    const { getByText } = render(
      <HkaAngleCard
        angleValue={0}
        confidenceScore={0.9}
        leftHKA={178}
        rightHKA={183}
      />,
    );
    expect(getByText("ANALYSE HKA BILATÉRALE")).toBeTruthy();
    expect(getByText("Jambe gauche")).toBeTruthy();
    expect(getByText("Jambe droite")).toBeTruthy();
    expect(getByText("178.0°")).toBeTruthy();
    expect(getByText("183.0°")).toBeTruthy();
    // gauche dans la plage, droite au-dessus
    expect(getByText("Dans la plage")).toBeTruthy();
    expect(getByText("Au-dessus de la plage")).toBeTruthy();
  });

  it("marque un côté 'Non disponible' quand sa mesure est à 0", () => {
    const { getByText, queryAllByText } = render(
      <HkaAngleCard
        angleValue={0}
        confidenceScore={0.9}
        leftHKA={178}
        rightHKA={0}
      />,
    );
    expect(getByText("Non disponible")).toBeTruthy();
    // le côté indisponible n'a pas de badge de statut
    expect(queryAllByText("Dans la plage")).toHaveLength(1);
  });

  it("bascule sur l'affichage simple quand un seul côté est fourni (props partielles)", () => {
    // hasBilateral exige leftHKA ET rightHKA définis ; un seul côté renseigné
    // retombe sur l'affichage mono-angle basé sur angleValue.
    const { queryByText, getByText } = render(
      <HkaAngleCard angleValue={179} confidenceScore={0.9} leftHKA={178} />,
    );
    expect(queryByText("ANALYSE HKA BILATÉRALE")).toBeNull();
    expect(getByText("ANGLE HKA")).toBeTruthy();
    expect(getByText("179.0°")).toBeTruthy();
  });

  it("bascule sur l'affichage simple quand les deux côtés sont à 0", () => {
    const { queryByText, getByText } = render(
      <HkaAngleCard
        angleValue={176}
        confidenceScore={0.9}
        leftHKA={0}
        rightHKA={0}
      />,
    );
    expect(queryByText("ANALYSE HKA BILATÉRALE")).toBeNull();
    expect(getByText("ANGLE HKA")).toBeTruthy();
    expect(getByText("176.0°")).toBeTruthy();
  });
});
