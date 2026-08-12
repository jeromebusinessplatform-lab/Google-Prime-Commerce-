import { z } from "zod";

export const TenantContextSchema = z.object({
  tenantId: z.string(),
  botId: z.string(),
});

export type TenantContext = z.infer<typeof TenantContextSchema>;
