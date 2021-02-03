import { Long } from 'bson';
import * as LosslessJSON from 'lossless-json';

/*
 * Created on Wed Oct 30 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export namespace JsonUtil {
    const bsonLongRiver = (key: string, value: any) => {
      if (value && value.isLosslessNumber) {
        try {
          return value.valueOf();
        } catch (e) {
          return Long.fromString(value.toString());
        }
      }

      return value;
    };

    const bsonLongReplacer = (key: string, value: any) => {
      if (value && value instanceof Long) {
        return new LosslessJSON.LosslessNumber(value.toString());
      }

      return value;
    };

    export function readLong(value: any): Long {
      if (value && value.unsigned !== undefined) {
        return (value as Long);
      }

      return Long.fromNumber(value);
    }

    export function parseLoseless(obj: string): any {
      return LosslessJSON.parse(obj, bsonLongRiver);
    }

    export function stringifyLoseless(obj: any): string {
      return LosslessJSON.stringify(obj, bsonLongReplacer);
    }

}
