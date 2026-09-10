export type AccessoryKind = "combo" | "accessory";

export type AccessoryMapping = {
  id: string;
  productSlug: string;
  kind: AccessoryKind;
  title: string;
  price: number;
  image: string;
  linkedSlug?: string;
  status: "published" | "draft";
  sortOrder: number;
};

export const accessoryMappingsKey = "drone-admin-accessory-mappings";

const defaultImages = [
  "/images/products/mini-5.jpg",
  "/images/products/mini-3.jpg",
  "/images/products/avata-2.jpg",
  "/images/products/air-3.jpg",
  "/images/products/mavic-3.jpg",
];

export const starterAccessoryMappings: AccessoryMapping[] = [
  { id: "mini5-battery", productSlug: "dji-mini-5-pro-fly-more-combo-plus-rc2", kind: "combo", title: "Intelligent Flight Battery Plus", price: 18500, image: defaultImages[0], status: "published", sortOrder: 1 },
  { id: "mini5-hub", productSlug: "dji-mini-5-pro-fly-more-combo-plus-rc2", kind: "combo", title: "Two-Way Charging Hub", price: 10900, image: defaultImages[1], status: "published", sortOrder: 2 },
  { id: "mini5-props", productSlug: "dji-mini-5-pro-fly-more-combo-plus-rc2", kind: "combo", title: "Propellers (Pair)", price: 1250, image: defaultImages[2], status: "published", sortOrder: 3 },
  { id: "mini5-filters", productSlug: "dji-mini-5-pro-fly-more-combo-plus-rc2", kind: "accessory", title: "ND Filters Set ND16/32/64", price: 5900, image: defaultImages[3], status: "published", sortOrder: 4 },
  { id: "mini5-bag", productSlug: "dji-mini-5-pro-fly-more-combo-plus-rc2", kind: "accessory", title: "Carrying Bag", price: 4200, image: defaultImages[4], status: "published", sortOrder: 5 },
];

export function fallbackAccessoriesFor(productSlug: string): AccessoryMapping[] {
  return starterAccessoryMappings.filter((item) => item.productSlug === productSlug);
}

export function normalizeAccessoryMappings(value: unknown): AccessoryMapping[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is AccessoryMapping => {
    if (!item || typeof item !== "object") return false;
    const record = item as Partial<AccessoryMapping>;
    return typeof record.productSlug === "string" && typeof record.title === "string" && typeof record.price === "number" && typeof record.image === "string";
  }).map((item) => ({
    ...item,
    id: item.id || (item as AccessoryMapping & { _id?: string })._id || crypto.randomUUID(),
    kind: item.kind === "accessory" ? "accessory" : "combo",
    status: item.status === "draft" ? "draft" : "published",
    sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : 0,
  }));
}
