/*
 * Created on Thu Oct 31 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { JsonUtil } from "../../util/json-util";

export interface StructBase {

    fromJson(rawData: any): void;

    toJson(): any;


}

export interface MappedStruct {

    revocable<T extends object>(target: any, handler: ProxyHandler<T>): { proxy: T; revoke: () => void; };
    new <T extends object>(target: any, handler: ProxyHandler<T>): T;

}

export const WrappedStruct: MappedStruct = Proxy;

export interface StructConverter<T> {

    fromRaw(raw: any): T;
    toRaw(val: T): any;

    defaultValue: T;

}

export interface ConvertMap {

    [key: string]: StructConverter<any>,

}

export namespace StructConverter {

    export const DEFAULT: StructConverter<any> = {

        fromRaw: (raw) => raw,
        toRaw: (val) => val,

        defaultValue: undefined

    };

    export const NUMBER: StructConverter<number> = Object.assign(DEFAULT, { defaultValue: 0 });

    export const STRING: StructConverter<string> = Object.assign(DEFAULT, { defaultValue: '' });

    export const BOOL: StructConverter<boolean> = Object.assign(DEFAULT, { defaultValue: false });

    export const LONG: StructConverter<Long> = {

        fromRaw: (raw) => JsonUtil.readLong(raw),
        toRaw: (val) => val,

        defaultValue: Long.ZERO

    };

}

export class StructMapper implements ProxyHandler<any> {

    constructor(private mappings: any, private converterMap: ConvertMap) {

    }

    get(target: any, p: string) {
        if (this.mappings[p] && this.converterMap[p]) {
            let val = target[this.mappings[p]];
            let converter = this.converterMap[p];

            if (val) return converter.fromRaw(val);

            return converter.defaultValue;
        }
    }

    set(target: any, p: string, value: any): boolean {
        if (this.mappings[p] && this.converterMap[p]) {
            target[this.mappings[p]] = this.converterMap[p].toRaw(value);

            return true;
        }

        return false;
    }

}