
export interface User {
  id?: number;
  username: string;
  email: string;
  password?: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  role?: string;
  createdAt?: Date;
}