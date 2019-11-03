# NodeKakao - KakaoTalk PC implemention(Loco protocol wrapper)

Note: this implemention is very unstable and can stop working anytime.

## Warning

There are many security issue to use for production (I expect noone would use this anyway :P).  
IV randomzing and many functions that I may not know are disabled or tricked to keep this client simple.

## Unknown parts

How to generate X-VC field. (seems like using user-agent, email, device-uuid)  
How to generate device_uuid by using device ids?  
  
Since X-VC value is related to security.  
You need to extract it somehow.

## Example code

```javascript
let client = new TalkClient('TEST_CLIENT');

await client.login('123456789@email.com', '123456' /* nice password k*/, 'random base64 device id', 'xvc value');

client.on('message', (chat: Chat) => {
    if (chat instanceof SharpSearchChat) {
        let attachment = chat.AttachmentList[0] as SharpAttachment;

        chat.replyText(`${chat.Sender.UserInfo.Nickname}님이 샵 검색 전송 ${attachment.Question}. 리다이렉트 경로: ${attachment.RedirectURL}`);
    }

    chat.Channel.once('message', (nextChat: Chat) => {
        if (nextChat.Text === '안녕하세요') {
            chat.replyText('안녕하세요');
        }
    })
});

client.on('user_join', (channel: ChatChannel, user: ChatUser, joinMessage: string) => {
    console.log(user.UserInfo.Nickname + ' 님이 ' + channel.ChannelId + ' 방에 참여했습니다. 참가메세지: ' + joinMessage);
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
```
