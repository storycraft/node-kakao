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