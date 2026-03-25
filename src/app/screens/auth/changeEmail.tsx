import { Dimensions, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { AppBar, AppButton, Input } from "@/src/components";
import { useState } from "react";
import { appHorizontalPadding, appTopPadding } from "@/src/utils/constants";
import { ScrollView } from "react-native-gesture-handler";
import { selectAuth, selectUserLogged, setAuth, setUser } from "@/src/store/AuthSlice";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import { BackendUser, userTransform } from "@/src/utils/transformers/user";
import { useFetch } from "@/src/hooks/useFetch";
import { ThemedText } from "@/src/components/ThemedText";
import { colors } from "@/src/utils/colors";
import { Modal } from "react-native-paper";

import BellIcon from "@/src/assets/icons/bell-icon.svg";

const { width, height } = Dimensions.get("window");

//TODO: combine this component with changeUserInfo
export default function ChangeEmailScreen() {
  const fetch = useFetch();
  const dispatch = useDispatch();
  const user = useSelector(selectUserLogged);
  const auth = useSelector(selectAuth);

  const [email, setEmail] = useState(user?.email || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const hideModal = () => setShowModal(false);
  const displayModal = () => setShowModal(true);

  const validateInputs = () => {
    if (email.length === 0) {
      Toast.show({
        text1: "El email es requerido",
        type: "error",
      });
      return false;
    }
    return true;
  };
  
  const updateUserInfo = async () => {
    if (!validateInputs()) {
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    try {
      const body = {
        id: user?.id,
        nombre: user?.name,
        email: email,
        rol: user?.role,
        genero: user?.gender,
        fecha_alta: user?.dateJoined,
        telcel: user?.phoneNumber,
        telref: user?.phoneRef,
        urlimg: user?.urlImg,
        estado: user?.status,
      };

      const options = {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.accessToken}`,
        },
        body: JSON.stringify(body),
      };
      const response: {
        ok: boolean;
        json: () => Promise<{
          success: boolean;
          data: BackendUser;
        }>;
      } = await fetch(`/user/${user?.id}`, options);

      const responsePayload = await response.json();
      const responseData = responsePayload.data;
      if (response.ok) {
        if (responseData.estado === "200") {
          Toast.show({
            text1: "Usuario actualizado",
            type: "success",
          });
          router.replace("/screens/auth/login");
          dispatch(setUser(undefined));
          dispatch(setAuth(undefined));
        }
      }
    } catch (error: unknown) {
      const errorMessage = error as Error;
      Toast.show({
        text1: errorMessage.message,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Información personal" />
      <ScrollView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: appHorizontalPadding, paddingTop: appTopPadding }}>
          <ThemedText style={styles.instructions}>
            ¡IMPORTANTE! Luego de cambiar tu email, serás redireccionado a la pantalla de login.
          </ThemedText>
          <Input label="Email" placeholder="juanperez@gmail.com" onChangeText={setEmail} value={email} />

          <View style={styles.buttonContainer}>
            <AppButton
              title="Actualizar"
              disabled={isSaving}
              loading={isSaving}
              onPress={() => {
                displayModal();
              }}
            />
          </View>
        </View>
      </ScrollView>
      <Modal
        visible={showModal}
        onDismiss={hideModal}
        contentContainerStyle={styles.modalContainer}
        style={{ paddingHorizontal: width * 0.03 }}
      >
        <View style={{ alignItems: "center", marginVertical: height * 0.02 }}>
          <BellIcon width={120} height={40} fill={colors.primary} />
        </View>
        <ThemedText style={styles.modalTitle}>Se cambiará tu email</ThemedText>
        <ThemedText style={styles.modalInstructions}>
          Este cambio es irreversible, al presionar aceptar se modificará tu email y se te
          redireccionará a la pantalla de login.
        </ThemedText>
        <View style={styles.modalButtonContainer}>
          <AppButton
            title="Aceptar"
            onPress={() => {
              hideModal();
              updateUserInfo();
            }}
          />
          <AppButton
            title="Cancelar"
            style={{ backgroundColor: "white", marginTop: height * 0.02 }}
            labelStyle={{ color: colors.primary }}
            onPress={hideModal}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: height * 0.02,
  },
  instructions: {
    color: colors.primary,
    marginBottom: height * 0.02,
    textAlign: "center",
    paddingHorizontal: width * 0.09,
    fontSize: 17,
    fontWeight: "bold",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalInstructions: {
    fontSize: 16,
    textAlign: "center",
  },
  modalButtonContainer: {
    marginTop: height * 0.02,
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    paddingHorizontal: width * 0.1,
    borderRadius: 10,
  },
});
