import { Long } from "bson";

/*
 * Created on Wed Oct 30 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class JsonUtil {

    static readLong(value: any): Long {
        console.log(value);
        if (value.unsigned !== undefined) {
            return (value as Long);
        }

        return Long.fromNumber(value);
    }

}