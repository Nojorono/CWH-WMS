export interface MasterSupplier {
    id?: any;
    VENDOR_ID: number;
    VENDOR_NAME: string;
    VENDOR_NAME_ALT: string | null;
    SUMMARY_FLAG: string;
    ENABLED_FLAG: string;
    LAST_UPDATE_LOGIN: number;
    VENDOR_TYPE_LOOKUP_CODE: string;
    ONE_TIME_FLAG: string;
    VAT_CODE: string | null;
    TERMS_DATE_BASIS: string;
    ATTRIBUTE5: string | null;
    ATTRIBUTE6: string | null;
    ATTRIBUTE7: string | null;
    ATTRIBUTE8: string | null;
    ATTRIBUTE9: string | null;
    ATTRIBUTE10: string | null;
    ATTRIBUTE11: string | null;
    ATTRIBUTE12: string | null;
    ATTRIBUTE13: string | null;
    VAT_REGISTRATION_NUM: string | null;
    PARTY_ID: number;
}

export type CreateMasterSupplier = Omit<MasterSupplier, "id">;
export type UpdateMasterSupplier = Partial<CreateMasterSupplier>;
