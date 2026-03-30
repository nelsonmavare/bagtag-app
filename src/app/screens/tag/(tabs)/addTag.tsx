import { useRouter } from "expo-router";
import { Modal } from "react-native-paper";
import Toast from "react-native-toast-message";
import { useCameraPermissions } from "expo-camera";
import { useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, Image, Keyboard, StyleSheet, View } from "react-native";

import { colors } from "@/src/utils/colors";
import { useFetch } from "@/src/hooks/useFetch";
import { selectAuth } from "@/src/store/AuthSlice";
import BellIcon from "@/src/assets/icons/bell-icon.svg";
import { ThemedText } from "@/src/components/ThemedText";
import { ThemedView } from "@/src/components/ThemedView";
import { AppBar, AppButton, Input } from "@/src/components";
import { environment } from "@/src/app/environments/environment";
import { BackendProduct } from "@/src/utils/transformers/product";
import { appHorizontalPadding, appTopPadding } from "@/src/utils/constants";
import {
  selectCode,
  selectRegisterTagScreen,
  setCode,
  setRegisterTagScreen,
} from "@/src/store/TagSlice";
import { setRefreshProducts } from "@/src/store/AppSlice";

const { height, width } = Dimensions.get("window");

export default function LoginScreen() {
  const fetch = useFetch();
  const dispatch = useDispatch();
  const router = useRouter();

  const auth = useSelector(selectAuth);
  const code = useSelector(selectCode);
  const screen = useSelector(selectRegisterTagScreen);

  const [permission, requestPermission] = useCameraPermissions();
  const isPermissionGranted = useMemo(() => permission?.status === "granted", [permission]);

  const [tagValues, setTagValues] = useState({
    name: "",
    description: "",
  });
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState({ name: "", description: "" });

  const clearError = () => {
    setError({ name: "", description: "" });
  };

  const validateInputs = useCallback(() => {
    const newError = { name: "", description: "" };
    if (tagValues.name === "") {
      newError.name = "El nombre es requerido";
    }
    if (tagValues.description === "") {
      newError.description = "La descripción es requerida";
    }

    setError(newError);
    if (newError.name === "" && newError.description === "") return true;
    return false;
  }, [tagValues.name, tagValues.description]);

  const onPressNext = useCallback(async () => {
    if (screen === "form") {
      Keyboard.dismiss();
      if (!isPermissionGranted) setShowPermissionModal(true);
      else {
        if (validateInputs()) {
          router.navigate("/screens/scanner");
        }
      }
    }
  }, [screen, requestPermission, isPermissionGranted, validateInputs]);

  const consultProductBySerial = async (serial: string) => {
    try {
      const options = {
        method: "GET",
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
          data: { estado: string };
          estado: number;
        }>;
      } = await fetch(`/productbyqrserial/${serial}`, options);

      const responsePayload = await response.json();
      const responseData = responsePayload.data;
      if (response.ok) {
        if (Array.isArray(responseData)) {
          return responseData[0];
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

  const registerTag = async () => {
    if (!validateInputs()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const body = {
        usuario_id: auth?.userId || 0,
        url_qr: environment.host + "/buscar/" + code,
        tipo_estado_id: 2,
        codigo_qr: code,
        urlimg: "-",
        condicion: environment.razon_social,
        nombre: tagValues.name,
        descripcion: tagValues.description,
        fecha_creacion: new Date(),
        serial: code,
      };

      const product = await consultProductBySerial(code ?? "");
      if (!!product) {
        Toast.show({
          text1: "Este Tag ya se encuentra registrado",
          type: "error",
        });
        setLoading(false);
        dispatch(setRegisterTagScreen("form"));
        return;
      }

      const options = {
        method: "POST",
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
          data: BackendProduct;
          estado: number;
        }>;
      } = await fetch(`/products`, options);

      const responsePayload = await response.json();
      const responseData = responsePayload.data;
      const responseEstado = responsePayload.estado;

      if (response.ok && responseEstado === 200 && !!responseData.id) {
        Toast.show({
          text1: "Tag registrado",
          type: "success",
        });
        dispatch(setRegisterTagScreen("success"));
        dispatch(setRefreshProducts(true));
      } else {
        throw new Error("Error al registrar el tag");
      }
    } catch (error: unknown) {
      const errorMessage = error as Error;
      Toast.show({
        text1: errorMessage.message,
        type: "error",
      });
      dispatch(setRegisterTagScreen("form"));
    } finally {
      setLoading(false);
      dispatch(setCode(""));
      setTagValues({ name: "", description: "" });
    }
  };

  useEffect(() => {
    if (code && screen === "processing") {
      async function loadData() {
        await registerTag();
      }
      loadData().catch((error) => {
        console.error(error);
      });
    }
  }, [code, screen]);

  if (screen === "form") {
    return (
      <>
        <ThemedView style={{ flex: 1 }}>
          <AppBar title="Registra tu tag" withoutBackButton />
          <View style={{ paddingHorizontal: appHorizontalPadding, paddingTop: appTopPadding }}>
            <Input
              label="Nombre"
              placeholder="Maleta principal"
              onChangeText={(text) => {
                setTagValues({ ...tagValues, name: text });
                clearError();
              }}
              value={tagValues.name}
              error={error.name}
            />
            <Input
              label="Descripción"
              placeholder="Maleta para viajes largos"
              onChangeText={(text) => {
                setTagValues({ ...tagValues, description: text });
                clearError();
              }}
              value={tagValues.description}
              error={error.description}
            />

            <View style={styles.nextButtonContainer}>
              <AppButton title={"Siguiente"} onPress={onPressNext} loading={loading} />
            </View>
          </View>
        </ThemedView>
        <Modal
          visible={showPermissionModal}
          onDismiss={() => setShowPermissionModal(false)}
          contentContainerStyle={styles.modalContainer}
          style={{ paddingHorizontal: width * 0.03 }}
        >
          <View style={{ alignItems: "center", marginVertical: height * 0.02 }}>
            <BellIcon width={120} height={40} fill={colors.primary} />
          </View>
          <ThemedText style={styles.modalTitle}>Necesitamos acceso a tu cámara</ThemedText>
          <ThemedText style={styles.modalInstructions}>
            Necesitamos acceder a tu cámara para escanear el QR de tu tag.
          </ThemedText>
          <View style={styles.modalButtonContainer}>
            <AppButton
              title="Aceptar"
              onPress={async () => {
                const result = await requestPermission();
                setShowPermissionModal(false);
                if (result.status === "granted") {
                  router.navigate("/screens/scanner");
                }
              }}
            />
            <AppButton
              title="Cancelar"
              style={{ backgroundColor: "white", marginTop: height * 0.005 }}
              labelStyle={{ color: colors.primary }}
              onPress={() => setShowPermissionModal(false)}
            />
          </View>
        </Modal>
      </>
    );
  } else if (screen === "processing") {
    return (
      <ThemedView style={{ flex: 1 }}>
        <AppBar title="Registra tu tag" withoutBackButton />
        <View style={styles.processingContainer}>
          <Image
            source={require("@/src/assets/images/suitcase-with-background-1.png")}
            style={{ width: width * 0.5, height: width * 0.5, borderRadius: 100 }}
          />
          <ThemedText style={styles.modalInstructions}>
            Unos segundos, estamos procesando la información
          </ThemedText>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ThemedView>
    );
  } else if (screen === "success") {
    return (
      <ThemedView style={{ flex: 1 }}>
        <AppBar
          title="Registra tu tag"
          withoutBackButton
          onBackPress={() => {
            {
              dispatch(setCode(""));
              dispatch(setRegisterTagScreen("form"));
              setTagValues({ name: "", description: "" });
            }
          }}
        />
        <View style={styles.processingContainer}>
          <Image
            source={require("@/src/assets/images/check.png")}
            style={{ width: width * 0.5, height: width * 0.5, borderRadius: 100 }}
          />
          <ThemedText style={styles.modalTitle}>Tag registrado</ThemedText>
          <ThemedText style={styles.modalInstructions}>
            Tu tag ha quedado registrado, ya puedes ir al home de la aplicación y ver la ubicación
            de tu maleta.
          </ThemedText>
          <View style={styles.nextButtonContainer}>
            <AppButton
              title="Home"
              onPress={() => {
                dispatch(setRegisterTagScreen("form"));
                router.navigate("/screens/tag/(tabs)/");
              }}
            />

            <AppButton
              title="Registrar otro tag"
              labelStyle={{ color: colors.primary }}
              style={{ backgroundColor: colors.secondary }}
              onPress={() => {
                dispatch(setRegisterTagScreen("form"));
              }}
            />
          </View>
        </View>
      </ThemedView>
    );
  }
}

const styles = StyleSheet.create({
  nextButtonContainer: {
    marginTop: 20,
    paddingBottom: 0,
    gap: 10,
    width: "100%",
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
  processingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: width * 0.15,
  },
});
