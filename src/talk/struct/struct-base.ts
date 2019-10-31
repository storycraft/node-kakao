/*
 * Created on Thu Oct 31 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface StructBase {

    fromJson(rawData: any): void;

    toJson(): any;


}