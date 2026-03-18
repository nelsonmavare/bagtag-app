import { Dimensions, Image, StyleSheet, View } from "react-native";

import { ThemedText } from "@/src/components/ThemedText";
import { AppBar, AppButton, Input } from "@/src/components";
import { router } from "expo-router";
import { colors } from "@/src/utils/colors";
import { useState } from "react";
import { appHorizontalPadding, appTopPadding } from "@/src/utils/constants";
import { Modal } from "react-native-paper";

const { height, width } = Dimensions.get("window");

export default function EmailVerificationScreen() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState({
    code1: "",
    code2: "",
    code3: "",
    code4: "",
  });
  const [showModal, setShowModal] = useState(false);

  const displayModal = () => setShowModal(true);
  const hideModal = () => setShowModal(false);

  const containerStyle = {
    backgroundColor: "white",
    padding: 20,
    paddingHorizontal: width * 0.1,
    borderRadius: 10,
  };
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Recuperar contraseña" />
      <View style={{ paddingHorizontal: appHorizontalPadding, paddingTop: appTopPadding }}>
      <View
        style={{
          height: height * 0.2,
          alignItems: "center",
        }}
      >
        <Image source={require("@/src/assets/images/email-icon.png")} style={styles.image} />
      </View>
        <ThemedText style={styles.instructions}>
          Por favor, ingresa el código que enviamos a jhondoe@gmail.com.
        </ThemedText>
        <View style={styles.codeContainer}>
          <Input
            style={styles.codeInput}
            placeholder=""
            onChangeText={(text) => setCode({ ...code, code1: text })}
            value={code.code1}
          />
          <Input
            style={styles.codeInput}
            placeholder=""
            onChangeText={(text) => setCode({ ...code, code2: text })}
            value={code.code2}
          />
          <Input
            style={styles.codeInput}
            placeholder=""
            onChangeText={(text) => setCode({ ...code, code3: text })}
            value={code.code3}
          />
          <Input
            style={styles.codeInput}
            placeholder=""
            onChangeText={(text) => setCode({ ...code, code4: text })}
            value={code.code4}
          />
        </View>
        <View style={styles.noCodeContainer}>
          <ThemedText style={styles.noCodeText} onPress={() => alert("resent code")}>
            ¿No tienes el código?, vuelve a intentarlo.
          </ThemedText>
        </View>
        <View style={styles.buttonContainer}>
          <AppButton
            title="Confirmar"
            onPress={() => {
              displayModal();
            }}
          />
        </View>
        <View style={styles.noCodeContainer}>
          <ThemedText
            style={styles.noCodeText}
            onPress={() => router.navigate("/screens/auth/register")}
          >
            Elige un correo distinto.
          </ThemedText>
        </View>
      </View>
      <Modal
        visible={showModal}
        onDismiss={hideModal}
        contentContainerStyle={containerStyle}
        style={{ paddingHorizontal: width * 0.05 }}
      >
        <ThemedText>Example Modal. Click outside this area to dismiss.</ThemedText>
        <View style={styles.modalButtonContainer}>
          <AppButton
            title="Aceptar"
            onPress={() => {
              hideModal();
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: height * 0.005,
    paddingHorizontal: width * 0.02,
  },
  codeInput: {
    width: width * 0.18,
    height: width * 0.18,
    textAlign: "center",
    fontSize: width * 0.05,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
  },
  instructions: {
    color: colors.primary,
    marginBottom: height * 0.04,
    textAlign: "center",
    paddingHorizontal: width * 0.09,
    fontWeight: "bold",
  },
  buttonContainer: {
    marginTop: height * 0.03,
    marginBottom: height * 0.01,
  },
  modalButtonContainer: {
    marginTop: height * 0.04,
    paddingBottom: height * 0.05,
  },
  noCodeContainer: {
    marginTop: height * 0.02,
  },
  noCodeText: {
    fontWeight: "bold",
    color: colors.primary,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  image: {
    width: "45%",
    objectFit: "contain",
    height: "100%",
  },
});
