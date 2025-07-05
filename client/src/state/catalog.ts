import {Admin} from "@/state/user";
import {Broker, TeaCategory, TeaGrade} from "@/state/enums";
import { SellingPrice} from "@/types/prismaTypes";
import {Favorite} from "@/state/stock";

export const GRADE_CATEGORY_MAP: Record<TeaGrade, TeaCategory> = {
    PD: TeaCategory.M1,
    PD2: TeaCategory.S1,
    DUST1: TeaCategory.M1,
    DUST2: TeaCategory.S1,
    PF1: TeaCategory.M2,
    BP1: TeaCategory.M3,
    BP2: TeaCategory.M3,
    BP: TeaCategory.S1,
    FNGS: TeaCategory.S1,
    FNGS1: TeaCategory.S1,
    FNGS2: TeaCategory.S1,
    BMF: TeaCategory.S1,
    BMF1: TeaCategory.S1,
    BMFD: TeaCategory.S1,
    DUST: TeaCategory.S1,
    PF2: TeaCategory.S1,
    PF: TeaCategory.S1,
    BOP: TeaCategory.S1,
    BOPF: TeaCategory.S1
};

export interface Catalog {
    id: number;
    saleCode: any;
    lotNo: string;
    category: TeaCategory;
    grade: TeaGrade;
    broker: Broker;
    sellingMark: string;
    bags: number;
    netWeight: number;
    totalWeight: number;
    producerCountry: string | null;
    askingPrice: number;
    invoiceNo: string | null;
    manufactureDate: string | null;
    reprint: string;
    adminCognitoId: string;
    createdAt: string;
    updatedAt: string;
}


