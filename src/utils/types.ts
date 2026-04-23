
export enum PRODUCT_STATUS {
  ACTIVE = 2,
  LOST = 3,
  INACTIVE = 1,
}

export interface Auth {
  accessToken: string;
  userId: number;
  companyId: number;
  role: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  status: string;
  gender: string;
  phoneNumber: string;
  phoneRef: string;
  urlImg: string;
  dateJoined: string;
}

export interface Tag {
  id: number;
  tag: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  description: string;
  name: string;
  creationDate: Date;
  qrCode: string;
  qrCodeUrl: string;
  serial: string;
  socialReasonId: number;
  userId: number;
  statusId: number;
  productTypeId: number;
  deletionDate: string | null;
  imageUrl: string;
  condition: number;
  rssi: number | null;
  location: string | null;
  lastTimeLocated: string | null;
  clientEmail: string;
  clientName: string;
  lostDate: string | null;
}

export interface SBDevice {
  id: string;
  localName: string;
  isConnectable: boolean;
}
