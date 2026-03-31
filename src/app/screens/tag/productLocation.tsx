import { useEffect, useMemo, useState } from "react";
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

  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const productLocation = useMemo(() => {
    if (!product?.location || typeof product.location !== "string") {
      return null;
    }
    try {
      const parsedLocation = JSON.parse(product.location);
      const latitude = Number(parsedLocation?.lat);
      const longitude = Number(parsedLocation?.long);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }
      return {
        latitude,
        longitude,
      };
    } catch {
      return null;
    }
  }, [product?.location]);

  useEffect(() => {
    (async () => {
      const currentLocation = await Location.getCurrentPositionAsync({});
      setUserLocation(currentLocation);
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

  const initialRegion = useMemo(() => {
    if (productLocation) {
      return {
        latitude: productLocation.latitude,
        longitude: productLocation.longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      };
    }
    if (userLocation) {
      return {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      };
    }
    return null;
  }, [productLocation, userLocation]);

  const singleMarkerCoordinate = useMemo(() => {
    if (productLocation) {
      return productLocation;
    }
    if (userLocation) {
      return {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      };
    }
    return null;
  }, [productLocation, userLocation]);

  const formattedLastTimeLocated = useMemo(() => {
    if (!product?.lastTimeLocated) {
      return "No disponible";
    }
    const normalizedDate = (() => {
      if (product.lastTimeLocated.includes("T")) {
        return product.lastTimeLocated;
      }
      return `${product.lastTimeLocated.replace(" ", "T")}Z`;
    })();
    const parsedDate = new Date(normalizedDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return "No disponible";
    }
    return new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(parsedDate);
  }, [product?.lastTimeLocated]);

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
      {initialRegion && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={initialRegion}
            showsUserLocation={true}
          >
            {singleMarkerCoordinate && (
              <Marker
                coordinate={singleMarkerCoordinate}
                title={productLocation ? "Ubicación del producto" : "Ubicación aproximada"}
                description={
                  product?.rssi !== null && product?.rssi !== undefined
                    ? `RSSI: ${product.rssi}`
                    : undefined
                }
                pinColor="red"
              />
            )}
          </MapView>
          <View style={styles.lastTimeFloatingContainer}>
            <ThemedText style={styles.lastTimeText}>
              Última vez encontrado: {formattedLastTimeLocated}
            </ThemedText>
          </View>
          <View style={styles.floatingButtonContainer}>
            <AppButton
              title="Localizar nuevamente"
              onPress={() => {
                router.replace("/screens/tag/findTag");
              }}
            />
          </View>
        </View>
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
  mapContainer: {
    flex: 1,
  },
  floatingButtonContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    elevation: 4,
  },
  lastTimeFloatingContainer: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  lastTimeText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 12,
  },
});

export default ProductLocation;
