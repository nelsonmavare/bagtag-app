import { Button, Text } from "react-native-paper";
import { colors } from "../utils/colors";
import { StyleProp, TextStyle, ViewStyle } from "react-native";

export const AppButton = ({
  title,
  onPress,
  style,
  labelStyle,
  loading,
  disabled,
}: {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  loading?: boolean;
  disabled?: boolean;
}) => {
  return (
    <Button
      mode="contained"
      onPress={onPress}
      disabled={disabled}
      style={{
        borderRadius: 10,
        backgroundColor: disabled ? "lightgray" : colors.primary,
        height: 50,
        alignContent: "center",
        justifyContent: "center",
        ...style
      }}
      rippleColor={colors.secondary}
      labelStyle={{
        fontSize: 16,
        color: "#fff",
        ...labelStyle
      }}
      loading={loading}
    >
     {title}
    </Button>
  );
};
