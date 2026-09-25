import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const shippingInput = z.object({
  originCep: z.string().regex(/^\d{8}$/),
  destinationCep: z.string().regex(/^\d{8}$/),
  weight: z.number().positive().max(30),
  length: z.number().min(16).max(105),
  height: z.number().min(2).max(105),
  width: z.number().min(11).max(105),
  fallbackPrice: z.number().nonnegative(),
  fallbackDeliveryDays: z.number().int().positive(),
});

export const calculateShipping = createServerFn({ method: "POST" })
  .inputValidator(shippingInput)
  .handler(async ({ data }) => {
    try {
      const { calculateCorreiosQuote } = await import("../shipping.server");
      const quote = await calculateCorreiosQuote(data);
      return { ...quote, source: "superfrete" as const };
    } catch (error) {
      console.error("Falha ao consultar frete nos Correios; usando contingência.", error);
      return {
        price: data.fallbackPrice,
        deliveryDays: data.fallbackDeliveryDays,
        service: "PAC" as const,
        source: "fallback" as const,
      };
    }
  });
