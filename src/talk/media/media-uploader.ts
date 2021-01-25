/*
 * Created on Sun Jan 24 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Channel } from "../../channel/channel";
import { MediaComponent } from "../../media/media";
import { Stream } from "../../network/stream";

export class MediaUploader {
    
    constructor(private _mediaKey: MediaComponent, private _channel: Channel, private _stream: Stream) {

    }

}