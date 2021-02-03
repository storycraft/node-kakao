/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenLinkComponent } from '.';
import { OpenProfileType } from './open-link-type';

/**
 * Anon profile template
 */
export interface OpenLinkAnonProfile {

    /**
     * Nickname
     */
    nickname: string;

    /**
     * Profile image path(not url)
     */
    profilePath: string;

}

/**
 * Main profile template
 */
export interface OpenLinkMainProfile {

}

/**
 * Link profile template
 */
export type OpenLinkLinkProfile = OpenLinkComponent

export type OpenLinkProfiles = OpenLinkAnonProfile | OpenLinkMainProfile | OpenLinkLinkProfile;
export namespace OpenLinkProfiles {

    /**
     * Serialize template to packet key / value structure.
     * @param template
     */
    export function templateToSerialized(template: OpenLinkProfiles): Record<string, any> {
      if ('linkId' in template) {
        return { ptp: OpenProfileType.OPEN_PROFILE, pli: template.linkId };
      } else if ('nickname' in template) {
        return { ptp: OpenProfileType.KAKAO_ANON, nn: template.nickname, pp: template.profilePath };
      } else {
        return { ptp: OpenProfileType.MAIN };
      }
    }

}

