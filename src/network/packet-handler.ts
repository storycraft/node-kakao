/*
 * Created on Sat May 16 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { EventEmitter } from "events";
import { PacketMessageRes } from "../packet/packet-message";
import { PacketMessageReadRes } from "../packet/packet-message-read";
import { PacketNewMemberRes } from "../packet/packet-new-member";
import { PacketSyncDeleteMessageRes } from "../packet/packet-sync-delete-message";
import { PacketLeftRes, PacketLeaveRes, PacketLeaveReq } from "../packet/packet-leave";
import { PacketLinkKickedRes } from "../packet/packet-link-kicked";
import { PacketSyncJoinChannelRes } from "../packet/packet-sync-join-channel";
import { PacketJoinLinkRes } from "../packet/packet-join-link";
import { PacketSyncJoinOpenchatRes } from "../packet/packet-sync-join-openchat";
import { PacketSyncMemberTypeRes } from "../packet/packet-sync-member-type";
import { PacketSyncProfileRes } from "../packet/packet-sync-profile";
import { PacketKickMemberRes } from "../packet/packet-kick-member";
import { PacketDeleteMemberRes } from "../packet/packet-delmem";
import { PacketKickoutRes, LocoKickoutType } from "../packet/packet-kickout";
import { InviteFeed, OpenJoinFeed, DeleteAllFeed, ChatFeed, OpenKickFeed, OpenRewriteFeed, OpenHandOverHostFeed } from "../talk/chat/chat-feed";
import { LocoPacketHandler } from "../loco/loco-packet-handler";
import { NetworkManager } from "./network-manager";
import { LocoRequestPacket, LocoResponsePacket } from "../packet/loco-packet-base";
import { FeedType } from "../talk/feed/feed-type";
import { Long } from "bson";
import { PacketMetaChangeRes } from "../packet/packet-meta-change";
import { PacketSetMetaRes } from "../packet/packet-set-meta";
import { PacketChangeServerRes } from "../packet/packet-change-server";
import { PacketLoginRes } from "../packet/packet-login";
import { ChatUserInfo, OpenChatUserInfo } from "../talk/user/chat-user";
import { PacketUpdateLinkProfileReq, PacketUpdateLinkProfileRes } from "../packet/packet-update-link-profile";
import { FeedChat } from "../talk/chat/chat";
import { ManagedChatChannel, ManagedOpenChatChannel, ManagedBaseChatChannel } from "../talk/managed/managed-chat-channel";
import { ManagedOpenChatUserInfo } from "../talk/managed/managed-chat-user";
import { PacketSyncRewriteRes } from "../packet/packet-sync-rewrite";
import { PacketRewriteRes, PacketRewriteReq } from "../packet/packet-rewrite";
import { ChannelType } from "../talk/channel/channel-type";
import { PacketLinkDeletedRes } from "../packet/packet-link-deleted";
import { OpenMemberType } from "../talk/open/open-link-type";
import { ManagedOpenLink } from "../talk/managed/managed-open-link";
import { PacketSetMemTypeRes } from "../packet/packet-set-mem-type";

export class TalkPacketHandler extends EventEmitter implements LocoPacketHandler {

    private networkManager: NetworkManager;

    private kickReason: LocoKickoutType;

    constructor(networkManager: NetworkManager) {
        super();

        this.kickReason = LocoKickoutType.UNKNOWN;

        this.networkManager = networkManager;

        this.setMaxListeners(1000);

        this.on('LOGINLIST', this.onLogin.bind(this));
        this.on('MSG', this.onMessagePacket.bind(this));
        this.on('NEWMEM', this.onNewMember.bind(this));
        this.on('DECUNREAD', this.onMessageRead.bind(this));
        this.on('JOINLINK', this.onOpenChannelJoin.bind(this));
        this.on('REWRITE', this.onRewrite.bind(this));
        this.on('SYNCLINKCR', this.syncOpenChannelJoin.bind(this));
        this.on('SETMEMTYPE', this.onMemberTypeChange.bind(this));
        this.on('SYNCMEMT', this.onMemberTypeChange.bind(this));
        this.on('SYNCLINKPF', this.syncProfileUpdate.bind(this));
        this.on('SYNCREWR', this.syncRewrite.bind(this));
        this.on('UPLINKPROF', this.syncClientProfileUpdate.bind(this));
        this.on('SETMETA', this.onMetaChange.bind(this));
        this.on('CHGMETA', this.onMetaChange.bind(this));
        this.on('KICKMEM', this.onOpenChannelKick.bind(this));
        this.on('DELMEM', this.onMemberDelete.bind(this));
        this.on('LINKKICKED', this.onLinkKicked.bind(this));
        this.on('LNKDELETED', this.onLinkDeleted.bind(this));
        //this.on('SYNCJOIN', this.onChannelJoin.bind(this));
        this.on('SYNCDLMSG', this.syncMessageDelete.bind(this));
        this.on('LEFT', this.onChannelLeft.bind(this));
        this.on('LEAVE', this.onChannelLeave.bind(this));
        this.on('CHANGESVR', this.onSwitchServerReq.bind(this));
        this.on('KICKOUT', this.onLocoKicked.bind(this));
    }

    get NetworkManager() {
        return this.networkManager;
    }

    get Client() {
        return this.networkManager.Client;
    }

    get ChatManager() {
        return this.Client.ChatManager;
    }

    get ChannelManager() {
        return this.Client.ChannelManager;
    }
    
    get UserManager() {
        return this.Client.UserManager;
    }

    onRequest(packetId: number, packet: LocoRequestPacket): void {

    }
    
    onResponse(packetId: number, packet: LocoResponsePacket, reqPacket?: LocoRequestPacket): void {
        this.emit(packet.PacketName, packet, reqPacket);
    }

    onDisconnected(): void {
        if (this.kickReason !== LocoKickoutType.CHANGE_SERVER) {
            this.Client.emit('disconnected', this.kickReason);
        }
    }

    getManagedChannel(id: Long): ManagedChatChannel | ManagedOpenChatChannel | null {
        return this.ChannelManager.get(id) as ManagedChatChannel | ManagedOpenChatChannel | null;
    }

    async onLogin(packet: PacketLoginRes) {
        await this.Client.updateStatus();
    }

    onMessagePacket(packet: PacketMessageRes) {
        if (!packet.Chatlog) return;

        let chatLog = packet.Chatlog;
        let chat = this.ChatManager.chatFromChatlog(chatLog);

        if (!chat) return;
        
        let channel = chat.Channel as (ManagedChatChannel | ManagedOpenChatChannel);

        let managedInfo = channel.getManagedUserInfo(chat.Sender);
        if (managedInfo) managedInfo.updateNickname(packet.SenderNickname);

        channel.updateLastChat(chat);

        chat.Sender.emit('message', chat);
        channel.emit('message', chat);
        this.Client.emit('message', chat);

        if (!chat.isFeed()) return;

        chat.Sender.emit('feed', chat);
        channel.emit('feed', chat);
        this.Client.emit('feed', chat);
    }

    onMessageRead(packet: PacketMessageReadRes) {
        let channel = this.getManagedChannel(packet.ChannelId);

        if (!channel) return;

        let reader = this.UserManager.get(packet.ReaderId);

        let watermark = packet.Watermark;

        reader.emit('message_read', channel, reader, watermark);
        channel.emit('message_read', channel, reader, watermark);
        this.Client.emit('message_read', channel, reader, watermark);
    }

    onMetaChange(packet: PacketMetaChangeRes | PacketSetMetaRes) {
        if (!packet.Meta) return;

        let channel = this.getManagedChannel(packet.ChannelId);

        if (!channel) return;

        channel.updateMeta(packet.Meta);
        
        channel.emit('meta_changed', channel, packet.Meta.type, packet.Meta);
        this.Client.emit('meta_changed', channel, packet.Meta.type, packet.Meta);
    }

    async onNewMember(packet: PacketNewMemberRes) {
        if (!packet.Chatlog) return;

        let channel = this.getManagedChannel(packet.Chatlog.channelId) as ManagedBaseChatChannel | null;

        if (!channel) {
            channel = await this.ChannelManager.addChannel(packet.Chatlog.channelId) as ManagedBaseChatChannel | null;

            if (!channel) return;
        }

        let chatlog = packet.Chatlog;
        let chat = this.Client.ChatManager.chatFromChatlog(chatlog);

        if (!chat || !chat.isFeed()) return;

        let feed = chat.getFeed() as InviteFeed | OpenJoinFeed;

        let idList: Long[];
        if (feed.members) idList = feed.members.map((feedMemberStruct) => feedMemberStruct.userId);
        else idList = [];

        let infoList: ChatUserInfo[];
        if (idList.length > 0) infoList = (await this.UserManager.requestUserInfoList(channel, idList)).result!;
        else infoList = [];

        for(let i = 0; i < idList.length; i++) {
            let id = idList[i];
            let userInfo = infoList[i];

            let user = this.UserManager.get(id);

            if (!user.isClientUser()) {
                channel.updateUserInfo(id, userInfo);
            }

            user.emit('user_join', channel, user, chat);
            channel.emit('user_join', channel, user, chat);
            this.Client.emit('user_join', channel, user, chat);

            user.emit('feed', chat);
        }

        channel.emit('feed', chat);
        this.Client.emit('feed', chat);
    }

    syncMessageDelete(packet: PacketSyncDeleteMessageRes) {
        if (!packet.Chatlog) return;

        let chat = this.ChatManager.chatFromChatlog(packet.Chatlog);

        if (!chat || !chat.isFeed()) return;

        chat.Sender.emit('message_deleted', chat);
        chat.Channel.emit('message_deleted', chat);
        this.Client.emit('message_deleted', chat);

        chat.Sender.emit('feed', chat);
        chat.Channel.emit('feed', chat);
        this.Client.emit('feed', chat);
    }

    onChannelLeft(packet: PacketLeftRes) {
        let channel = this.getManagedChannel(packet.ChannelId);

        if (!channel) return;

        this.Client.ClientUser.emit('user_left', channel, this.Client.ClientUser);
        channel.emit('user_left', channel, this.Client.ClientUser);
        this.Client.emit('user_left', channel, this.Client.ClientUser);

        this.ChannelManager.removeChannel(channel.Id);
    }

    onChannelLeave(packet: PacketLeaveRes, reqPacket?: PacketLeaveReq) {
        if (!reqPacket || !reqPacket.ChannelId) return;

        let channel = this.getManagedChannel(reqPacket.ChannelId);

        if (!channel) return;

        // get ignored on DM channels
        if (channel.Type === ChannelType.DIRECT || channel.Type === ChannelType.SELFCHAT || channel.Type === ChannelType.OPENCHAT_GROUP) return;

        this.Client.ClientUser.emit('user_left', channel, this.Client.ClientUser);
        channel.emit('user_left', channel, this.Client.ClientUser);
        this.Client.emit('user_left', channel, this.Client.ClientUser);
        
        this.ChannelManager.removeChannel(channel.Id);
    }

    onLinkKicked(packet: PacketLinkKickedRes) {
        if (!packet.Chatlog) return;

        let chat = this.ChatManager.chatFromChatlog(packet.Chatlog) as FeedChat<OpenKickFeed> | null;

        if (!chat || !chat.isFeed()) return;

        let channel = chat.Channel;

        let user = this.UserManager.get(chat.Feed.member.userId);

        user.emit('user_kicked', channel, user, chat);
        channel.emit('user_kicked', channel, user, chat);
        this.Client.emit('user_kicked', channel, user, chat);

        user.emit('feed', chat);
        channel.emit('feed', chat);
        this.Client.emit('feed', chat);

        this.ChannelManager.removeChannel(channel.Id);
    }
    
    onLinkDeleted(packet: PacketLinkDeletedRes) {
        if (!packet.Chatlog) return;

        let chat = this.ChatManager.chatFromChatlog(packet.Chatlog);

        if (!chat || !chat.isFeed()) return;

        chat.Channel.emit('link_deleted', chat.Channel, chat);
        this.Client.emit('link_deleted', chat.Channel, chat);
    }

    /*onChannelJoin(packet: PacketSyncJoinChannelRes) {
        if (!packet.Chatlog) return;

        let chanId = packet.ChannelId;

        let newChan = this.ChannelManager.get(chanId);

        if (!newChan) return;

        let chat = this.ChatManager.chatFromChatlog(packet.Chatlog) as FeedChat;
        if (!chat.isFeed()) return;

        this.Client.emit('join_channel', newChan, chat);
        this.Client.emit('feed', chat);
    }*/

    onOpenChannelJoin(packet: PacketJoinLinkRes) {
        if (!packet.Chatlog) return;

        let chat = this.ChatManager.chatFromChatlog(packet.Chatlog) as FeedChat;

        if (!chat || !chat.isFeed()) return;

        let channel = chat.Channel;

        this.Client.ClientUser.emit('user_join', channel, this.Client.ClientUser);
        channel.emit('user_join', channel, this.Client.ClientUser);
        this.Client.emit('user_join', channel, this.Client.ClientUser);
        
        this.Client.ClientUser.emit('feed', chat);
        channel.emit('feed', chat);
        this.Client.emit('feed', chat);
    }

    onRewrite(packet: PacketRewriteRes, reqPacket?: PacketRewriteReq) {
        if (!reqPacket) return;

        let channel = this.ChannelManager.get(reqPacket.ChannelId);

        if (!channel) return;

        channel.emit('message_hidden', channel, reqPacket.LogId);
        this.Client.emit('message_hidden', channel, reqPacket.LogId);
    }

    async syncOpenChannelJoin(packet: PacketSyncJoinOpenchatRes) {
        if (!packet.ChatInfo) return; // DO NOTHING IF ITS NOT CREATING CHAT CHANNEL

        let chanId = packet.ChatInfo.channelId;

        if (this.ChannelManager.has(chanId) || !packet.ChatInfo) return;
        
        let newChan = await this.ChannelManager.addWithChannelInfo(chanId, packet.ChatInfo);

        this.Client.ClientUser.emit('user_join', newChan, this.Client.ClientUser);
        newChan.emit('user_join', newChan, this.Client.ClientUser);
        this.Client.emit('user_join', newChan, this.Client.ClientUser);
    }

    async onMemberTypeChange(packet: PacketSetMemTypeRes | PacketSyncMemberTypeRes) {
        let chanId = packet.ChannelId;

        let channel = this.getManagedChannel(chanId) as ManagedOpenChatChannel | null;

        if (!channel || !channel.isOpenChat()) return;

        let len = packet.MemberIdList.length;
        for (let i = 0; i < len; i++) {
            let info = channel.getUserInfoId(packet.MemberIdList[i]);
            let type = packet.MemberTypeList[i];

            if (!info) continue;

            let lastType = info.MemberType;

            let managedInfo = channel.getManagedUserInfoId(packet.MemberIdList[i]);
            if (managedInfo) managedInfo.updateMemberType(type);

            if (type === OpenMemberType.OWNER) {
                let link = channel.getOpenLink() as ManagedOpenLink;
                let prevHost = this.UserManager.get(link.LinkOwnerInfo.Id);

                await this.Client.OpenLinkManager.updateInfo(link);

                info.User.emit('link_hand_over_host', channel, info.User, prevHost);
                channel.emit('link_hand_over_host', channel, info.User, prevHost);
                this.Client.emit('link_hand_over_host', channel, info.User, prevHost);

                continue;
            }
        
            info.User.emit('member_type_changed', channel, info.User, lastType);
            channel.emit('member_type_changed', channel, info.User, lastType);
            this.Client.emit('member_type_changed', channel, info.User, lastType);
        }
    }

    syncClientProfileUpdate(packet: PacketUpdateLinkProfileRes, reqPacket: PacketUpdateLinkProfileReq) {
        if (!packet.UpdatedProfile) return;

        let channel = this.ChannelManager.findOpenChatChannel(reqPacket.LinkId);

        if (!channel) return;

        let user = this.UserManager.get(packet.UpdatedProfile.userId);
        let lastInfo = channel.getUserInfo(user);
        
        if (!lastInfo) return;

        (channel as ManagedOpenChatChannel).updateUserInfo(user.Id, this.UserManager.getInfoFromStruct(packet.UpdatedProfile) as ManagedOpenChatUserInfo);
        
        user.emit('profile_changed', channel, user, lastInfo);
        channel.emit('profile_changed', channel, user, lastInfo);
        this.Client.emit('profile_changed', channel, user, lastInfo);
    }
    
    syncProfileUpdate(packet: PacketSyncProfileRes) {
        let chanId = packet.ChannelId;

        if (!packet.OpenMember) return;

        let channel = this.getManagedChannel(chanId) as ManagedOpenChatChannel;

        if (!channel || !channel.isOpenChat()) return;

        let user = this.UserManager.get(packet.OpenMember.userId);
        let lastInfo = channel.getUserInfo(user);
        
        if (!lastInfo) return;

        (channel as ManagedOpenChatChannel).updateUserInfo(user.Id, this.UserManager.getInfoFromStruct(packet.OpenMember) as ManagedOpenChatUserInfo);
        
        user.emit('profile_changed', channel, user, lastInfo);
        channel.emit('profile_changed', channel, user, lastInfo);
        this.Client.emit('profile_changed', channel, user, lastInfo);
    }

    syncRewrite(packet: PacketSyncRewriteRes) {
        if (!packet.Chatlog) return;

        let chat = this.ChatManager.chatFromChatlog(packet.Chatlog) as FeedChat<OpenRewriteFeed>;

        if (!chat || !chat.isFeed()) return;

        chat.Channel.emit('message_hidden', chat.Channel, chat.Feed.logId, chat);
        this.Client.emit('message_hidden', chat.Channel, chat.Feed.logId, chat);

        chat.Sender.emit('feed', chat);
        chat.Channel.emit('feed', chat);
        this.Client.emit('feed', chat);
    }

    onOpenChannelKick(packet: PacketKickMemberRes) {
        if (!packet.Chatlog) return;

        let chat = this.ChatManager.chatFromChatlog(packet.Chatlog) as FeedChat;

        if (!chat || !chat.isFeed()) return;

        let channel = chat.Channel as ManagedBaseChatChannel;
        let feed = chat.getFeed() as OpenKickFeed;

        if (!feed.member) return;

        let kickedUser = this.UserManager.get(feed.member.userId);

        kickedUser.emit('user_kicked', channel, kickedUser, chat);
        channel.emit('user_kicked', channel, kickedUser, chat);
        this.Client.emit('user_kicked', channel, kickedUser, chat);
        this.Client.emit('feed', chat);

        if (this.Client.ClientUser !== kickedUser) channel.updateUserInfo(feed.member.userId, null);
    }

    onMemberDelete(packet: PacketDeleteMemberRes) {
        if (!packet.Chatlog) return;

        let chatLog = packet.Chatlog;

        let chat = this.ChatManager.chatFromChatlog(chatLog);

        if (!chat || !chat.isFeed()) return;

        let channel = chat.Channel as ManagedBaseChatChannel;

        let feed = chat.getFeed() as OpenKickFeed;

        if (!feed.member) return;
            
        let leftUser = this.UserManager.get(feed.member.userId);

        leftUser.emit('user_left', channel, leftUser, chat);
        channel.emit('user_left', channel, leftUser, chat);
        this.Client.emit('user_left', channel, leftUser, chat);

        leftUser.emit('feed', chat);
        channel.emit('feed', chat);
        this.Client.emit('feed', chat);

        channel.updateUserInfo(feed.member.userId, null);
    }

     onSwitchServerReq(packet: PacketChangeServerRes) {
        this.kickReason = LocoKickoutType.CHANGE_SERVER;

        this.networkManager.disconnect();

        let accessData = this.Client.getLatestAccessData();

        this.Client.emit('switch_server');

        // recache and relogin
        this.networkManager.getCheckinData(accessData.userId, true).then(() => {
            this.networkManager.locoLogin(this.Client.ApiClient.DeviceUUID, accessData.userId, accessData.accessToken)
                .then(() => this.kickReason = LocoKickoutType.UNKNOWN);
        });
    }

    onLocoKicked(packet: PacketKickoutRes) {
        let reason = packet.Reason;

        this.kickReason = reason;
    }
}
