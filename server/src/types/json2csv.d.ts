declare module 'json2csv' {
    import { Transform } from 'stream';

    export interface Options<T = any> {
        fields?: string[] | FieldInfo<T>[];
        defaultValue?: string;
        delimiter?: string;
        eol?: string;
        excelStrings?: boolean;
        header?: boolean;
        quote?: string;
        doubleQuote?: string;
        quoteColumns?: boolean | string[];
        quoteEmptyOrNull?: boolean;
        withBOM?: boolean;
        transforms?: ((item: any) => any)[];
        flatten?: boolean;
        unwind?: string | string[];
    }

    export interface FieldInfo<T = any> {
        label?: string;
        value: string | ((row: T) => any);
        default?: string;
    }

    export class Parser<T = any> {
        constructor(opts?: Options<T>);
        parse(data: T[]): string;
    }

    export class Transform<T = any> extends Transform {
        constructor(opts?: Options<T>);
    }
}
