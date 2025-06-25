import { LucideIcon } from "lucide-react";
import { MotionProps as OriginalMotionProps } from "framer-motion";

declare module "framer-motion" {
  interface MotionProps extends OriginalMotionProps {
    className?: string;
  }
}

declare global {
  interface AuthenticatedUser {
    userId: string;
    role: string;
  }

  export interface CatalogResponse {
    favorites: never[];
    id: number;
    lotNo: string;
    sale: number;
    sellingMark: string;
    bags: number;
    totalWeight: number;
    invoiceNo: string | null;
    askingPrice: number;
    adminCognitoId: string;
    country: string;
    manufactureDate: string;
    netWeight: number;
    category: TeaCategory;
    grade: TeaGrade;
    broker: Broker;
    reprint: number;
  }

  export interface ErrorResponse {
    message: string;
    details?: any;
  }

  declare global {
    namespace Express {
      interface Request {
        user?: AuthenticatedUser;
      }
    }
  }
  interface SidebarLinkProps {
    href: string;
    icon: LucideIcon;
    label: string;
  }

  interface CatalogOverviewProps {
    catalogId: number;
  }

  interface shipmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    catalogId: number;
  }

  interface ContactWidgetProps {
    onOpenModal: () => void;
  }


  interface catalogDetailsProps {
    catalogId: number;
  }

  interface catalogOverviewProps {
    catalogId: number;
  }

  interface catalogShipmentProps {
    catalogId: number;
  }

  interface ApplicationCardProps {
    application: Application;
    userType: "admin" | "user";
    children: React.ReactNode;
  }

  interface CardProps {
    property: Property;
    isFavorite: boolean;
    onFavoriteToggle: () => void;
    showFavoriteButton?: boolean;
    propertyLink?: string;
  }

  interface CardCompactProps {
    property: Property;
    isFavorite: boolean;
    onFavoriteToggle: () => void;
    showFavoriteButton?: boolean;
    propertyLink?: string;
  }

  interface HeaderProps {
    title: string;
    subtitle: string;
  }

  interface NavbarProps {
    isDashboard: boolean;
  }

  interface AppSidebarProps {
    userType: "Admin" | "User";
  }

  interface SettingsFormProps {
    initialData: SettingsFormData;
    onSubmit: (data: SettingsFormData) => Promise<void>;
    userType: "Admin" | "User";
  }

  export interface User {
    id: number;
    userCognitoId: string;
    email: string;
    name: string;
    phoneNumber: string;
    role: string;
    createdAt: string;
  }
}

export {};
