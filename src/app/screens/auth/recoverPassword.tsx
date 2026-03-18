import { Dimensions, Keyboard, StyleSheet, View } from "react-native";

import { ThemedText } from "@/src/components/ThemedText";
import { AppBar, AppButton, Input } from "@/src/components";
import { router } from "expo-router";
import { colors } from "@/src/utils/colors";
import { useCallback, useState } from "react";
import { appHorizontalPadding, appTopPadding } from "@/src/utils/constants";
import { Modal } from "react-native-paper";

import BellIcon from "@/src/assets/icons/bell-icon.svg";
import Toast from "react-native-toast-message";
import { useFetch } from "@/src/hooks/useFetch";
import CustomModal from "@/src/components/Modal";

const { height, width } = Dimensions.get("window");

export default function RecoverPasswordScreen() {
  const fetch = useFetch();

  const [email, setEmail] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const displayModal = () => setShowModal(true);
  const hideModal = () => setShowModal(false);

  const [error, setError] = useState("");

  const onEmailChange = useCallback((text: string) => {
    setEmail(text);
    setError("");
  }, []);

  const onRecoverPasswordPress = async () => {
    if (email.length === 0) {
      setLoading(false);
      setError("El correo electrónico es requerido");
      return;
    }

    setLoading(true);
    try {
      Keyboard.dismiss();

      const body = {
        email,
      };

      const options = {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      };
      const response: {
        ok: boolean;
        json: () => Promise<{
          success: boolean;
          data: any;
        }>;
      } = await fetch(`/recoveruser`, options);

      const responsePayload = await response.json();
      const responseData = responsePayload.data;
      if (response.ok) {
        if (responseData.estado == 200) {
          displayModal();
        } else {
          Toast.show({
            text1: "No se encontró el correo electrónico",
            type: "error",
          });
        }
      }
    } catch (error: unknown) {
      const errorMessage = error as Error;
      Toast.show({
        text1: errorMessage.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Recuperar contraseña" />
      <View style={{ paddingHorizontal: appHorizontalPadding, paddingTop: appTopPadding }}>
        <ThemedText style={styles.instructions}>
          Ingresa tu correo electrónico y sigue las instrucciones para crear una nueva contraseña.
        </ThemedText>
        <Input
          label="Correo electrónico"
          placeholder="juanperez@gmail.com"
          onChangeText={onEmailChange}
          value={email}
          error={error}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <View style={styles.buttonContainer}>
          <AppButton title="Enviar" onPress={onRecoverPasswordPress} loading={loading} />
        </View>
      </View>
      <CustomModal visible={showModal} onDismiss={hideModal}>
        <>
          <View style={{ alignItems: "center", marginVertical: height * 0.02 }}>
            <BellIcon width={120} height={40} fill={colors.primary} />
          </View>
          <ThemedText style={styles.modalTitle}>
            Se envió un correo electrónico para restablecer tu contraseña.
          </ThemedText>
          <ThemedText style={styles.modalInstructions}>
            Sigue las instrucciones enviadas a {email} para restablecer tu contraseña
          </ThemedText>
          <View style={styles.modalButtonContainer}>
            <AppButton
              title="Aceptar"
              loading={loading}
              disabled={loading}
              onPress={() => {
                hideModal();
                router.back();
              }}
            />
          </View>
        </>
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  instructions: {
    color: colors.primary,
    marginBottom: height * 0.04,
    textAlign: "center",
    paddingHorizontal: width * 0.09,
  },
  buttonContainer: {
    marginTop: 20,
    paddingBottom: 40,
  },
  modalButtonContainer: {
    marginTop: height * 0.04,
    paddingBottom: height * 0.05,
  },
  modalTitle: {
    fontWeight: "bold",
    color: colors.primary,
    textAlign: "center",
    paddingHorizontal: width * 0.09,
    marginBottom: height * 0.02,
    fontSize: 20,
  },
  modalInstructions: {
    color: colors.primary,
    textAlign: "center",
    paddingHorizontal: width * 0.09,
    fontSize: 17,
  },
});
