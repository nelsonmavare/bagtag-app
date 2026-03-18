import { useState } from "react";
import { Dimensions, Image, StyleSheet, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { router } from "expo-router";
import { colors } from "@/src/utils/colors";
import { ThemedText } from "@/src/components/ThemedText";
import { ThemedView } from "@/src/components/ThemedView";
import { AppBar, AppButton } from "@/src/components";
import { selectProduct, setProduct } from "@/src/store/TagSlice";
import { PRODUCT_STATUS } from "@/src/utils/types";
import useReport from "@/src/hooks/useReport";
const { width, height } = Dimensions.get("window");

const BACKGROUND_IMAGE_DIMENSION = width * 0.7;

export default function FindTagScreen() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const product = useSelector(selectProduct);

  const { onProductLost } = useReport({ setLoading });

  return (
    <ThemedView style={{ flex: 1 }}>
      <AppBar
        title="Buscando tu Maleta"
        onBackPress={() => {
          dispatch(setProduct(undefined));
          router.replace("/screens/tag/(tabs)/");
        }}
      />
      <View style={styles.processingContainer}>
        <Image
          source={require("@/src/assets/images/lost-suitcase.png")}
          style={styles.imageStyle}
        />
        <ThemedText style={styles.modalInstructions}>
          No pudimos localizar tu maleta. Puedes intentar hacer la búsqueda de nuevo
          {product?.statusId !== PRODUCT_STATUS.LOST ? " o notificarla como perdida." : "."}
        </ThemedText>
        <View style={styles.nextButtonContainer}>
          <AppButton
            title="Buscar de nuevo"
            style={{ backgroundColor: colors.secondary }}
            labelStyle={{ color: colors.primary }}
            onPress={() => {
              router.replace("/screens/tag/findTag");
            }}
            disabled={loading}
          />
          {product?.statusId !== PRODUCT_STATUS.LOST && (
            <AppButton
              title="Indicar como perdida"
              onPress={() => onProductLost(product)}
              disabled={loading}
              loading={loading}
            />
          )}
          <AppButton
            title={"Ir a la página principal"}
            onPress={() => {
              dispatch(setProduct(undefined));
              router.replace("/screens/tag/(tabs)/");
            }}
            style={{ backgroundColor: "transparent", marginTop: height * 0.02 }}
            labelStyle={{ color: colors.primary }}
          />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  nextButtonContainer: {
    marginTop: height * 0.04,
    paddingBottom: height * 0.05,
    gap: 10,
    width: "100%",
  },
  modalInstructions: {
    fontSize: 16,
    textAlign: "center",
  },
  processingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: width * 0.15,
  },
  imageStyle: {
    width: BACKGROUND_IMAGE_DIMENSION,
    height: BACKGROUND_IMAGE_DIMENSION,
    borderRadius: 100,
  },
});
