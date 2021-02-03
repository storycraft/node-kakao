/*
 * Created on Wed Feb 03 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Chatlog, ChatType } from "../../chat";
import { MediaKeyComponent } from "../../media";
import { AsyncCommandResult, CommandResultDone } from "../../request";
import { MediaUploadTemplate } from "../media/upload";
import { TalkChannelSession } from "./talk-channel-session";

/*
 * Common complex channel methods
 */

export async function sendMultiMedia(channelSession: TalkChannelSession, type: ChatType, templates: MediaUploadTemplate[]): AsyncCommandResult<Chatlog> {
    const res = await channelSession.uploadMultiMedia(type, templates);
    if (!res.success) return res;

    const keyResList = await Promise.all(res.result.map(uploader => uploader.upload()));
    const failed = keyResList.find(uploadRes => !uploadRes.success);
    if (failed && !failed.success) return failed;
    const keyList = keyResList as CommandResultDone<MediaKeyComponent>[];
    
    return channelSession.forwardChat({
        text: '',
        type,
        attachment: {
            kl: keyList.map(uploadRes => uploadRes.result.key),
            wl: templates.map(template => template.width || 0),
            hl: templates.map(template => template.height || 0),
            mtl: templates.map(template => template.ext || ''),
            sl: templates.map(template => template.data.byteLength),
            imageUrls: [], thumbnailUrls: [],
            thumbnailWidths: [], thumbnailHeights: []
        }
    });
}