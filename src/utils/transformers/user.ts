import { User } from "../types";

export interface BackendUser {
  id: string;
  iduser: string;
  nombre: string;
  email: string;
  idempresa: string;
  rol: string;
  fecha_alta: string; //not used
  estado: string;
  genero: string;
  telcel: string;
  telref: string;
  urlimg: string;
}

export function userTransform(backendUser: BackendUser): User {
  return {
    id: backendUser.id ?? backendUser.iduser,
    name: backendUser.nombre,
    email: backendUser.email,
    role: backendUser.rol,
    companyId: backendUser.idempresa ?? "",
    status: backendUser.estado,
    gender: backendUser.genero,
    phoneNumber: backendUser.telcel,
    phoneRef: backendUser.telref,
    urlImg: backendUser.urlimg,
    dateJoined: backendUser.fecha_alta,
  };
}
