/*
 * Created on Wed Jun 03 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export type CallVoipType = 'invite'
  | 'cinvite'
  | 'canceled'
  | 'bye'
  | 'noanswer'
  | 'deny'
  | 'maintenance'
  | 'busy'
  | 'add'
  | 'transferred';
export type VCallVoipType = 'v_invite' | 'v_canceled' | 'v_bye' | 'v_noanswer' | 'v_deny' | 'v_busy';
export type LiveTalkType = 'linvite';

export type VoipType = CallVoipType | VCallVoipType | LiveTalkType;
