/*
 * Created on Wed May 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ApiStruct } from "../api-struct";

export interface LoginTokenStruct extends ApiStruct {

    token: string;
    expires: number; // usage or days?

}