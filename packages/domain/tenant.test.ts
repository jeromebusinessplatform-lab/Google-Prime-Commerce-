import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../db/index.js";
import { enrollOrUpdateIdentity } from "../../apps/core-service/identity.js";

describe("Tenant Data Isolation", () => {
  const tenantA = "tenant-a";
  const tenantB = "tenant-b";

  beforeEach(() => {
    // Clear mock db if needed
  });

  it("should isolate customer identities by tenant", async () => {
    const userA = { id: 111, first_name: "Alice" };
    const userB = { id: 111, first_name: "Alice" };

    const resultA = await enrollOrUpdateIdentity(tenantA, "bot1", userA, "api");
    const resultB = await enrollOrUpdateIdentity(tenantB, "bot2", userB, "api");

    expect(resultA.customerDocId).not.toEqual(resultB.customerDocId);

    const customersA = await db.collection(`tenants/${tenantA}/customers`).get();
    const customersB = await db.collection(`tenants/${tenantB}/customers`).get();

    expect(customersA.docs.length).toBeGreaterThan(0);
    expect(customersB.docs.length).toBeGreaterThan(0);
  });
});
