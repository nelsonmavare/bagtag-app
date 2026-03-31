import { Dimensions, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { AppBar, AppButton, } from "@/src/components";
import { useMemo, useState } from "react";
import { appHorizontalPadding, appTopPadding } from "@/src/utils/constants";
import { ScrollView } from "react-native-gesture-handler";
import { selectAuth, selectUserLogged, setUser } from "@/src/store/AuthSlice";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import { BackendUser, userTransform } from "@/src/utils/transformers/user";
import { useFetch } from "@/src/hooks/useFetch";
import PhoneInput from "@/src/components/PhoneInput";

const { height } = Dimensions.get("window");

//TODO: combine this component with changeUserInfo
export default function ChangePhoneScreen() {
  const fetch = useFetch();
  const dispatch = useDispatch();

  const router = useRouter();
  const user = useSelector(selectUserLogged);
  const auth = useSelector(selectAuth);

  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [isSaving, setIsSaving] = useState(false);
  const [countryCode, setCountryCode] = useState(user?.phoneRef || "");

  const countryCodeWithPlus = useMemo(() => {
    if (countryCode.length === 0) {
      return "+54";
    }
    if (countryCode.includes("+")) {
      return countryCode;
    }
    return `+${countryCode}`;
  }, [countryCode]);

  const validateInputs = () => {
    if (phone.length === 0) {
      Toast.show({
        text1: "El teléfono es requerido",
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
        email: user?.email,
        rol: user?.role,
        idempresa: user?.companyId,
        genero: user?.gender,
        fecha_alta: user?.dateJoined,
        telcel: phone,
        telref: countryCodeWithPlus,
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
          <PhoneInput
            setPhone={setPhone}
            setCountryCode={setCountryCode}
            countryCodeValue={countryCodeWithPlus}
            phoneValue={phone}
          />

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
