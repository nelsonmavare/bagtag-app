import { Image, View } from "react-native";
import { Dimensions } from "react-native";
import { Badge, IconButton } from "react-native-paper";
import { ThemedText } from "./ThemedText";
import { colors } from "../utils/colors";
import { Product } from "../utils/types";
import { useMemo } from "react";
import { AppButton } from "./Button";

const { height, width, fontScale } = Dimensions.get("window");

const ProductCard = ({
  type,
  product,
  primaryAction,
  secondaryAction,
  tertiaryAction,
}: {
  type: "add" | "product" | "lost";
  product?: Product;
  primaryAction: () => void;
  secondaryAction?: () => void;
  tertiaryAction?: () => void;
}) => {
  const isDarkCard = useMemo(() => type === "lost" || type === "add", [type]);
  const isLost = useMemo(() => type === "lost", [type]);

  return (
    <View
      style={{
        minHeight: height * 0.2,
        width: width * 0.4,
        backgroundColor: isDarkCard ? "#1D4071" : "#cfe7eb",
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {isLost && (
        <Badge
          style={{ position: "absolute", top: 5, right: 10, zIndex: 100, fontWeight: "bold" }}
          size={24}
        >
          Perdido
        </Badge>
      )}
      <View
        style={{
          backgroundColor: isDarkCard ? "#112227" : "#89CEE1",
          height: height * 0.1,
          width: "100%",
          borderRadius: 10,
        }}
      >
        <Image
          source={
            isDarkCard
              ? require("@/src/assets/images/suitcase-darkblue.png")
              : require("@/src/assets/images/suitcase-lightblue.png")
          }
          style={{ width: "100%", height: "100%", resizeMode: "contain" }}
        />
      </View>
      <View
        style={{
          alignItems: "center",
          marginVertical: height * 0.015,
          paddingHorizontal: width * 0.03,
        }}
      >
        <ThemedText
          style={{
            color: isDarkCard ? "#fff" : colors.primary,
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: height * 0.01,
          }}
        >
          {product?.name ? product?.name : "Activa tu tag"}
        </ThemedText>
        {type !== "add" && (
          <ThemedText
            style={{
              color: colors.primary,
              fontSize: fontScale * 12,
              textDecorationLine: "underline",
            }}
          >
            {product?.qrCode}
          </ThemedText>
        )}
        <ThemedText
          style={{
            color: isDarkCard ? "#fff" : colors.primary,
            fontSize: fontScale * 12,
            textAlign: "justify",
          }}
        >
          {product?.description
            ? product?.description
            : "Enlaza tu tag a tu cuenta, ubícalo en tu maleta y empieza a rastrearla."}
        </ThemedText>
      </View>
      <View
        style={{
          backgroundColor: isDarkCard ? "#112227" : "#89CEE1",
          height: 50,
          width: "100%",
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isDarkCard && !isLost ? (
          <IconButton
            icon="plus-box-outline"
            iconColor={"#89CEE1"}
            size={40}
            onPress={primaryAction}
          />
        ) : (
          <View style={{
            display: "flex", 
            flexDirection: "row", 
            justifyContent: "space-evenly",
            width: "100%"
          }}>
            <IconButton
              icon="map-marker"
              iconColor={"white"}
              size={34}
              onPress={primaryAction}
            />
            <IconButton
              icon={isLost ? "briefcase-check" : "bag-suitcase-off"}
              iconColor={"white"}
              size={34}
              onPress={secondaryAction}
            />
            <IconButton 
              icon="trash-can-outline"
              iconColor={"white"}
              size={34}
              onPress={tertiaryAction}
            />
          </View>
        )}
      </View>
    </View>
  );
};

export default ProductCard;
