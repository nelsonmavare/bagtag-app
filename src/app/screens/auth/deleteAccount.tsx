import { Dimensions, StyleSheet, View } from "react-native";

import { ThemedText } from "@/src/components/ThemedText";
import { AppBar, AppButton, Input } from "@/src/components";
import { colors } from "@/src/utils/colors";
import { useState } from "react";
import { appHorizontalPadding, appTopPadding } from "@/src/utils/constants";
import { Checkbox } from "react-native-paper";
import Toast from "react-native-toast-message";
import { authTransform, BackendAuth } from "@/src/utils/transformers/auth";
import { useDispatch, useSelector } from "react-redux";
import { selectAuth, selectUserLogged, setAuth, setUser } from "@/src/store/AuthSlice";
import { useFetch } from "@/src/hooks/useFetch";
import { useRouter } from "expo-router";
import { environment } from "../../environments/environment";
import { MaterialIcons } from "@expo/vector-icons";

const { height, width } = Dimensions.get("window");

export default function DeleteAccountScreen() {
  const fetch = useFetch();
  const dispatch = useDispatch();
  const user = useSelector(selectUserLogged);
  const auth = useSelector(selectAuth);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [screenStep, setScreenStep] = useState(1);
  const [checkedConditions, setCheckedConditions] = useState({ check1: false, check2: false });

  const validateInputs = () => {
    return password.length > 0;
  };

  const onLoginPress = async () => {
    if (!validateInputs()) {
      setLoading(false);
      Toast.show({
        text1: "Por favor, completa todos los campos",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", user?.email || "");
      formData.append("password", password);
      formData.append("company", environment.company.toString());
      const options = {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      };
      const response: {
        ok: boolean;
        json: () => Promise<{
          success: boolean;
          data: BackendAuth;
        }>;
      } = await fetch(`/auth`, options);

      const responsePayload = await response.json();
      const responseData = responsePayload.data;

      if (response.ok) {
        if (responseData.estado === "200") {
          const auth = authTransform(responseData);
          if (auth.accessToken) {
            setScreenStep(2);
            dispatch(setAuth(auth));
          }
        } else {
          Toast.show({
            text1: "Contraseña incorrecta",
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

  const onDeleteAccountPress = async () => {
    setLoading(true);
    try {
      const options = {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.accessToken}`,
        },
      };
      const response: {
        ok: boolean;
        json: () => Promise<{
          success: boolean;
          data: any;
        }>;
      } = await fetch(`/user/${user?.id}`, options);

      const responsePayload = await response.json();
      const responseData = responsePayload.data;
      if (response.ok) {
        if (responseData.estado === "200") {
          dispatch(setAuth(undefined));
          dispatch(setUser(undefined));
          router.navigate("/");
          Toast.show({
            text1: "Tu cuenta ha sido eliminada",
            type: "success",
          });
        } else {
          Toast.show({
            text1: responseData.mensaje,
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

  if (screenStep === 1) {
    return (
      <View style={{ flex: 1 }}>
        <AppBar title="Eliminar cuenta" />
        <View style={{ paddingHorizontal: appHorizontalPadding, paddingTop: appTopPadding }}>
          <ThemedText style={styles.instructions}>
            Por cuestiones de seguridad, si quieres eliminar tu cuenta, primero debes ingresar tu
            contraseña.
          </ThemedText>
          <Input
            label="Contraseña"
            placeholder=""
            onChangeText={setPassword}
            value={password}
            secureTextEntry={true}
            autoCapitalize="none"
          />
          <View style={styles.buttonContainer}>
            <AppButton title="Siguiente" loading={loading} onPress={onLoginPress} />
          </View>
        </View>
      </View>
    );
  } else {
    return (
      <View style={{ flex: 1 }}>
        <AppBar title="Eliminar cuenta" />
        <View style={{ paddingHorizontal: appHorizontalPadding, paddingTop: appTopPadding * 2 }}>
          <View style={{ alignItems: "center", marginBottom: height * 0.04 }}>
            <MaterialIcons name="warning" size={80} color={colors.error} />
          </View>
          <ThemedText style={styles.title}>Atención</ThemedText>
          <ThemedText style={styles.instructions}>
            Para completar la eliminación de tu cuenta, debes leer y aceptar las siguientes condiciones:
          </ThemedText>
          <Checkbox.Item
            label="La eliminación de tu cuenta de BagTag es permanente y no puede revertirse."
            status={checkedConditions.check1 ? "checked" : "unchecked"}
            onPress={() => {
              setCheckedConditions({ ...checkedConditions, check1: !checkedConditions.check1 });
            }}
            style={{ marginBottom: height * 0.02 }}
            color={colors.success}
            labelStyle={checkedConditions.check1 ? styles.checkboxLabel : { color: colors.primaryLight, fontWeight: "bold" }}
          />
          <Checkbox.Item
            label="Se borrará la información de tu cuenta y tus datos personales de manera permanente."
            status={checkedConditions.check2 ? "checked" : "unchecked"}
            onPress={() => {
              setCheckedConditions({ ...checkedConditions, check2: !checkedConditions.check2 });
            }}
            color={colors.success}
            labelStyle={checkedConditions.check2 ? styles.checkboxLabel : { color: colors.primaryLight, fontWeight: "bold" }}
          />
          <View style={styles.buttonContainer}>
            <AppButton
              title="Eliminar cuenta"
              loading={loading}
              onPress={onDeleteAccountPress}
              disabled={!checkedConditions.check1 || !checkedConditions.check2}
            />
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  instructions: {
    color: colors.primary,
    marginBottom: height * 0.02,
    textAlign: "center",
    paddingHorizontal: width * 0.09,
    fontSize: 17,
    fontWeight: "bold",
  },
  buttonContainer: {
    marginTop: height * 0.04,
    paddingBottom: height * 0.05,
  },
  title: {
    color: colors.primary,
    marginBottom: height * 0.01,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
  },
  checkboxLabel: {
    color: colors.primary,
    fontWeight: "bold",
  },
});
