# NodeKakao - KakaoTalk PC implemention(Loco protocol wrapper)

Note: this implemention is very unstable and can stop working anytime.

## Warning

There are many security issue to use for production (I expect noone would use this anyway :P).  
IV randomzing and many functions that I may not know are disabled or tricked to keep this client simple.

## Unknown parts

How to generate device_uuid by using device ids?

## Example code

```javascript
let client = new TalkClient('TEST_CLIENT');

client.on('message', (chat: Chat) => {
    if (chat.Type === MessageType.Search) {
        let attachment = chat.AttachmentList[0] as SharpAttachment;

        chat.replyText(`${chat.Sender.UserInfo.Nickname}님이 샵 검색 전송 ${attachment.Question}. 리다이렉트 경로: ${attachment.RedirectURL}`);
    }

    if (chat.Text === '안녕하세요') {
        chat.replyText('안녕하세요 ', new ChatMention(chat.Sender)); // Ex) 안녕하세요 @storycraft
        //chat.Channel.sendTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat), '안녕하세요')); // 답장형식
    }
});

client.on('user_join', (channel: ChatChannel, user: ChatUser, joinFeed: chatFeed) => {
    console.log(user.UserInfo.Nickname + ' 님이 ' + channel.ChannelId + ' 방에 참여했습니다.');
});

client.on('user_left', (channel: ChatChannel, user: ChatUser) => {
    console.log(user.UserInfo.Nickname + ' 님이 ' + channel.ChannelId + ' 방에서 나갔습니다.');
});

client.on('join_channel', (channel: ChatChannel) => {
    console.log('클라이언트가 ' + channel.ChannelId + ' 방에 참여했습니다');
});

client.on('left_channel', (channel: ChatChannel) => {
    console.log('클라이언트가 ' + channel.ChannelId + ' 방에서 나갔습니다');
});

client.on('message_read', (channel: ChatChannel, reader: ChatUser, watermark: Long) => {
    console.log(reader.UserInfo.Nickname + ' 이 ' + channel.ChannelId + ' 방의 글을 읽었습니다. 워터마크: ' + watermark);
});

await client.login('123456789@email.com', '123456' /* nice password k*/, 'random base64 device id');
```
