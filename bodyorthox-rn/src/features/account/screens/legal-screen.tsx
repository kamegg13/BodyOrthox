import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Card } from "../../../components/Card";
import { NavBar } from "../../../components/NavBar";
import { SectionLabel } from "../../../components/SectionLabel";
import { LEGAL_CONSTANTS } from "../../../core/legal/legal-constants";
import { colors, fonts, fontSize, fontWeight, spacing } from "../../../theme/tokens";

const CONTACT_EMAIL = "contact@antidote-sport.fr";

/**
 * Mentions légales + politique de confidentialité.
 * Le contenu DOIT rester exact vis-à-vis de l'architecture réelle :
 * données patients 100 % on-device (jamais transmises), seuls le compte
 * praticien et le feedback transitent par l'API — cf. audit RGPD
 * docs/audit-rgpd-dm-2026-07-17.md (R-1).
 */
export function LegalScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <NavBar title="Mentions légales & confidentialité" back onBack={() => navigation.goBack()} />
      </SafeAreaView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        testID="legal-screen"
      >
        <SectionLabel>Statut de l’outil</SectionLabel>
        <Card style={styles.card}>
          <Text style={styles.paragraph}>{LEGAL_CONSTANTS.mdrDisclaimer}</Text>
        </Card>

        <SectionLabel style={styles.gap}>Éditeur</SectionLabel>
        <Card style={styles.card}>
          <Text style={styles.paragraph}>
            BodyOrthox est édité par Antidote Boost.{"\n"}
            Contact : {CONTACT_EMAIL}
          </Text>
        </Card>

        <SectionLabel style={styles.gap}>Politique de confidentialité</SectionLabel>
        <Card style={styles.card}>
          <Text style={styles.heading}>Données des personnes suivies</Text>
          <Text style={styles.paragraph}>
            Les dossiers (identité, mesures, photos, notes) sont stockés
            uniquement sur cet appareil, dans une base chiffrée. Ils ne sont
            jamais transmis à nos serveurs : l’éditeur n’y a pas accès. Le
            professionnel utilisateur de l’app est responsable du traitement de
            ces données ; il recueille le consentement de la personne concernée
            avant toute capture (consentement enregistré et horodaté dans
            l’app).
          </Text>

          <Text style={styles.heading}>Données transmises à nos serveurs</Text>
          <Text style={styles.paragraph}>
            Seules deux catégories de données transitent par nos serveurs, en
            connexion chiffrée (HTTPS) : le compte professionnel (e-mail, nom
            éventuel) nécessaire à l’authentification, et les messages de
            feedback que vous choisissez d’envoyer (contenu du message, écran
            concerné, type d’appareil). Aucune donnée de personne suivie, photo
            ou mesure n’est transmise.
          </Text>

          <Text style={styles.heading}>Partage de rapports</Text>
          <Text style={styles.paragraph}>
            Le partage d’un rapport PDF est déclenché uniquement par vous, via
            le menu de partage du système. Vérifiez le destinataire : une fois
            partagé, le rapport quitte l’application.
          </Text>

          <Text style={styles.heading}>Conservation et suppression</Text>
          <Text style={styles.paragraph}>
            Les dossiers restent sur l’appareil jusqu’à leur suppression par
            vous (suppression individuelle ou globale depuis cet écran
            Réglages). Il vous appartient de définir une durée de conservation
            adaptée à votre activité. Le compte professionnel est conservé tant
            qu’il est actif ; sa suppression peut être demandée par e-mail.
          </Text>

          <Text style={styles.heading}>Vos droits</Text>
          <Text style={styles.paragraph}>
            Conformément au RGPD, vous disposez de droits d’accès, de
            rectification, d’effacement et de portabilité. Pour les données
            stockées sur l’appareil, utilisez l’export et la suppression
            intégrés. Pour le compte professionnel : {CONTACT_EMAIL}. Vous
            pouvez adresser une réclamation à la CNIL (cnil.fr).
          </Text>

          <Text style={styles.heading}>Sécurité et absence de traceurs</Text>
          <Text style={styles.paragraph}>
            Base locale chiffrée (SQLCipher, clé protégée par le trousseau
            sécurisé du système), connexions HTTPS, verrou biométrique
            optionnel. L’application ne contient aucun outil de mesure
            d’audience ni traceur publicitaire, et n’a pas de finalité
            d’identification biométrique ni de catégorisation des personnes.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerSafe: {
    backgroundColor: colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  body: { flex: 1 },
  bodyContent: {
    padding: spacing.s16,
    paddingBottom: spacing.s28,
  },
  card: {
    padding: spacing.s16,
  },
  gap: {
    marginTop: spacing.s16,
  },
  heading: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    marginTop: spacing.s12,
    marginBottom: spacing.s4,
  },
  paragraph: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    lineHeight: fontSize.body + 7,
    color: colors.textSecond,
  },
});
