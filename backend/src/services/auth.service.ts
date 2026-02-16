import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../prisma/client';
import { config } from '../config';
import { AppError } from '../utils/AppError';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface CreateUserByAdminInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

interface LoginInput {
  email: string;
  password: string;
}

function validateEmail(email: string): void {
  if (!EMAIL_REGEX.test(email)) {
    throw new AppError('Invalid email format', 400);
  }
}

export async function register(data: RegisterInput) {
  validateEmail(data.email);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: Role.RT,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return user;
}

export async function createUserByAdmin(data: CreateUserByAdminInput, callerRole: Role) {
  if (callerRole !== Role.ADMIN) {
    throw new AppError('Only ADMIN can create users with assigned roles', 403);
  }

  validateEmail(data.email);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return user;
}

export async function login(data: LoginInput) {
  validateEmail(data.email);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isValid = await bcrypt.compare(data.password, user.password);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}
