import { z } from "zod";

export const shipmentSchema = z.object({
  direction: z.string(),
  destination_country: z.string().optional(),
  origin_country_default: z.string().min(2),
  incoterm: z.string(),
  currency: z.string().length(3),
  import_date: z.string().optional()
});

export type ShipmentFormValues = z.infer<typeof shipmentSchema>;
