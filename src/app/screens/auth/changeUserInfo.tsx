import { Dimensions, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { AppBar, AppButton, Input } from "@/src/components";
import { useState } from "react";
import { appHorizontalPadding, appTopPadding } from "@/src/utils/constants";
import { ScrollView } from "react-native-gesture-handler";
import { selectAuth, selectUserLogged, setUser } from "@/src/store/AuthSlice";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import { BackendUser, userTransform } from "@/src/utils/transformers/user";
import { useFetch } from "@/src/hooks/useFetch";

const { width, height } = Dimensions.get("window");

export default function ChangeUserInfoScreen() {
  const fetch = useFetch();
  const dispatch = useDispatch();

  const user = useSelector(selectUserLogged);
  const auth = useSelector(selectAuth);

  const [name, setName] = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const validateInputs = () => {
    if (name.length === 0) {
      Toast.show({
        text1: "El nombre es requerido",
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
        nombre: name,
        email: user?.email,
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
      } = await fetch(`/user`, options);

      const responsePayload = await response.json();
      const responseData = responsePayload.data;
      if (response.ok) {
        if (responseData.estado === "200") {
          const user = userTransform(responseData);
          dispatch(setUser(user));
          Toast.show({
            text1: "Usuario actualizado",
            type: "success",
          });
          router.replace("/screens/tag/(tabs)/config");
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
          <Input label="Nombre" placeholder="Juan Pérez" onChangeText={setName} value={name} />

          <View style={styles.buttonContainer}>
            <AppButton
              title="Actualizar"
              disabled={isSaving}
              loading={isSaving}
              onPress={updateUserInfo}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: height * 0.02,
  },
});
