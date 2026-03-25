import { Dimensions, StyleSheet, View } from "react-native";

import { ThemedText } from "@/src/components/ThemedText";
import { AppBar, AppButton, Input } from "@/src/components";
import { router } from "expo-router";
import { colors } from "@/src/utils/colors";
import { useState } from "react";
import { appHorizontalPadding, appTopPadding } from "@/src/utils/constants";
import { BackendAuth, authTransform } from "@/src/utils/transformers/auth";
import { useFetch } from "@/src/hooks/useFetch";
import Toast from "react-native-toast-message";
import { useDispatch } from "react-redux";
import { setAuth } from "@/src/store/AuthSlice";
import { ThemedView } from "@/src/components/ThemedView";
import { environment } from "../../environments/environment";

export default function LoginScreen() {
  const fetch = useFetch();
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState({ email: "", password: "" });

  const clearError = () => {
    setError({ email: "", password: "" });
  };

  const validateInputs = () => {
    if (!email) {
      setError({ ...error, email: "El correo electrónico es requerido" });
      return false;
    }
    if (!password) {
      setError({ ...error, password: "La contraseña es requerida" });
      return false;
    }
    return true;
  };

  const onLoginPress = async () => {
    if (!validateInputs()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const body = {
        username: email,
        password: password,
        company: environment.company.toString(),
      };
      const response = await fetch(`/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const responseData = await response.json();

      if (response.ok) {
        if (responseData.estado === 200) {
          const auth = authTransform(responseData.data);
          Toast.show({
            text1: "Inicio de sesión exitoso",
            type: "success",
          });
          dispatch(setAuth(auth));
          router.replace("/screens/tag/(tabs)");
        } else {
          Toast.show({
            text1: "Correo electrónico o contraseña incorrectos",
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
    <ThemedView style={{ flex: 1 }}>
      <AppBar title="Iniciar sesión" />
      <View style={{ paddingHorizontal: appHorizontalPadding, paddingTop: appTopPadding }}>
        <Input
          label="Correo electrónico"
          placeholder="juanperez@gmail.com"
          onChangeText={(text) => {
            setEmail(text);
            clearError();
          }}
          value={email}
          error={error.email}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="Contraseña"
          placeholder="********"
          onChangeText={(text) => {
            setPassword(text);
            clearError();
          }}
          value={password}
          secureTextEntry={true}
          error={error.password}
          autoCapitalize="none"
        />

        <View style={styles.loginButtonContainer}>
          <AppButton title="Iniciar sesión" onPress={onLoginPress} loading={loading} />
        </View>
        <View style={styles.forgotPasswordContainer}>
          <ThemedText
            style={styles.forgotPasswordText}
            onPress={() => router.navigate("/screens/auth/recoverPassword")}
          >
            ¿Olvidaste tu usuario o contraseña?
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  forgotPasswordContainer: {
    marginTop: 20,
  },
  forgotPasswordText: {
    fontWeight: "bold",
    color: colors.primary,
    textAlign: "center",
  },
  loginButtonContainer: {
    marginTop: 20,
    paddingBottom: 0,
  },
});
