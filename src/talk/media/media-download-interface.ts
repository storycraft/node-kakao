/*
 * Created on Mon Jun 08 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoSecureCommandInterface, LocoListener } from "../../loco/loco-interface";
import { HostData } from "../../network/host-data";
import { Long } from "bson";

export class MediaDownloadInterface extends LocoSecureCommandInterface {

    private downloading: boolean;

    constructor(hostData: HostData,  listener: LocoListener | null = null) {
        super(hostData, listener);

        this.downloading = false;
    }
    
    get Downloading() {
        return this.downloading;
    }

    async download(clientUserId: Long, key: string, channelId: Long) {

    }

}