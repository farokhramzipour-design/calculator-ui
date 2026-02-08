import { z } from "zod";

export const calculatorSchema = z.object({
  direction: z.string().min(1),
  destination_country: z.string().min(2),
  origin_country: z.string().min(2),
  import_date: z.string().optional(),
  incoterm: z.string().min(1),
  currency: z.string().min(3),
  exchange_rate: z.string().optional(),
  goods_value: z.coerce.number().nonnegative(),
  quantity: z.coerce.number().optional(),
  net_mass: z.coerce.number().optional(),
  gross_mass: z.coerce.number().optional(),
  discount: z.coerce.number().optional(),
  other_charges: z.coerce.number().optional(),
  freight_cost: z.coerce.number().optional(),
  insurance_amount: z.coerce.number().optional(),
  goods_code: z.string().min(4),
  additional_code: z.string().optional(),
  vat_rate: z.coerce.number().optional(),
  logistics_cost: z.coerce.number().optional(),
  handling_cost: z.coerce.number().optional(),
  brokerage_cost: z.coerce.number().optional(),
  other_fees: z.coerce.number().optional()
});

export type CalculatorFormValues = z.infer<typeof calculatorSchema>;
