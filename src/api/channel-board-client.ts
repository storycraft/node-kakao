/*
 * Created on Sun Jun 28 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { WebApiClient } from "./web-api-client";

export class ChannelBoardClient extends WebApiClient {

    get Scheme() {
        return 'https';
    }

    get Host() {
        return ''; //TODO
    }

}