import { useEffect, useState } from "react";
import { AppBar, AppButton } from "@/src/components";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { View, StyleSheet, Linking, Alert } from "react-native";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import {
  selectLocationPermission,
  setLocationPermission,
  setRefreshProducts,
} from "@/src/store/AppSlice";
import { ThemedText } from "@/src/components/ThemedText";
import { PermissionStatus } from "expo-modules-core";
import { selectProduct, setProduct } from "@/src/store/TagSlice";
import { selectAuth } from "@/src/store/AuthSlice";
import { PRODUCT_STATUS } from "@/src/utils/types";
import { useFetch } from "@/src/hooks/useFetch";
import { colors } from "@/src/utils/colors";

const ProductLocation = () => {
  const fetch = useFetch();
  const dispatch = useDispatch();
  const router = useRouter();

  const locationPermission = useSelector(selectLocationPermission);
  const product = useSelector(selectProduct);
  const auth = useSelector(selectAuth);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    (async () => {
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      if (product?.statusId === PRODUCT_STATUS.LOST) {
        await handleLostProduct();
      }
    })();
    Alert.alert(
      "Ubicación aproximada",
      "Esta es la ubicación aproximada de la maleta, la maleta puede estar en un radio de 20 metros",
      [
        {
          text: "OK",
        },
      ]
    );
  }, [product]);

  const handleLostProduct = async () => {
    try {
      const body = {
        id: product?.id,
        tipo_estado_id: PRODUCT_STATUS.ACTIVE,
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
          data: { estado: string };
          estado: number;
        }>;
      } = await fetch(`/producbystate`, options);

      const responsePayload = await response.json();
      const responseData = responsePayload.data;

      if (response.ok) {
        if (responseData.estado === "200") {
          dispatch(setRefreshProducts(true));
          Toast.show({
            text1: "Maleta encontrada",
            text2: "Se ha indicado como encontrada",
            type: "info",
          });
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

  const askLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    Toast.show({
      text1: `Permisos de ubicación: ${
        status === PermissionStatus.GRANTED ? "Permitido" : "Denegado"
      }`,
      type: "info",
    });
    dispatch(setLocationPermission(status));
  };

  if (locationPermission === PermissionStatus.DENIED) {
    return (
      <>
        <AppBar
          title="Ubicación aproximada"
          onBackPress={() => {
            dispatch(setProduct(undefined));
            router.back();
          }}
        />
        <View style={styles.permissionDeniedContainer}>
          <ThemedText>Permiso para acceder a la ubicación denegado</ThemedText>
          <AppButton onPress={askLocationPermission} title="Reintentar" />
          <AppButton
            style={{ backgroundColor: "transparent" }}
            labelStyle={{ color: colors.primary }}
            onPress={() => Linking.openSettings()}
            title="Ir a configuración"
          />
        </View>
      </>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar
        title="Ubicación aproximada"
        onBackPress={() => {
          dispatch(setProduct(undefined));
          router.back();
        }}
      />
      {location && (
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          }}
          showsUserLocation={true}
        >
          {location && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
            />
          )}
        </MapView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionDeniedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  map: {
    flex: 1,
  },
});

export default ProductLocation;
