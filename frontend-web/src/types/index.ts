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

export interface ReportJobStartResponse {
  jobId: string;
  status: string;
  progress: number;
  message: string;
}

export interface ReportJobStatusResponse {
  jobId: string;
  companyId?: number;
  projectId?: number;
  status: "queued" | "running" | "completed" | "failed" | string;
  progress: number;
  stage: string;
  message: string;
  errorMessage?: string;
  downloadReady?: boolean;
  fileName?: string;
  totalSteps: number;
  completedSteps: number;
  remainingSteps: number;
  startedAt?: string;
  updatedAt?: string;
  finishedAt?: string;
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
  projectName?: string;
  remainingQntd?: number;
  createdAt?: string;
  project?: {
    id: number;
    name?: string;
  };
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
  qntdInvoice?: number;
  umInvoice: string;
  qntdBom?: number;
  umBom: string;
  conversionFactor?: number;
  createdAt?: string;
  company?: {
    id: number;
  };
}

export interface Invoice {
  id?: number;
  project?: {
    id: number;
    name?: string;
  };
  itemCode?: string;
  invoiceNumber: string;
  country?: string;
  invoiceDateString?: string;
  invoiceValue?: number;
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
  poNumber: string;
  itemCode?: string;
  poValue?: number;
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
