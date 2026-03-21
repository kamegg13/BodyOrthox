import { AppRegistry, Platform } from "react-native";
import App from "./App";
import appConfig from "./app.json";

const appName = appConfig.name;

AppRegistry.registerComponent(appName, () => App);

if (Platform.OS === "web") {
  AppRegistry.runApplication(appName, {
    rootTag: document.getElementById("root"),
  });
}
