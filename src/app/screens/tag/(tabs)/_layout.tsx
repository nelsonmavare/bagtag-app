import { Tabs } from "expo-router";
import React from "react";

import { TabBarIcon } from "@/src/components/navigation/TabBarIcon";
import { Colors } from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { colors } from "@/src/utils/colors";
import { Dimensions } from "react-native";

import GearIcon from "@/src/assets/icons/gear.svg";
import GearLightIcon from "@/src/assets/icons/gear-light.svg";
import SquarePlusIcon from "@/src/assets/icons/square-plus.svg";
import SquarePlusLightIcon from "@/src/assets/icons/square-plus-light.svg";
import SuitcaseIcon from "@/src/assets/icons/suitcase.svg";
import SuitcaseLightIcon from "@/src/assets/icons/suitcase-light.svg";

const { height, fontScale } = Dimensions.get("window");
export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.secondary,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          height: height * 0.1,
          paddingBottom: height * 0.018,
          paddingTop: height * 0.018,
        },
      }}
      initialRouteName="index"
    >
      <Tabs.Screen
        name="config"
        options={{
          title: "Configuración",
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <GearIcon width={fontScale * 80} height={fontScale * 26} />
            ) : (
              <GearLightIcon width={fontScale * 80} height={fontScale * 26} />
            ),
          tabBarActiveTintColor: colors.primary,
          tabBarHideOnKeyboard: true,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Mis Maletas",
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <SuitcaseIcon width={fontScale * 80} height={fontScale * 35} />
            ) : (
              <SuitcaseLightIcon width={fontScale * 80} height={fontScale * 35} />
            ),
          tabBarActiveTintColor: colors.primary,
        }}
      />
      <Tabs.Screen
        name="addTag"
        options={{
          title: "Agregar un tag",
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <SquarePlusIcon width={fontScale * 80} height={fontScale * 26} />
            ) : (
              <SquarePlusLightIcon width={fontScale * 80} height={fontScale * 26} />
            ),
          tabBarActiveTintColor: colors.primary,
        }}
      />
    </Tabs>
  );
}
