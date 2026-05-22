import { z } from 'zod'

const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe um email')
  .email('Informe um email valido')

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .regex(
    strongPasswordRegex,
    'A senha deve conter ao menos 1 letra maiuscula, 1 numero e 1 caractere especial'
  )

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe uma senha'),
})

export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Informe seu nome'),
  email: emailSchema,
  password: passwordSchema,
  companyName: z.string().trim().optional(),
})

export const isValidEmail = (email: string): boolean => emailSchema.safeParse(email).success

export const isValidPassword = (password: string): boolean => passwordSchema.safeParse(password).success

export const validateLoginForm = (input: { email: string; password: string }) => loginSchema.safeParse(input)

export const validateSignupForm = (input: {
  name: string
  email: string
  password: string
  companyName?: string
}) => signupSchema.safeParse(input)
