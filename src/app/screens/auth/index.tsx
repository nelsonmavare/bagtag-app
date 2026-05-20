import { Dimensions, Image, StyleSheet, View } from "react-native";

import { ThemedText } from "@/src/components/ThemedText";
import { AppButton } from "@/src/components";
import { router } from "expo-router";
import { colors } from "@/src/utils/colors";
import { appHorizontalPadding } from "@/src/utils/constants";
import { LinearGradient } from "expo-linear-gradient";
import { appDescription } from "@/src/constants/lang";
import { version } from "../../../../package.json";

const { width, height } = Dimensions.get("window");

const LOGO_DIMENSION = width * 0.8;

export default function Auth() {

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
        }}
      >
        <ThemedText style={{ fontWeight: "bold", color: colors.primary, textAlign: "center" }}>
          {appDescription}
        </ThemedText>
      </View>
      <View
        style={{
          paddingHorizontal: appHorizontalPadding,
          paddingVertical: height * 0.05,
        }}
      >
        <AppButton
          title="Iniciar sesión"
          onPress={() => {
            router.navigate("/screens/auth/login");
          }}
          style={{ backgroundColor: colors.secondary, marginBottom: 15 }}
          labelStyle={{ color: colors.primary }}
        />

        <AppButton
          title="Regístrate"
          onPress={() => {
            router.navigate("/screens/auth/register");
          }}
        />
        <AppButton
          title="Test BLE local"
          onPress={() => {
            router.navigate("/screens/dev/bleManagerLocalTest" as any);
          }}
          style={{ backgroundColor: "transparent", marginTop: 12 }}
          labelStyle={{ color: colors.primary }}
        />
        <ThemedText style={styles.version}>v{version}</ThemedText>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  appLogo: {
    width: "65%",
    objectFit: "contain",
    height: 150,
    marginTop: "30%",
    marginRight: "5%",
  },
  backgroundImage: {
    height: LOGO_DIMENSION,
    width: LOGO_DIMENSION,
  },
  version: {
    marginTop: 14,
    fontSize: 12,
    color: colors.primaryLight,
    opacity: 0.7,
    textAlign: "center",
  },
});
