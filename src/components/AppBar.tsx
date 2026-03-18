import * as React from "react";
import { Appbar } from "react-native-paper";
import { colors } from "../utils/colors";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";

export const AppBar = (props: {
  title?: string;
  withoutBackButton?: boolean;
  onBackPress?: () => void;
}) => {
  const router = useRouter();
  const _goBack = () => router.back();

  return (
    <Appbar.Header mode="center-aligned" style={{ backgroundColor: colors.primary }}>
      {!props.withoutBackButton && (
        <Appbar.BackAction onPress={props.onBackPress ?? _goBack} color="white" />
      )}
      {props.title ? (
        <Appbar.Content title={props.title} color="white" />
      ) : (
        <Appbar.Content
          title={
            <Image
              source={require("@/src/assets/images/bagtag-logo-header.png")}
              style={styles.appLogo}
            />
          }
          color="white"
        />
      )}
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  appLogo: {
    height: "70%",
    width: "100%",
    objectFit: "contain",
  },
});
