import { Long } from 'bson';
import * as LosslessJSON from 'lossless-json';

/*
 * Created on Wed Oct 30 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export namespace JsonUtil {
  const bsonLongReviver = (key: string, value: unknown) => {
    if (typeof value === 'object' && value && 'isLosslessNumber' in value) {
      try {
        return value.valueOf();
      } catch (e) {
        return Long.fromString(value.toString());
      }
    }

    return value;
  };

  const bsonLongReplacer = (key: string, value: unknown) => {
    if (value && value instanceof Long) {
      return new LosslessJSON.LosslessNumber(value.toString());
    }

    return value;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function parseLoseless(obj: string): any {
    return LosslessJSON.parse(obj, bsonLongReviver);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  export function stringifyLoseless(obj: any): string {
    return LosslessJSON.stringify(obj, bsonLongReplacer);
  }

}
