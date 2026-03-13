export interface User {
  id: number;
  username: string;
  email: string;
  companyId?: number;
  companyName?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  code?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface FaceLoginRequest {
  faceImage: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  companyName?: string;
  faceImage?: string;
}

export interface Bom {
  id?: number;
  itemCode: string;
  itemName: string;
  umBom: string;
  qntd: number;
  company?: {
    id: number;
  };
}

export interface Conversion {
  id?: number;
  itemCode: string;
  umInvoice: string;
  umBom: string;
  conversionFactor: number;
  category?: string;
  qntdInvoice?: number;
  qntdBom?: number;
  company?: {
    id: number;
  };
}

export interface Invoice {
  id?: number;
  invoiceNumber: string;
  qntdInvoice: number;
  umInvoice: string;
  remainingQntd: number;
  createdAt?: string;
  company?: {
    id: number;
  };
}

export interface Po {
  id?: number;
  invoiceNumber: string; // references invoice
  qntdInvoice: number;
  umPo: string;
  remainingQntd: number;
  createdAt?: string;
  company?: {
    id: number;
  };
}

export interface Project {
  id?: number;
  name: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  company?: {
    id: number;
  };
}
