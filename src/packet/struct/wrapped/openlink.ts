/*
 * Created on Mon Jan 25 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenLink, OpenLinkInfo } from "../../../openlink/open-link";
import { OpenLinkInfoStruct, OpenLinkStruct } from "../openlink";
import { WrappedOpenLinkChannelUserInfo } from "./user";

export class WrappedOpenLink implements OpenLink {

    constructor(private _struct: OpenLinkStruct) {
        
    }
    
    get linkId() {
        return this._struct.li;
    }

    get linkName() {
        return this._struct.ln;
    }

    get searchable() {
        return this._struct.sc;
    }

    get type() {
        return this._struct.lt;
    }

    get openToken() {
        return this._struct.otk;
    }

    get linkCoverURL() {
        return this._struct.lcu;
    }

    get linkURL() {
        return this._struct.lu;
    }

    get linkOwner() {
        return new WrappedOpenLinkChannelUserInfo(this._struct.olu);
    }

    get description() {
        return this._struct.desc;
    }

    get createdAt() {
        return this._struct.ca;
    }

    get activated() {
        return this._struct.ac;
    }

    get privilege() {
        // WARN: some privilege omitted
        return this._struct.pv.toNumber();
    }

    get profileTagList() {
        return this._struct.op.tags || [];
    }

}

export class WrappedOpenLinkInfo implements OpenLinkInfo {

    constructor(private _struct: OpenLinkInfoStruct) {

    }

    get directLimit() {
        return this._struct.dcl || 0;
    }

    get channelLimit() {
        return this._struct.ml || 0;
    }

}