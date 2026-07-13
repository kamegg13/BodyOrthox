import type { LinkingOptions } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

/**
 * Deep linking `bodyorthox://` — écrans clés adressables pour les futures
 * notifications et le partage. Seuls les écrans à paramètres sérialisables
 * sont mappés (Report reçoit des objets complets : non adressable par URL).
 *
 * Exemples :
 *   bodyorthox://patients
 *   bodyorthox://patient/<patientId>
 *   bodyorthox://patient/<patientId>/analyse/<analysisId>
 *   bodyorthox://capture/<patientId>
 *   bodyorthox://rapports · bodyorthox://reglages
 */
// Le typage récursif de PathConfigMap n'infère pas les param lists des
// navigateurs imbriqués sur deux niveaux (NavigatorScreenParams<Tabs> →
// NavigatorScreenParams<Stack>, RN v7 + TS 5.9) : `screens`/`initialRouteName`
// y sont rejetés à tort. La validité runtime des chemins est couverte par
// __tests__/linking.test.ts (getStateFromPath sur chaque route).
const config = {
  screens: {
      MainTabs: {
        screens: {
          AnalysesTab: {
            initialRouteName: "AnalysesHome",
            screens: {
              AnalysesHome: "accueil",
              PatientDetail: "patient/:patientId",
              Results: "patient/:patientId/analyse/:analysisId",
            },
          },
          PatientsTab: {
            initialRouteName: "PatientsList",
            screens: {
              PatientsList: "patients",
            },
          },
          RapportsTab: {
            screens: {
              RapportsHome: "rapports",
            },
          },
          CompteTab: {
            screens: {
              CompteHome: "reglages",
            },
          },
        },
      },
      Capture: "capture/:patientId",
  },
} as unknown as NonNullable<LinkingOptions<RootStackParamList>["config"]>;

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["bodyorthox://"],
  config,
};
