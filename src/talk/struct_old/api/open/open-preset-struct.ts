/*
 * Created on Thu Jul 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenStruct } from "./open-struct";
import { ObjectMapper, Converter } from "json-proxy-mapper";
import { StructBase } from "../../struct-base";

export interface OpenPresetItemStruct extends StructBase {

    id: number;

    linkImagePath: string;
    linkImageURL: string;

}

export namespace OpenPresetItemStruct {

    export const Mappings = {

        id: 'id',
        linkImagePath: 'lip',
        linkImageURL: 'liu'

    }

    export const MAPPER = new ObjectMapper(Mappings);

}

export interface OpenPresetStruct extends OpenStruct {

    preset: OpenPresetItemStruct;

}

export namespace OpenPresetStruct {

    export const Mappings = {

        preset: 'preset'

    }


    export const ConvertMap = {
        
        preset: new Converter.Object(OpenPresetItemStruct.Mappings)

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);

}