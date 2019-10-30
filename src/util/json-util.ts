/*
 * Created on Wed Oct 30 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class JsonUtil {

    static readLong(value: any): number {
        if (value.unsigned !== undefined) {
            return (value.high << 32) | value.low;
        }

        return value;
    }

}