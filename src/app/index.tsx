import { Dimensions, Image, StyleSheet, View } from "react-native";

import { ThemedText } from "@/src/components/ThemedText";
import { colors } from "../utils/colors";
import {LinearGradient} from 'expo-linear-gradient';
import { appDescription } from "../constants/lang";


const { width, height } = Dimensions.get("window");

const LOGO_DIMENSION = width * 0.8;

export default function App() {

  return (
    <LinearGradient colors={["#d5f2f8", colors.mainScreen]} style={{ flex: 1 }}>
      <View
        style={{
          height: height * 0.45,
          alignItems: "center",
        }}
      >
        <Image source={require("@/src/assets/images/bagtag-logo.png")} style={styles.appLogo} />
      </View>
      <View
        style={{
          position: "absolute",
          top: (height - LOGO_DIMENSION) / 2,
          left: (width - LOGO_DIMENSION) / 2,
        }}
      >
        <Image
          source={require("@/src/assets/images/compass-image.png")}
          style={styles.backgroundImage}
        />
      </View>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "flex-end",
          paddingHorizontal: width * 0.1,
          paddingBottom: height * 0.10,
        }}
      >
        <ThemedText style={{ fontWeight: "bold", color: colors.primary, textAlign: "center" }}>
          {appDescription}
        </ThemedText>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  appLogo: {
    width: "65%",
    objectFit: "contain",
    height: "100%",
  },
  backgroundImage: {
    height: LOGO_DIMENSION,
    width: LOGO_DIMENSION,
  },
});
