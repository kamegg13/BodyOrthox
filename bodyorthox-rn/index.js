import { AppRegistry, Platform, LogBox, Alert } from "react-native";
import App from "./App";
import appConfig from "./app.json";

// Suppress non-critical warnings on Android
LogBox.ignoreLogs(["shadow*", "textShadow*", "props.pointerEvents"]);

// Global error handler — shows alert with error details on Android
if (Platform.OS !== "web") {
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    if (isFatal) {
      Alert.alert(
        "Erreur fatale",
        `${error.name}: ${error.message}\n\n${error.stack?.substring(0, 500)}`,
        [{ text: "OK" }],
      );
    }
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

const appName = appConfig.name;

AppRegistry.registerComponent(appName, () => App);

if (Platform.OS === "web") {
  AppRegistry.runApplication(appName, {
    rootTag: document.getElementById("root"),
  });
}
