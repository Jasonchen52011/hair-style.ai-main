import { z } from 'zod';

const envSchema = z.object({
    AILABAPI_API_KEY: z.string().min(1),
    NODE_ENV: z.enum(['development', 'production', 'test']),
});

try {
    envSchema.parse(process.env);
} catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Invalid environment variables');
}

export const env = process.env as z.infer<typeof envSchema>; 