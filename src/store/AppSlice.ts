import { createSlice } from "@reduxjs/toolkit";
import { SBDevice } from "../utils/types";
import { PermissionStatus } from "expo-modules-core";
interface SliceState {
  refreshProducts: boolean;
  selectedDevice: SBDevice | undefined;
  locationPermission: PermissionStatus;
}

const initialState: SliceState = {
  refreshProducts: false,
  selectedDevice: undefined,
  locationPermission: PermissionStatus.GRANTED,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setRefreshProducts: (state, action: { payload: boolean }) => {
      state.refreshProducts = action.payload;
    },
    setSelectedDevice: (state, action: { payload: SBDevice | undefined }) => {
      state.selectedDevice = action.payload;
    },
    setLocationPermission: (state, action: { payload: PermissionStatus }) => {
      state.locationPermission = action.payload;
    },
  },
});

export const { setRefreshProducts, setSelectedDevice, setLocationPermission } = appSlice.actions;

export const selectRefreshProducts = (state: { app: SliceState }): boolean =>
  state.app.refreshProducts;

export const selectSelectedDevice = (state: { app: SliceState }): SBDevice | undefined =>
  state.app.selectedDevice;

export const selectLocationPermission = (state: { app: SliceState }): PermissionStatus =>
  state.app.locationPermission;

export default appSlice.reducer;
