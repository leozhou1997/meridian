import { describe, expect, it } from "vitest";
import { BUILT_IN_MODELS, getModelDimensions, getModelName } from "./routers/salesModels";

describe("salesModels built-in models", () => {
  it("should have MEDDIC, BANT, SPICED, and MEDDICC models", () => {
    expect(Object.keys(BUILT_IN_MODELS)).toEqual(
      expect.arrayContaining(["meddic", "bant", "spiced", "meddicc"])
    );
    expect(Object.keys(BUILT_IN_MODELS)).toHaveLength(4);
  });

  it("each model should have name, description, and at least 2 dimensions", () => {
    for (const [key, model] of Object.entries(BUILT_IN_MODELS)) {
      expect(model.name).toBeTruthy();
      expect(model.description).toBeTruthy();
      expect(model.dimensions.length).toBeGreaterThanOrEqual(2);

      // Each dimension should have key, label, description
      for (const dim of model.dimensions) {
        expect(dim.key).toBeTruthy();
        expect(dim.label).toBeTruthy();
        expect(dim.description).toBeTruthy();
      }
    }
  });

  it("MEDDIC should have 6 dimensions", () => {
    expect(BUILT_IN_MODELS.meddic.dimensions).toHaveLength(6);
    const keys = BUILT_IN_MODELS.meddic.dimensions.map(d => d.key);
    expect(keys).toContain("metrics");
    expect(keys).toContain("economic_buyer");
    expect(keys).toContain("champion");
  });

  it("MEDDICC should have 7 dimensions (MEDDIC + Competition)", () => {
    expect(BUILT_IN_MODELS.meddicc.dimensions).toHaveLength(7);
    const keys = BUILT_IN_MODELS.meddicc.dimensions.map(d => d.key);
    expect(keys).toContain("competition");
  });

  it("BANT should have 4 dimensions", () => {
    expect(BUILT_IN_MODELS.bant.dimensions).toHaveLength(4);
  });

  it("SPICED should have 5 dimensions", () => {
    expect(BUILT_IN_MODELS.spiced.dimensions).toHaveLength(5);
  });
});

describe("getModelDimensions", () => {
  it("returns correct dimensions for built-in models", () => {
    const meddic = getModelDimensions("meddic");
    expect(meddic).toHaveLength(6);
    expect(meddic[0].key).toBe("metrics");

    const bant = getModelDimensions("bant");
    expect(bant).toHaveLength(4);
    expect(bant[0].key).toBe("budget");
  });

  it("returns MEDDIC dimensions for unknown model key", () => {
    const unknown = getModelDimensions("nonexistent");
    expect(unknown).toEqual(BUILT_IN_MODELS.meddic.dimensions);
  });

  it("returns custom dimensions when salesModel is 'custom' and dimensions provided", () => {
    const customDims = [
      { key: "fit", label: "Fit", description: "Product-market fit" },
      { key: "urgency", label: "Urgency", description: "How urgent is the need" },
    ];
    const result = getModelDimensions("custom", customDims);
    expect(result).toEqual(customDims);
  });

  it("falls back to MEDDIC when salesModel is 'custom' but no dimensions provided", () => {
    const result = getModelDimensions("custom");
    expect(result).toEqual(BUILT_IN_MODELS.meddic.dimensions);
  });
});

describe("getModelName", () => {
  it("returns correct name for built-in models", () => {
    expect(getModelName("meddic")).toBe("MEDDIC");
    expect(getModelName("bant")).toBe("BANT");
    expect(getModelName("spiced")).toBe("SPICED");
    expect(getModelName("meddicc")).toBe("MEDDICC");
  });

  it("returns MEDDIC for unknown model key", () => {
    expect(getModelName("nonexistent")).toBe("MEDDIC");
  });

  it("returns custom name when salesModel is 'custom'", () => {
    expect(getModelName("custom", "My Custom Model")).toBe("My Custom Model");
  });

  it("falls back to MEDDIC when salesModel is 'custom' but no name provided", () => {
    // When custom but no name, the function returns undefined for the custom path
    // but the fallback should give MEDDIC
    const result = getModelName("custom");
    expect(result).toBe("MEDDIC");
  });
});
