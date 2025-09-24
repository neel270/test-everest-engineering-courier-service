// User related types and interfaces
import { BaseEntity } from "./common";

export interface IUser extends BaseEntity {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  isActive: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role?: "admin" | "user";
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: "admin" | "user";
  isActive?: boolean;
}

export interface UserResponse {
  id: string | number;
  name: string;
  email: string;
  role: "admin" | "user";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserResponse;
  token: string;
}

export interface RegisterResponse {
  user: UserResponse;
  token: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface UserFilters {
  role?: "admin" | "user";
  isActive?: boolean;
  search?: string;
}
