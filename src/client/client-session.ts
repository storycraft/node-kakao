/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { Channel, OpenChannel } from "../channel/channel";
import { OAuthCredential } from "../oauth/credential";
import { AsyncCommandResult } from "../request/command-result";

export interface LoginResult {

    channelList: (Channel | OpenChannel)[];
    
    /**
     * Client user id
     */
    userId: Long;

}

export interface ClientSession {

    /**
     * Login using credential.
     * Perform LOGINLIST
     * 
     * @param credential 
     */
    login(credential: OAuthCredential): AsyncCommandResult<LoginResult>;

}