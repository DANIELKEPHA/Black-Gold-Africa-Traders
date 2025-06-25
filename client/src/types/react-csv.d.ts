declare module "react-csv" {
    import { ComponentType, RefAttributes } from "react";

    interface CSVLinkProps {
        data: any[];
        headers?: Array<{ label: string; key: string }>;
        filename?: string;
        className?: string;
        target?: string;
        separator?: string;
        enclosingCharacter?: string;
        uFEFF?: boolean;
        asyncOnClick?: boolean;
        onClick?: (event: React.MouseEvent<HTMLAnchorElement>, done: (proceed?: boolean) => void) => void;
    }

    const CSVLink: ComponentType<CSVLinkProps & RefAttributes<HTMLAnchorElement>>;
    export { CSVLink };
}