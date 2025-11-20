export interface MasterSubdist {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    custAccountId: number;
    customerName: string;
    customerNumber: string;
    address1: string;
    provinsi: string;
    kabKodya: string;
    kecamatan: string;
    kelurahan: string | null;
    orgId: number;
    channel: string;
    status: string;
    siteType: string | null;
    billToLocation: string;
    billToSiteUseId: number;
    shipToLocation: string;
    shipToSiteUseId: number;
    creditChecking: string;
    overallCreditLimit: string;
    trxCreditLimit: string;
    termId: number;
    termName: string;
    termDay: number;
    priceListId: number;
    priceListName: string;
    orderTypeId: number | null;
    orderTypeName: string | null;
    returnOrderTypeId: number | null;
    returnOrderTypeName: string | null;
    lastUpdateDate: string;
}

export type CreateMasterSubdist = Omit<MasterSubdist, "id">;
export type UpdateMasterSubdist = Partial<CreateMasterSubdist>;
