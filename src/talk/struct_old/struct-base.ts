/*
 * Created on Thu Oct 31 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";

export type StructPrimitive = number | string | boolean | Long | null | undefined;
export type StructType = StructPrimitive | StructPrimitive[] | StructBase | StructBase[];

export interface StructBase {

}