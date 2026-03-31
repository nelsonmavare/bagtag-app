import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { Icon } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

import { AppBar } from "@/src/components";
import { ThemedText } from "@/src/components/ThemedText";
import { colors } from "@/src/utils/colors";
import { appHorizontalPadding, appTopPadding } from "@/src/utils/constants";
import { useFetch } from "@/src/hooks/useFetch";
import { selectAuth, selectUserLogged, setUser } from "@/src/store/AuthSlice";
import { BackendUser, userTransform } from "@/src/utils/transformers/user";

const { height } = Dimensions.get("window");

interface BackendCompany {
  id: string;
  name: string | null;
  description: string | null;
}

export default function ChangeCompanyScreen() {
  const fetch = useFetch();
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUserLogged);
  const auth = useSelector(selectAuth);

  const [companies, setCompanies] = useState<BackendCompany[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedCompanyId = useMemo(() => user?.companyId ?? "", [user?.companyId]);

  useEffect(() => {
    const loadCompanies = async () => {
      setIsLoadingCompanies(true);
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
        } else {
          setCompanies([]);
        }
      } catch (error: unknown) {
        const errorMessage = error as Error;
        Toast.show({
          text1: errorMessage.message,
          type: "error",
        });
        setCompanies([]);
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    loadCompanies().catch(() => {
      setIsLoadingCompanies(false);
      setCompanies([]);
    });
  }, [fetch]);

  const onSelectCompany = async (companyId: string) => {
    if (!user?.id || !auth?.accessToken || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const body = {
        id: user.id,
        nombre: user.name,
        email: user.email,
        rol: user.role,
        genero: user.gender,
        fecha_alta: user.dateJoined,
        telcel: user.phoneNumber,
        telref: user.phoneRef,
        urlimg: user.urlImg,
        estado: user.status,
        idempresa: companyId,
      };

      const response: {
        ok: boolean;
        json: () => Promise<{
          success: boolean;
          data: BackendUser;
        }>;
      } = await fetch(`/user/${user.id}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify(body),
      });

      const responsePayload = await response.json();
      const responseData = responsePayload.data;
      if (response.ok && responseData?.estado === "200") {
        dispatch(setUser(userTransform(responseData)));
        Toast.show({
          text1: "Empresa actualizada",
          type: "success",
        });
        router.replace("/screens/tag/(tabs)/config");
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
      <AppBar title="Empresa relacionada" />
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.content}>
          {isLoadingCompanies ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>Cargando empresas...</ThemedText>
            </View>
          ) : (
            companies.map((company) => {
              const label = company.name ?? "Sin nombre";
              const isSelected = selectedCompanyId === company.id;
              return (
                <TouchableOpacity
                  key={company.id}
                  style={styles.companyRow}
                  disabled={isSaving}
                  onPress={() => {
                    onSelectCompany(company.id);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.companyName}>{label}</ThemedText>
                  </View>
                  {isSelected ? (
                    <Icon source="check-circle" color={colors.primary} size={24} />
                  ) : (
                    <Icon source="chevron-right" color={colors.primary} size={24} />
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: appHorizontalPadding,
    paddingTop: appTopPadding,
    paddingBottom: height * 0.04,
  },
  loadingContainer: {
    marginTop: height * 0.02,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: colors.primary,
  },
  companyRow: {
    borderBottomWidth: 1,
    borderColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  companyName: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "bold",
  },
});
