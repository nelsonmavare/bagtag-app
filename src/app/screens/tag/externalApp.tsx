import { View, Dimensions, Image, StyleSheet, Linking, Alert } from "react-native";

import { AppBar, AppButton } from "@/src/components";
import { colors } from "@/src/utils/colors";
import { ThemedText } from "@/src/components/ThemedText";
const { width, height, fontScale } = Dimensions.get("window");

const appUrl = "findmy://";
const appStoreUrl = "https://apps.apple.com/app/id1514844621";

export default function ExternalAppScreen() {

  const notFoundAlert = () => {
    Alert.alert(`App no encontrada`, `Por favor, instala la app "Encontrar" en tu dispositivo Apple.`, [{ text: "Cancelar", onPress: () => { }, style: "cancel" }, {
      text: "Abrir App Store", onPress: () => {
        Linking.openURL(appStoreUrl);
      }
    }]);
  }

  const openURL = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        notFoundAlert();
      }
    } catch (error) {
      notFoundAlert();
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <AppBar />

      <View style={styles.contentContainer}>
        <Image source={require("@/src/assets/images/encontrar-app.png")} style={styles.appLogo} />
        <ThemedText style={{ fontWeight: "bold", color: colors.primary, textAlign: "center", marginTop: 30 }}>
          Para localizar tu tag utiliza la app "Encontrar" de tu dispositivo Apple.
        </ThemedText>
        <View style={{ marginVertical: 30 }}>
          <ThemedText style={{ color: colors.primary }}>
            <ThemedText style={{ fontWeight: "bold" }}>1.</ThemedText> Abre la app{" "}
            <ThemedText style={{ fontWeight: "bold" }}>Encontrar</ThemedText> en tu dispositivo
            Apple.
          </ThemedText>
          <ThemedText style={{ color: colors.primary }}>
            <ThemedText style={{ fontWeight: "bold" }}>2.</ThemedText> Toca el botón de tu tag
            BagTag una vez para ponerlo en modo visible.
          </ThemedText>
          <ThemedText style={{ color: colors.primary }}>
            <ThemedText style={{ fontWeight: "bold" }}>3.</ThemedText> Toca{" "}
            <ThemedText style={{ fontWeight: "bold" }}>+</ThemedText> y luego elige{" "}
            <ThemedText style={{ fontWeight: "bold" }}>Agregar otro artículo</ThemedText>.
          </ThemedText>
          <ThemedText style={{ color: colors.primary }}>
            <ThemedText style={{ fontWeight: "bold" }}>4.</ThemedText> Toca{" "}
            <ThemedText style={{ fontWeight: "bold" }}>Conectar</ThemedText>, ingresa un nombre y
            elige un emoji, y luego toca{" "}
            <ThemedText style={{ fontWeight: "bold" }}>Continuar</ThemedText>.
          </ThemedText>
          <ThemedText style={{ color: colors.primary }}>
            <ThemedText style={{ fontWeight: "bold" }}>5.</ThemedText> Toca{" "}
            <ThemedText style={{ fontWeight: "bold" }}>Continuar</ThemedText> para registrar el
            artículo a tu Apple ID y luego toca{" "}
            <ThemedText style={{ fontWeight: "bold" }}>Finalizar</ThemedText>.
          </ThemedText>
        </View>
        <AppButton
          title={`Abrir la App "Encontrar"`}
          onPress={() => {
            openURL(appUrl);
          }}
          style={{ width: "100%" }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appLogo: {
    objectFit: "contain",
    height: 140,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.05,
  },
});
