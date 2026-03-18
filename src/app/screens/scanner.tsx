import { StyleSheet, View, StatusBar, Platform, Dimensions, ScrollView } from "react-native";
import { CameraView } from "expo-camera";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import { AppBar, AppButton, Input } from "@/src/components";
import { ThemedView } from "@/src/components/ThemedView";
import { Overlay } from "@/src/components/ScannerOverlay";
import { isValidTag } from "@/src/utils/functions";
import { useRouter } from "expo-router";
import { selectCode, setCode, setRegisterTagScreen } from "@/src/store/TagSlice";
import BottomSheet from "@gorhom/bottom-sheet";
import { useMemo, useRef } from "react";

import QRIcon from "@/src/assets/icons/qr-icon.svg";

const { width, height } = Dimensions.get("window");

export default function ScannerScreen() {
  const router = useRouter();
  const dispatch = useDispatch();

  const code = useSelector(selectCode);

  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ["50%"], []);

  return (
    <ThemedView style={{ flex: 1 }}>
      {Platform.OS === "android" && <StatusBar hidden />}
      <View style={styles.appBarContainer}>
        <AppBar title="Escanea tu tag" />
      </View>
      <CameraView
        style={styles.cameraView}
        facing="back"
        onBarcodeScanned={(e) => {
          if (isValidTag(e.data)) {
            dispatch(setCode(e.data));
            dispatch(setRegisterTagScreen("processing"));
            router.back();
          } else {
            Toast.show({
              text1: "Tag no válido",
              type: "error",
            });
          }
        }}
      />
      <Overlay />
      <AppButton
        style={styles.addCodeButton}
        onPress={() => bottomSheetRef.current?.expand()}
        title="Introducir código manualmente"
      />

      <BottomSheet
        enablePanDownToClose={true}
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
      >
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={{ alignItems: "center", marginVertical: height * 0.02 }}>
            <QRIcon width={120} height={120} />
          </View>
          <Input
            label="Código"
            placeholder="AC1234567890"
            onChangeText={(text) => {
              dispatch(setCode(text));
            }}
            value={code ?? ""}
            error={""}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ width: width * 0.8 }}
          />
          <AppButton
            style={{ width: width * 0.8 }}
            onPress={() => {
              if (isValidTag(code ?? "")) {
                dispatch(setRegisterTagScreen("processing"));
                router.back();
              } else {
                Toast.show({
                  text1: "Tag no válido",
                  type: "error",
                });
              }
            }}
            title="Enviar"
          />
        </ScrollView>
      </BottomSheet>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  appBarContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  cameraView: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "grey",
  },
  contentContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: height * 0.1,
  },
  addCodeButton: {
    position: "absolute",
    bottom: height * 0.15,
    left: width * 0.1,
    width: width * 0.8,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "white",
  },
});
