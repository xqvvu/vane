import { describe, expect, it } from "vitest";

import {
  DashboardOperationSearchSchema,
  mergeOperationSearch,
  operationFiltersFromSearch,
} from "#/features/operations/model/operation-search";

describe("operation search params", () => {
  it("coerces eventPage into numbered pagination filters", () => {
    const search = DashboardOperationSearchSchema.parse({
      eventPage: "3",
      q: "  cpu  ",
    });

    expect(operationFiltersFromSearch(search)).toEqual({
      eventPage: 3,
      q: "cpu",
    });
  });

  it("omits the first event page and resets it when filters change", () => {
    expect(
      mergeOperationSearch(
        {
          eventPage: 4,
          deliveryCursor: "older-deliveries",
          severity: "critical",
        },
        {
          severity: "warning",
        },
      ),
    ).toEqual({
      severity: "warning",
    });

    expect(mergeOperationSearch({ eventPage: 2 }, { eventPage: 1 })).toEqual({});
  });
});
