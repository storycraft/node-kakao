/*
 * Created on Mon Jan 25 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenLink, OpenLinkInfo } from '../../../openlink';
import { OpenLinkInfoStruct, OpenLinkStruct } from '../openlink';
import { structToOpenLinkChannelUserInfo } from './user';

export function structToOpenLink(struct: OpenLinkStruct): OpenLink {
  return {
    linkId: struct.li,
    linkName: struct.ln,
    searchable: struct.sc,
    type: struct.lt,
    openToken: struct.otk,
    linkCoverURL: struct.lcu,
    linkURL: struct.lu,
    createdAt: struct.ca,
    description: struct.desc,
    activated: struct.ac,
    privilege: struct.pv,
    profileTagList: struct.op && struct.op.tags || [],
    linkOwner: structToOpenLinkChannelUserInfo(struct.olu),
  };
}

export function structToOpenLinkInfo(struct: OpenLinkInfoStruct): OpenLinkInfo {
  return {
    directLimit: struct.dcl || 0,
    userLimit: struct.ml || 0,
  };
}
