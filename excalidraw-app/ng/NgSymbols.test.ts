import { describe, expect, it } from "vitest";
import { isPassiveSvg } from "./NgSymbols";
import { parseLibraryJSON } from "@excalidraw/excalidraw/data/blob";
import library from "./infra-basica.json";

describe("NG symbols", () => {
  it("imports all native symbols through the real Excalidraw library parser", () => {
    const restored = parseLibraryJSON(JSON.stringify(library));
    expect(restored).toHaveLength(18);
    expect(restored.flatMap((item) => item.elements)).toHaveLength(103);
    for (const item of restored) {
      expect(item.elements.length).toBeGreaterThan(0);
      expect(item.elements.every((element) => !element.isDeleted)).toBe(true);
    }
  });
  it("provides 18 unique native library groups", () => {
    expect(library.type).toBe("excalidrawlib");
    expect(library.libraryItems).toHaveLength(18);
    const ids = library.libraryItems.flatMap((item) =>
      item.elements.map((element) => element.id),
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(library.libraryItems.every((item) => item.elements.length > 0)).toBe(
      true,
    );
  });
  it("rejects scripts, entities, foreign objects and external resources", () => {
    for (const svg of [
      "<svg><script>alert(1)</script></svg>",
      '<svg onload="alert(1)"/>',
      "<svg><foreignObject/></svg>",
      "<!DOCTYPE svg><svg/>",
      '<svg><image href="https://example.com/a.png"/></svg>',
      "<svg><style>path{fill:url(https://example.com)}</style></svg>",
    ]) {
      expect(isPassiveSvg(svg)).toBe(false);
    }
  });
  it("allows inert vector geometry and local fragment references", () => {
    expect(isPassiveSvg('<svg><path d="M0 0 L10 10" fill="#fff"/></svg>')).toBe(
      true,
    );
    expect(isPassiveSvg('<svg><use href="#shape"/></svg>')).toBe(true);
  });
});
