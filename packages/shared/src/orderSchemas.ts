import { z } from 'zod';

export const OrderSideSchema = z.enum(['BUY', 'SELL']);
export const OrderTypeSchema = z.enum(['MARKET', 'LIMIT']);

export const OrderCreateInputSchema = z
  .object({
    instrumentId: z.string().uuid(),
    side: OrderSideSchema,
    orderType: OrderTypeSchema,
    quantity: z.number().positive(),
    limitPrice: z.number().positive().optional(),
    clientOrderId: z.string().optional(),
  })
  .refine(
    (orderValue) => orderValue.orderType === 'MARKET' || orderValue.limitPrice !== undefined,
    {
      message: 'Limit price is required for limit orders.',
      path: ['limitPrice'],
    },
  );

export type OrderSide = z.infer<typeof OrderSideSchema>;
export type OrderType = z.infer<typeof OrderTypeSchema>;
export type OrderCreateInput = z.infer<typeof OrderCreateInputSchema>;
