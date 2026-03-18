import { Dimensions, StyleSheet, View, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { AppBar, AppButton, Input } from "@/src/components";
import { useCallback, useMemo, useState } from "react";
import { appHorizontalPadding, appTopPadding } from "@/src/utils/constants";
import { ThemedText } from "@/src/components/ThemedText";
import { colors } from "@/src/utils/colors";
import { ScrollView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { useFetch } from "@/src/hooks/useFetch";
import PhoneInput from "@/src/components/PhoneInput";
import { environment } from "../../environments/environment";

const { height } = Dimensions.get("window");

export default function RegisterScreen() {
  const router = useRouter();
  const fetch = useFetch();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({
    name: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [userValues, setUserValues] = useState({
    name: "",
    lastName: "",
    phone: "",
    countryCode: "+54",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const countryCodeWithPlus = useMemo(() => {
    if (userValues.countryCode.length === 0) {
      return "+54";
    }
    if (userValues.countryCode.includes("+")) {
      return userValues.countryCode;
    }
    return `+${userValues.countryCode}`;
  }, [userValues.countryCode]);

  const handleInputChange = useCallback(
    (key: keyof typeof userValues, value: string) => {
      setUserValues({ ...userValues, [key]: value });
      setError({ ...error, [key]: "" });
    },
    [userValues, error],
  );

  const validateInputs = () => {
    if (!userValues.name) {
      setError({ ...error, name: "El nombre es requerido" });
      return false;
    } else if (!userValues.lastName) {
      setError({ ...error, lastName: "El apellido es requerido" });
      return false;
    } else if (!userValues.email) {
      setError({ ...error, email: "El correo electrónico es requerido" });
      return false;
    } else if (!userValues.phone) {
      setError({ ...error, phone: "El teléfono es requerido" });
      return false;
    } else if (!userValues.password) {
      setError({ ...error, password: "La contraseña es requerida" });
      return false;
    } else if (!userValues.confirmPassword) {
      setError({ ...error, confirmPassword: "La confirmación de contraseña es requerida" });
      return false;
    } else if (userValues.password !== userValues.confirmPassword) {
      setError({ ...error, confirmPassword: "Las contraseñas no coinciden" });
      return false;
    }
    return true;
  };

  const validateUserExists = async () => {
    if (!userValues.email) {
      return true;
    }
    try {
      const body = {
        email: userValues.email,
        idcompania: environment.company,
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
          total: number;
        }>;
      } = await fetch(`/checkexistsuser`, options);

      const responsePayload = await response.json();
      const responseData = responsePayload.data;

      if (response.ok) {
        const userExists = typeof responseData[0]?.existe === "number" && !!responseData[0]?.existe;
        if (userExists) {
          Toast.show({
            text1: "El correo electrónico ya está registrado",
            type: "error",
          });
          setError({ ...error, email: "Seleccione otro correo electrónico" });
          setUserValues({ ...userValues, email: "" });
          return true;
        } else {
          return false;
        }
      }
    } catch (error: unknown) {
      const errorMessage = error as Error;
      Toast.show({
        text1: errorMessage.message,
        type: "error",
      });
    }
  };

  const onRegisterPress = async () => {
    if (!validateInputs()) {
      setLoading(false);
      return;
    }
    setLoading(true);

    if (await validateUserExists()) {
      // TODO: Uncomment this when the API is ready
      setLoading(false);
      return;
    }

    try {
      const body = {
        nombre: `${userValues.name} ${userValues.lastName}`,
        email: userValues.email,
        password: userValues.password,
        rol: "user",
        genero: "M",
        fecha_alta: new Date().toISOString(),
        telcel: userValues.phone,
        telref: countryCodeWithPlus,
        urlimg: "",
        estado: 1,
        idempresa: environment.company,
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
      } = await fetch(`/user`, options);

      const responsePayload = await response.json();
      const responseData = responsePayload.data;
      if (response.ok) {
        if (responseData.estado == 200) {
          router.navigate("/");
          Toast.show({
            text1: "Registro exitoso",
            type: "success",
          });
        } else {
          Toast.show({
            text1: responseData.data?.mensaje || "Error al registrar el usuario",
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View style={{ flex: 1 }}>
        <AppBar title="Regístrate" />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: appHorizontalPadding, paddingTop: appTopPadding }}>
            <Input
              label="Nombre"
              placeholder="Juan"
              onChangeText={(text) => handleInputChange("name", text)}
              value={userValues.name}
              error={error.name}
            />
            <Input
              label="Apellido"
              placeholder="Pérez"
              onChangeText={(text) => handleInputChange("lastName", text)}
              value={userValues.lastName}
              error={error.lastName}
            />
            <Input
              label="Correo electrónico"
              placeholder="juanperez@gmail.com"
              onChangeText={(text) => handleInputChange("email", text)}
              value={userValues.email}
              error={error.email}
              inputMode="email"
              autoCapitalize="none"
            />
            <PhoneInput
              setPhone={(text) => handleInputChange("phone", text)}
              setCountryCode={(text) => handleInputChange("countryCode", text)}
              countryCodeValue={countryCodeWithPlus}
              phoneValue={userValues.phone}
            />
            <Input
              label="Contraseña"
              placeholder="********"
              onChangeText={(text) => handleInputChange("password", text)}
              value={userValues.password}
              secureTextEntry={true}
              error={error.password}
              inputMode="text"
              autoCapitalize="none"
            />
            <ThemedText style={styles.passwordRequirements}>
              Debes incluir una letra, un número y tener al menos 8 caracteres.
            </ThemedText>
            <Input
              label="Confirmar contraseña"
              placeholder="********"
              onChangeText={(text) => handleInputChange("confirmPassword", text)}
              value={userValues.confirmPassword}
              secureTextEntry={true}
              error={error.confirmPassword}
              inputMode="text"
              autoCapitalize="none"
            />
            <View style={styles.registerButtonContainer}>
              <AppButton
                title="Regístrate"
                onPress={() => {
                  onRegisterPress();
                }}
                loading={loading}
                disabled={loading}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  registerButtonContainer: {
    marginTop: 20,
    paddingBottom: 40,
  },
  passwordRequirements: { color: colors.primary, marginBottom: 10 },
});
