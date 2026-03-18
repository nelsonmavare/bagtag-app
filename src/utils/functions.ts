import { codeRegex } from "./constants";

export const isValidTag = (code: string) => {
  return codeRegex.test(code);
};

export const formatCode = (code: string | undefined) => {
  if (!code) return undefined;
  return code.replace(/:/g, "");
};
