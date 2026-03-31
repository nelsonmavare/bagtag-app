import { Dimensions, Linking, StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { AppBar, AppButton } from "@/src/components";
import { useEffect, useMemo, useState } from "react";
import { appHorizontalPadding, appTopPadding } from "@/src/utils/constants";
import { ThemedText } from "@/src/components/ThemedText";
import { colors } from "@/src/utils/colors";
import { ScrollView } from "react-native-gesture-handler";
import { useDispatch, useSelector } from "react-redux";
import { selectUserLogged, setAuth } from "@/src/store/AuthSlice";
import { Icon } from "react-native-paper";
import { useFetch } from "@/src/hooks/useFetch";

const { height, fontScale } = Dimensions.get("window");

const OptionButton = ({
  color = colors.primary,
  prefix,
  title,
  value,
  onPress,
}: {
  title: string;
  onPress: () => void;
  value?: string;
  color?: string;
  prefix?: string;
}) => {
  return (
    <TouchableOpacity style={[styles.optionButtonContainer, { borderColor: color }]} onPress={onPress}>
      {prefix && (
        <View style={{ marginRight: 6 }}>
          <Icon source={prefix} color={color} size={35} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <ThemedText style={[styles.optionButtonText, { color }]}>{title}</ThemedText>
        {value && <ThemedText style={styles.optionButtonValue}>{value}</ThemedText>}
      </View>
      <Icon source="chevron-right" color={color} size={35} />
    </TouchableOpacity>
  );
};

export default function ConfigScreen() {
  const fetch = useFetch();
  const dispatch = useDispatch();
  const user = useSelector(selectUserLogged);
  const [companies, setCompanies] = useState<{ id: string; name: string | null }[]>([]);

  const router = useRouter();
  const selectedCompanyName = useMemo(() => {
    if (!user?.companyId) {
      return "Sin empresa";
    }
    const selectedCompany = companies.find((company) => company.id === user.companyId);
    if (!selectedCompany) {
      return "Empresa no encontrada";
    }
    return selectedCompany.name ?? "Sin nombre";
  }, [companies, user?.companyId]);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await fetch("/company", {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
        const responsePayload = await response.json();
        if (response.ok && Array.isArray(responsePayload.data)) {
          setCompanies(responsePayload.data);
        }
      } catch {
        setCompanies([]);
      }
    };

    loadCompanies().catch(() => {
      setCompanies([]);
    });
  }, [fetch]);

  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Configuración" withoutBackButton />
      <ScrollView>
        <View
          style={{
            paddingHorizontal: appHorizontalPadding,
            paddingTop: appTopPadding + 20,
            flex: 1,
          }}
        >
          <OptionButton
            title="Nombre completo"
            value={user?.name}
            onPress={() => {
              router.navigate("/screens/auth/changeUserInfo");
            }}
          />
          <OptionButton
            title="Correo electrónico"
            value={user?.email}
            onPress={() => {
              router.navigate("/screens/auth/changeEmail");
            }}
          />
          <OptionButton
            title="Teléfono"
            value={`${user?.phoneRef ? user?.phoneRef : "+54"} ${user?.phoneNumber}`}
            onPress={() => {
              router.navigate("/screens/auth/changePhone");
            }}
          />
          <OptionButton
            title="Empresa relacionada"
            value={selectedCompanyName}
            onPress={() => {
              router.navigate("/screens/auth/changeCompany" as any);
            }}
          />
          <OptionButton
            title="Soporte"
            onPress={() => {
              Linking.openURL('mailto:soporte@bagtag.com.ar');
            }}
            prefix={"headset"}
          />
          <OptionButton
            title="Eliminar cuenta"
            onPress={() => {
              router.navigate("/screens/auth/deleteAccount");
            }}
            color={colors.error}
          />
          <View style={styles.logOutButtonContainer}>
            <AppButton
              title="Cerrar sesión"
              onPress={() => {
                dispatch(setAuth(undefined));
                router.navigate("/");
              }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  optionButtonContainer: {
    flexDirection: "row",
    marginBottom: height * 0.06,
    borderBottomWidth: 1,
    borderColor: colors.primary,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: height * 0.06,
  },
  optionButtonText: {
    fontSize: fontScale * 17,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 8,
  },
  optionButtonValue: {
    fontSize: fontScale * 17,
    marginBottom: 5,
    color: colors.primary,
  },
  logOutButtonContainer: {
    paddingBottom: height * 0.03,
    flex: 1,
    justifyContent: "flex-end",
  },
});
