/*
 * Created on Fri May 15 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LoginAccessDataStruct } from "../talk/struct/auth/login-access-data-struct";
import { RequestHeader } from "../api/web-api-client";

export interface AccessDataProvider {
    
    getLatestAccessData(): LoginAccessDataStruct;

    fillSessionHeader(header: RequestHeader): void;

}