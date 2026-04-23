
import { Product } from "../types";

export interface BackendProduct {
  id:number;
  descripcion:string;
  nombre:string;
  fecha_creacion:Date;
  codigo_qr:string;
  url_qr:string;
  serial:string;
  razon_social_id:number;
  usuario_id:number;
  tipo_estado_id:number;
  tipo_producto_id:number;
  fecha_baja:string | null;
  lost_time:string | null;
  urlimg:string;
  condicion:number;
  rssi:number | null;
  location:string | null;
  last_time_located:string | null;
  email:string;
  nombre_cliente:string;
}

export function productTransform(backendProduct: BackendProduct): Product {
  return {
    id: backendProduct.id,
    description: backendProduct.descripcion,
    name: backendProduct.nombre,
    creationDate: backendProduct.fecha_creacion,
    qrCode: backendProduct.codigo_qr,
    qrCodeUrl: backendProduct.url_qr,
    serial: backendProduct.serial,
    socialReasonId: backendProduct.razon_social_id,
    userId: backendProduct.usuario_id,
    statusId: backendProduct.tipo_estado_id,
    productTypeId: backendProduct.tipo_producto_id,
    deletionDate: backendProduct.fecha_baja,
    imageUrl: backendProduct.urlimg,
    condition: backendProduct.condicion,
    rssi: backendProduct.rssi,
    location: backendProduct.location,
    lastTimeLocated: backendProduct.last_time_located,
    clientEmail: backendProduct.email,
    clientName: backendProduct.nombre_cliente,
    lostDate: backendProduct.lost_time ?? null,
  };
}
