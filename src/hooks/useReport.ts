import { router } from "expo-router";
import Toast from "react-native-toast-message";

import { setProduct } from "../store/TagSlice";
import { Product } from "../utils/types";
import { useDispatch, useSelector } from "react-redux";
import { PRODUCT_STATUS } from "../utils/types";
import { useFetch } from "./useFetch";
import { selectAuth } from "../store/AuthSlice";
import { setRefreshProducts } from "../store/AppSlice";
import { Peripheral } from "react-native-ble-manager";

export default function useReport({
  setLoading,
  onSuccess,
}: {
  setLoading: (loading: boolean) => void;
  onSuccess?: () => void;
}) {
  const fetch = useFetch();
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);

  const updateProductStatus = async (
    product: Product | undefined,
    newStatus: PRODUCT_STATUS,
    successMessage: string,
    rssi?: number,
    longitude?: number,
    latitude?: number,
  ) => {
    if (!product) return;
    setLoading(true);
    try {
      const body: {
        id: number;
        tipo_estado_id: PRODUCT_STATUS;
        rssi?: number;
        longitude?: number;
        latitude?: number;
      } = {
        id: product?.id,
        tipo_estado_id: newStatus,
      };
      if (rssi) {
        body.rssi = rssi;
      }
      if (longitude && latitude) {
        body.longitude = longitude;
        body.latitude = latitude;
      }

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
      } = await fetch(`/products/state`, options);

      const responsePayload = await response.json();
      const responseData = responsePayload.data;

      if (response.ok) {
        if (responseData.estado === "200") {
          dispatch(setProduct(undefined));
          dispatch(setRefreshProducts(true));
          Toast.show({
            text1: successMessage,
            text2: `Se ha indicado como ${successMessage.toLowerCase()}`,
            type: "info",
          });
          onSuccess?.();
          router.replace("/screens/tag/(tabs)/");
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

  const onProductLost = (product?: Product) =>
    updateProductStatus(product, PRODUCT_STATUS.LOST, "Maleta perdida");
  const onProductFound = (
    product?: Product,
    peripheral?: Peripheral,
    longitude?: number,
    latitude?: number,
  ) =>
    updateProductStatus(
      product,
      PRODUCT_STATUS.ACTIVE,
      "Maleta encontrada",
      peripheral?.rssi,
      longitude,
      latitude,
    );

  return {
    onProductLost,
    onProductFound,
  };
}
