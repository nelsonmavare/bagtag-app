import {
  StyleSheet,
  View,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Platform,
} from "react-native";

import { useDispatch, useSelector } from "react-redux";
import { selectAuth, setAuth, setUser } from "@/src/store/AuthSlice";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppBar, AppButton } from "@/src/components";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import { useFetch } from "@/src/hooks/useFetch";
import { BackendUser, userTransform } from "@/src/utils/transformers/user";
import ProductCard from "@/src/components/ProductCard";
import { colors } from "@/src/utils/colors";
import { ThemedText } from "@/src/components/ThemedText";
import { BackendProduct, productTransform } from "@/src/utils/transformers/product";
import { Product, PRODUCT_STATUS } from "@/src/utils/types";
import CustomModal from "@/src/components/Modal";
import {
  selectRefreshProducts,
  setLocationPermission,
  setRefreshProducts,
} from "@/src/store/AppSlice";
import { selectProduct, selectProducts, setProduct, setProducts } from "@/src/store/TagSlice";
import useReport from "@/src/hooks/useReport";

const { width, height } = Dimensions.get("window");

function parseComparableDate(value?: string | null): number | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  const match = trimmed.match(
    /^(\d{4})[\/-](\d{2})[\/-](\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?$/
  );
  if (!match) {
    const fallback = new Date(trimmed).getTime();
    return Number.isNaN(fallback) ? null : fallback;
  }
  const [, year, month, day, hours = "00", minutes = "00", seconds = "00"] = match;
  const parsedDate = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    Number(seconds)
  );
  const timestamp = parsedDate.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export default function HomeScreen() {
  const fetch = useFetch();
  //const bleManager = new BleManager();

  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);
  const refreshProducts = useSelector(selectRefreshProducts);
  const selectedProduct = useSelector(selectProduct);

  const [loading, setLoading] = useState(false);
  const products = useSelector(selectProducts);
  const [modalVisible, setModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | undefined>(undefined);

  const isSelectedProductLost = useMemo(
    () => selectedProduct?.statusId === PRODUCT_STATUS.LOST,
    [selectedProduct]
  );
  const hasNewLocationAfterLost = useMemo(() => {
    if (!isSelectedProductLost || !selectedProduct) {
      return false;
    }
    const lostDateTimestamp = parseComparableDate(selectedProduct.lostDate);
    const lastTimeLocatedTimestamp = parseComparableDate(selectedProduct.lastTimeLocated);
    if (lostDateTimestamp === null || lastTimeLocatedTimestamp === null) {
      return false;
    }
    return lastTimeLocatedTimestamp > lostDateTimestamp;
  }, [isSelectedProductLost, selectedProduct]);

  const onMarkedAsLost = () => {
    setModalVisible(false);
  };

  const { onProductLost, onProductFound } = useReport({ setLoading, onSuccess: onMarkedAsLost });

  const LoadUserData = async () => {
    setLoading(true);
    let headers = new Headers();

    if (auth?.accessToken) {
      headers.append("Authorization", `Bearer ${auth?.accessToken}`);
    }
    try {
      const options = {
        method: "GET",
        headers: headers,
      };
      const response: {
        ok: boolean;
        json: () => Promise<{
          success: boolean;
          data: BackendUser[];
        }>;
      } = await fetch(`/user/${auth?.userId}`, options);

      const responsePayload = await response.json();
      const responseData = responsePayload.data;
      if (response.ok) {
        if (responseData.length > 0) {
          const user = userTransform(responseData[0]);
          dispatch(setUser(user));
        } else {
          Toast.show({
            text1: "Por favor, inicie sesión nuevamente",
            type: "error",
          });
          dispatch(setUser(undefined));
          dispatch(setAuth(undefined));
          router.replace("/screens/auth/login");
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

  const LoadProducts = async () => {
    setLoading(true);
    let headers = new Headers();

    if (auth?.accessToken) {
      headers.append("Authorization", `Bearer ${auth?.accessToken}`);
    }
    try {
      const options = {
        method: "GET",
        headers: headers,
      };
      const response: {
        ok: boolean;
        json: () => Promise<{
          success: boolean;
          data: BackendProduct[];
        }>;
      } = await fetch(`/products/user/${auth?.userId}`, options);

      const responsePayload = await response.json();
      const responseData = responsePayload.data;
      if (response.ok) {
        if (responseData.length > 0) {
          dispatch(setProducts(responseData.map((product) => productTransform(product))));
        } else {
          dispatch(setProducts([]));
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

  const deleteProduct = useCallback(
    async (productId: number) => {
      setLoading(true);
      let headers = new Headers();

      if (auth?.accessToken) {
        headers.append("Authorization", `Bearer ${auth?.accessToken}`);
      }
      try {
        const options = {
          method: "DELETE",
          headers: headers,
        };
        await fetch(`/products/${productId}`, options);
      } catch (error: unknown) {
        const errorMessage = error as Error;
        Toast.show({
          text1: errorMessage.message,
          type: "error",
        });
      } finally {
        setLoading(false);
        setModalVisible(false);
        setProductToDelete(undefined);
        await LoadProducts();
      }
    },
    [auth]
  );

  useEffect(() => {
    if (auth?.userId) {
      const loadData = async () => {
        await LoadUserData();
        await LoadProducts();
      };
      loadData().catch((error) => {
        console.error(error);
      });
    }
  }, [auth]);

  useEffect(() => {
    if (refreshProducts) {
      LoadProducts();
      dispatch(setRefreshProducts(false));
    }
  }, [refreshProducts]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      dispatch(setLocationPermission(status));
      if (status !== "granted") {
        Toast.show({
          text1: "Los permisos para acceder a la ubicación han sido denegados",
          type: "error",
        });
        Alert.alert(
          "Permiso para acceder a la ubicación denegado",
          "Debes permitirlo para usar la aplicación",
          [
            {
              text: "Cancelar",
              style: "cancel",
            },
            {
              text: "Ir a configuración",
              onPress: () => {
                Linking.openSettings();
              },
            },
          ]
        );
        return;
      }
    })();
  }, []);

  const secondaryAction = useCallback((product: Product) => {
    dispatch(setProduct(product));
    const isLost = product.statusId === PRODUCT_STATUS.LOST;
    const title = isLost ? "Marcar como encontrada" : "Marcar como perdida";
    const message = isLost ? "¿Estás seguro que deseas marcar esta maleta como encontrada?" : "¿Estás seguro que deseas marcar esta maleta como perdida?";
    Alert.alert(
      title,
      message,
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Aceptar",
          onPress: () => {
            isLost ? onProductFound(product) : onProductLost(product);
          }
        }
      ]
    );
  }, [onProductFound, onProductLost]);

  return (
    <View style={{ flex: 1 }}>
      <AppBar withoutBackButton />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContainer}
        refreshControl={<RefreshControl refreshing={false} onRefresh={LoadProducts} />}
      >
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size={width * 0.1} color={colors.primary} />
            <ThemedText>Cargando...</ThemedText>
          </View>
        ) : (
          <>
            {products?.map((product, index) => (
              <ProductCard
                key={`product-${index}-${product.id}`}
                type={product.statusId === PRODUCT_STATUS.LOST ? "lost" : "product"}
                product={product}
                primaryAction={() => {
                  dispatch(setProduct(product));
                  if (product.statusId === PRODUCT_STATUS.LOST) {
                    setModalVisible(true);
                  } else if (
                    typeof product.location === "string" &&
                    product.location.trim().length > 0 &&
                    product.rssi !== null &&
                    product.rssi !== undefined
                  ) {
                    router.navigate("/screens/tag/productLocation");
                  } else {
                    router.navigate(
                      /* Platform.OS === "ios" ? "/screens/tag/externalApp" :  */"/screens/tag/findTag"
                    );
                  }
                }}
                secondaryAction={() => secondaryAction(product)}
                tertiaryAction={() => {
                  setProductToDelete(product);
                  setModalVisible(true);
                }}
              />
            ))}
            {!products?.length && (
              <ProductCard
                type="add"
                primaryAction={() => router.replace("/screens/tag/(tabs)/addTag")}
              />
            )}
          </>
        )}
      </ScrollView>
      <CustomModal visible={modalVisible} onDismiss={() => setModalVisible(false)}>
        <>
          <ThemedText style={styles.modalTitle}>
            {isSelectedProductLost
              ? "Maleta extraviada"
              : "¿Estás seguro que deseas eliminar esta maleta?"}
          </ThemedText>
          <ThemedText style={styles.modalInstructions}>
            {isSelectedProductLost
              ? hasNewLocationAfterLost
                ? "Esta maleta tiene status de perdida y un usuario ha podido ofrecer información de su ubicación ¿Desea ver la ultima ubicación?"
                : "Esta maleta tiene status de perdida y está a la espera de que algún usuario la encuentre. ¿Desea realizar una nueva búsqueda o marcarla como encontrada?"
              : "Esta acción no se puede deshacer y perderás todos los datos asociados a este tag registrado."}
          </ThemedText>
          <View style={styles.modalButtonContainer}>
            {isSelectedProductLost ? (
              <>
                {hasNewLocationAfterLost && (
                  <AppButton
                    title={"Ver ultima ubicación"}
                    loading={loading}
                    disabled={loading}
                    onPress={() => {
                      setModalVisible(false);
                      router.navigate("/screens/tag/productLocation");
                    }}
                    style={{ backgroundColor: colors.primary, marginBottom: 15 }}
                    labelStyle={{ color: "white" }}
                  />
                )}
                <AppButton
                  title={"Realizar nueva búsqueda"}
                  loading={loading}
                  disabled={loading}
                  onPress={() => {
                    setModalVisible(false);
                    router.navigate("/screens/tag/findTag");
                  }}
                  style={{
                    backgroundColor: hasNewLocationAfterLost ? colors.secondary : colors.primary,
                    marginBottom: 15,
                  }}
                  labelStyle={{ color: hasNewLocationAfterLost ? colors.primary : "white" }}
                />
                <AppButton
                  title={"Marcar como encontrada"}
                  onPress={async () => {
                    await onProductLost(selectedProduct);
                  }}
                  loading={loading}
                  disabled={loading}
                  style={{ backgroundColor: colors.secondary }}
                  labelStyle={{ color: loading ? "darkgray" : colors.primary }}
                />
                <AppButton
                  title={"Cancelar"}
                  onPress={() => {
                    setModalVisible(false);
                    setTimeout(() => {
                      dispatch(setProduct(undefined));
                    }, 500);
                  }}
                  style={{ backgroundColor: "transparent", marginTop: height * 0.02 }}
                  labelStyle={{ color: colors.primary }}
                />
              </>
            ) : (
              <>
                <AppButton
                  title={"Aceptar"}
                  loading={loading}
                  disabled={loading}
                  onPress={async () => {
                    if (productToDelete) {
                      setModalVisible(false);
                      await deleteProduct(productToDelete.id);
                    }
                  }}
                  style={{ backgroundColor: "red", marginBottom: 15 }}
                  labelStyle={{ color: "white" }}
                />
                <AppButton
                  title={"Cancelar"}
                  onPress={() => {
                    setModalVisible(false);
                  }}
                  loading={loading}
                  disabled={loading}
                  style={{ backgroundColor: colors.secondary }}
                  labelStyle={{ color: loading ? "darkgray" : colors.primary }}
                />
              </>
            )}
          </View>
        </>
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollViewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: width * 0.05,
    justifyContent: "space-between",
    paddingBottom: height * 0.07,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.05,
  },
  modalButtonContainer: {
    marginTop: height * 0.04,
    paddingBottom: height * 0.02,
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
    fontSize: 16,
  },
});
