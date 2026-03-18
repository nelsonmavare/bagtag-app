import { createSlice } from "@reduxjs/toolkit";
import { Tag, Product } from "@/src/utils/types";
import { formatCode } from "@/src/utils/functions";

type RegisterTagScreen = "form" | "scanner" | "success" | "processing" | "error";

interface SliceState {
  tag: Tag | undefined;
  product: Product | undefined;
  products: Product[] | undefined;
  code: string | undefined;
  registerTagScreen: RegisterTagScreen;
}

const initialState: SliceState = {
  tag: undefined,
  code: undefined,
  registerTagScreen: "form",
  product: undefined,
  products: undefined,
};

const tagSlice = createSlice({
  name: "tag",
  initialState,
  reducers: {
    setTag: (state, action: { payload: Tag | undefined }) => {
      state.tag = action.payload;
    },
    setCode: (state, action: { payload: string | undefined }) => {
      state.code = formatCode(action.payload);
    },
    setRegisterTagScreen: (state, action: { payload: RegisterTagScreen }) => {
      state.registerTagScreen = action.payload;
    },
    setProduct: (state, action: { payload: Product | undefined }) => {
      state.product = action.payload;
    },
    setProducts: (state, action: { payload: Product[] | undefined }) => {
      state.products = action.payload;
    },
  },
});

export const { setTag, setCode, setRegisterTagScreen, setProduct, setProducts } = tagSlice.actions;

export const selectTag = (state: { tag: SliceState }): Tag | undefined => state.tag.tag;

export const selectCode = (state: { tag: SliceState }): string | undefined => state.tag.code;

export const selectRegisterTagScreen = (
  state: { tag: SliceState }): RegisterTagScreen => state.tag.registerTagScreen;

export const selectProduct = (state: { tag: SliceState }): Product | undefined => state.tag.product;

export const selectProducts = (state: { tag: SliceState }): Product[] | undefined => state.tag.products;

export default tagSlice.reducer;
