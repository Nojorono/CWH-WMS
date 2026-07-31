export type BtbItem = {
  id: string;
  itemName: string;
  sku: string;
  qty: number;
  uom?: string;
};

export type BtbDetail = {
  btbNumber: string;
  spbNumber: string;
  salesName: string;
  btbDate: string;
  totalQty: number;
  totalUom: string;
  items: BtbItem[];
};

export const DUMMY_BTB_DETAIL: BtbDetail = {
  btbNumber: "BTB/KRW/2026/07/001",
  spbNumber: "SPB/KRW/2026/7/0071",
  salesName: "SAEPULLOH",
  btbDate: "01 July 2026",
  totalQty: 333,
  totalUom: "BKS",
  items: [
    {
      id: "1",
      itemName: "AROMA BOLD - 12",
      sku: "ARB12",
      qty: 10,
      uom: "BKS",
    },
    {
      id: "2",
      itemName: "AROMA BOLD - 16",
      sku: "ARB16",
      qty: 35,
      uom: "BKS",
    },
    {
      id: "3",
      itemName: "AROMA ICE LEMON TEA 16",
      sku: "AMITA",
      qty: 5,
      uom: "BKS",
    },
    {
      id: "4",
      itemName: "AROMA MILE 16",
      sku: "ARM16",
      qty: 13,
      uom: "BKS",
    },
    {
      id: "5",
      itemName: "DJARUM SUPER 12",
      sku: "DS12",
      qty: 40,
      uom: "BKS",
    },
    {
      id: "6",
      itemName: "DJARUM SUPER 16",
      sku: "DS16",
      qty: 55,
      uom: "BKS",
    },
    {
      id: "7",
      itemName: "LA LIGHTS FILTER 16",
      sku: "LAL16",
      qty: 28,
      uom: "BKS",
    },
    {
      id: "8",
      itemName: "LA ICE MENTHOL 16",
      sku: "LAI16",
      qty: 22,
      uom: "BKS",
    },
    {
      id: "9",
      itemName: "SAMPORNA MILD 16",
      sku: "SM16",
      qty: 60,
      uom: "BKS",
    },
    {
      id: "10",
      itemName: "GG FILTER 12",
      sku: "GGF12",
      qty: 65,
      uom: "BKS",
    },
  ],
};
