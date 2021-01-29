import { Long } from "bson";
import * as LosslessJSON from "lossless-json";

/*
 * Created on Wed Oct 30 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export namespace JsonUtil {

    export function readLong(value: any): Long {
        if (value && value.unsigned !== undefined) {
            return (value as Long);
        }

        return Long.fromNumber(value);
    }

    export function parseLoseless(obj: string) {
        return LosslessJSON.parse(obj, bsonLongRiviver);
    }

    export function stringifyLoseless(obj: any) {
        return LosslessJSON.stringify(obj, bsonLongReplacer);
    }

    function bsonLongRiviver(key: string, value: any) {
        if (value && value.isLosslessNumber) {
            try {
                return value.valueOf();
            } catch (e) {
                return Long.fromString(value.toString());
            }
        }

        return value;
    }

    function bsonLongReplacer(key: string, value: any) {
        if (value && value instanceof Long) {
            return new LosslessJSON.LosslessNumber(value.toString());
        }

        return value;
    }

}