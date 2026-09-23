/**
 * GET /outbound-sales/on-hand-locator
 * Contoh: ?subinventory_code=CANVAS&organization_code=SMG&locator=GIT
 */

export type GetOnHandLocatorParams = {
  organization_code: string;
  subinventory_code?: string;
  locator?: string;
};

export type OnHandLocatorItem = {
  item_code: string;
  item_number: string;
  item_description: string;
  inventory_item_id: number | null;
  organization_id?: number | string | null;
  organization_code?: string;
  organization_name?: string;
  ou_name?: string;
  subinventory_code?: string;
  locator_id?: number | null;
  locator?: string;
  locator_name?: string;
  quantity: number;
  avail_to_reserve: number;
  raw?: unknown;
};

export type OnHandLocatorResult = {
  data: OnHandLocatorItem[];
  meta: {
    fetchedAt: string;
    source: string;
    organization_code: string;
    subinventory_code: string;
    locator: string;
  };
};
