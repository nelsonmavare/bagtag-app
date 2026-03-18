import { Auth } from "../types";

export interface BackendAuth {
  message: string;
  mensaje: string;
  estado: string; // this is a string because the backend returns "200" instead of the number. The values are the API status codes.
  access_token: string;
  idusuario: number;
  idempresa: number;
  rol: string;
  razon_social: string; //not used
}

export function authTransform(backendAuth: BackendAuth): Auth {
  return {
    accessToken: backendAuth.access_token,
    userId: backendAuth.idusuario,
    companyId: backendAuth.idempresa,
    role: backendAuth.rol,
  };
}
