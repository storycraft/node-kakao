/*
 * Created on Sun Jan 24 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { TalkSession } from '../client';
import {
  InformedOpenLink,
  OpenChannel,
  OpenLink,
  OpenLinkChannelTemplate,
  OpenLinkComponent,
  OpenLinkCreateTemplate,
  OpenLinkKickedUser,
  OpenLinkKickedUserInfo,
  OpenLinkProfile,
  OpenLinkProfiles,
  OpenLinkProfileTemplate,
  OpenLinkSession,
  OpenLinkType,
  OpenLinkUpdateTemplate
} from '../../openlink';
import {
  CreateOpenLinkRes,
  InfoLinkRes,
  JoinInfoRes,
  KLSyncRes,
  SyncLinkRes,
  UpdateOpenLinkRes
} from '../../packet/chat';
import { AsyncCommandResult, KnownDataStatusCode } from '../../request';
import { structToOpenLink, structToOpenLinkInfo, structToOpenLinkKickedUserInfo } from '../../packet/struct';
import { Long } from 'bson';

/**
 * Provides openlink operations
 */
export class TalkOpenLinkSession implements OpenLinkSession {
  private _lastLinkToken: number;

  constructor(private _session: TalkSession) {
    this._lastLinkToken = 0;
  }

  async getLatestLinkList(): AsyncCommandResult<Readonly<InformedOpenLink>[]> {
    const res = await this._session.request<SyncLinkRes>(
      'SYNCLINK',
      {
        'ltk': this._lastLinkToken,
      },
    );
    if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

    const list: InformedOpenLink[] = !res.ols ? [] : res.ols.map((struct) => {
      return { openLink: structToOpenLink(struct), info: structToOpenLinkInfo(struct) };
    });

    this._lastLinkToken = res.ltk;

    return { status: res.status, success: true, result: list };
  }

  async getOpenLink(...components: OpenLinkComponent[]): AsyncCommandResult<Readonly<OpenLink>[]> {
    const res = await this._session.request<InfoLinkRes>(
      'INFOLINK',
      {
        'lis': components.map((component) => component.linkId),
      },
    );
    if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

    const list: OpenLink[] = res.ols ? res.ols.map(structToOpenLink) : [];

    return { status: res.status, success: true, result: list };
  }

  async getJoinInfo(linkURL: string, referer = 'EW'): AsyncCommandResult<Readonly<InformedOpenLink>> {
    const res = await this._session.request<JoinInfoRes>(
      'JOININFO',
      {
        'lu': linkURL,
        'ref': referer,
      },
    );
    if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

    return {
      status: res.status,
      success: true,
      result: { openLink: structToOpenLink(res.ol), info: structToOpenLinkInfo(res.ol) },
    };
  }

  async getKickList(link: OpenLinkComponent): AsyncCommandResult<OpenLinkKickedUserInfo[]> {
    const res = await this._session.request<KLSyncRes>(
      'KLSYNC',
      {
        'li': link.linkId,
      },
    );
    if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

    return { status: res.status, success: true, result: res.kickMembers.map(structToOpenLinkKickedUserInfo) };
  }

  async removeKicked(link: OpenLinkComponent, user: OpenLinkKickedUser): AsyncCommandResult {
    const res = await this._session.request(
      'KLDELITEM',
      {
        'li': link.linkId,
        'c': user.kickedChannelId,
        'kid': user.userId,
      },
    );

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
  }

  async deleteLink(link: OpenLinkComponent): AsyncCommandResult {
    const res = await this._session.request<JoinInfoRes>(
      'DELETELINK',
      {
        'li': link.linkId,
      },
    );

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
  }

  async react(link: OpenLinkComponent, flag: boolean): Promise<{ status: number, success: boolean }> {
    const res = await this._session.request<JoinInfoRes>(
      'REACT',
      {
        'li': link.linkId,
        'rt': flag ? 1 : 0,
      },
    );

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
  }

  async getReaction(link: OpenLinkComponent): AsyncCommandResult<[number, boolean]> {
    const res = await this._session.request(
      'REACTCNT',
      {
        'li': link.linkId,
      },
    );
    if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

    return {
      status: res.status,
      success: true,
      result: [res['rc'] as number, res['rt'] as boolean],
    };
  }

  async createOpenChannel(
    template: OpenLinkChannelTemplate & OpenLinkCreateTemplate,
    profile: OpenLinkProfiles
  ): AsyncCommandResult<OpenChannel> {
    const reqData: Record<string, unknown> = {
      'lt': OpenLinkType.CHANNEL,
      'lip': template.linkCoverURL || '',
      'aptp': !template.mainProfileOnly,
      'ln': template.linkName,
      'pa': template.activated,
      'ri': Long.fromInt(Date.now() / 1000),
      'ml': template.userLimit,
      'desc': template.description,
      'sc': template.searchable,
      ...OpenLinkProfile.serializeLinkProfile(profile)
    };

    const res = await this._session.request<CreateOpenLinkRes>(
      'CREATELINK',
      reqData,
    );
    if (res.status !== KnownDataStatusCode.SUCCESS || !res.chatRoom) return { status: res.status, success: false };

    return { success: true, status: res.status, result: { channelId: res.chatRoom.chatId, linkId: res.ol.li } };
  }

  async createOpenDirectProfile(
    template: OpenLinkChannelTemplate & OpenLinkCreateTemplate,
    profile: OpenLinkProfiles
  ): AsyncCommandResult<InformedOpenLink> {
    const reqData: Record<string, unknown> = {
      'lt': OpenLinkType.PROFILE,
      'lip': template.linkCoverURL || '',
      'aptp': !template.mainProfileOnly,
      'ln': template.linkName,
      'pa': template.activated,
      'ri': Long.fromInt(Date.now() / 1000),
      'dcl': template.userLimit,
      'desc': template.description,
      'sc': template.searchable,
      ...OpenLinkProfile.serializeLinkProfile(profile)
    };

    const res = await this._session.request<CreateOpenLinkRes>(
      'CREATELINK',
      reqData,
    );
    if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

    return {
      success: true, status: res.status,
      result: { openLink: structToOpenLink(res.ol), info: structToOpenLinkInfo(res.ol) }
    };
  }

  // TODO::
  async createOpenProfile(
    template: OpenLinkProfileTemplate & OpenLinkCreateTemplate
  ): AsyncCommandResult<InformedOpenLink> {
    const reqData: Record<string, unknown> = {
      'lt': OpenLinkType.PROFILE,
      'lip': '',
      'aptp': !template.mainProfileOnly,
      'ln': template.linkName,
      'pa': template.activated,
      'ri': Long.fromInt(Date.now() / 1000),
      'did': Long.fromNumber(40),
      ...OpenLinkProfile.serializeLinkProfile({
        nickname: template.linkName,
        profilePath: template.linkCoverURL
      }),
      'dcl': template.directLimit,
      'desc': null,
      'sc': template.searchable,
      'pfc': JSON.stringify({
        description: template.description,
        tags: template.tags
      })
    };

    const res = await this._session.request<CreateOpenLinkRes>(
      'CREATELINK',
      reqData,
    );
    if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

    return {
      success: true, status: res.status,
      result: { openLink: structToOpenLink(res.ol), info: structToOpenLinkInfo(res.ol) }
    };
  }

  async updateOpenLink(
    link: OpenLinkComponent,
    settings: (OpenLinkChannelTemplate | OpenLinkProfileTemplate) & OpenLinkUpdateTemplate
  ): AsyncCommandResult<InformedOpenLink> {
    const reqData: Record<string, unknown> = {
      'li': link.linkId,
      'ln': settings.linkName,
      'ac': settings.activated,
      'pa': true,
      'pc': settings.passcode || '',
      'desc': settings.description,
      'sc': settings.searchable
    };

    if ('directLimit' in settings) {
      reqData['dcl'] = settings.directLimit;
    }

    if ('userLimit' in settings) {
      reqData['ml'] = settings.userLimit;
    }

    if (settings.linkCoverURL) {
      reqData['lip'] = settings.linkCoverURL;
    }

    const res = await this._session.request<UpdateOpenLinkRes>(
      'UPDATELINK',
      reqData,
    );
    if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

    return {
      success: true,
      status: res.status,
      result: {
        openLink: structToOpenLink(res.ol),
        info: structToOpenLinkInfo(res.ol)
      }
    };
  }

}
