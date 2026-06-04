import { z } from 'zod';

type SigninMessages = {
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  passwordMin: string;
};

export const getSigninSchema = (messages: SigninMessages) => {
  return z.object({
    email: z
      .string()
      .email({ message: messages.emailInvalid })
      .min(1, { message: messages.emailRequired }),
    password: z
      .string()
      .min(6, { message: messages.passwordMin })
      .min(1, { message: messages.passwordRequired }),
    rememberMe: z.boolean().optional(),
  });
};

export type SigninSchemaType = z.infer<ReturnType<typeof getSigninSchema>>;
