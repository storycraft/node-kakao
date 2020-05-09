# NodeKakao - Loco protocol compatible library
[![NPM](https://nodei.co/npm/node-kakao.png)](https://nodei.co/npm/node-kakao/)

Note: this implemention can stop working anytime.

## Version Information

| v2 | (Recommended) Current |
|----|-----------------------|
| v1 | experimental. buggy   |

## Warning

Many functions that I may not know are disabled or tricked to keep this client simple.

## Example code

```javascript
let client = new TalkClient('TEST_CLIENT');

client.on('message', (chat: Chat) => {
    if (chat.Type === ChatType.Search) {
        let attachment = chat.AttachmentList[0] as SharpAttachment;

        chat.replyText(`${chat.Sender.Nickname}님이 샵 검색 전송 ${attachment.Question}. 리다이렉트 경로: ${attachment.RedirectURL}`);
    }

    if (chat.Text === '안녕하세요') {
        chat.replyText('안녕하세요 ', new ChatMention(chat.Sender)); // Ex) 안녕하세요 @storycraft
        //chat.Channel.sendTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat), '안녕하세요')); // 답장형식
    }
});

client.on('user_join', (channel: ChatChannel, user: ChatUser, joinFeed: ChatFeed) => {
    console.log(user.Nickname + ' 님이 ' + channel.Id + ' 방에 참여했습니다.');
});

client.on('user_left', (channel: ChatChannel, user: ChatUser) => {
    console.log(user.Nickname + ' 님이 ' + channel.Id + ' 방에서 나갔습니다.');
});

client.on('join_channel', (channel: ChatChannel) => {
    console.log('클라이언트가 ' + channel.Id + ' 방에 참여했습니다');
});

client.on('left_channel', (channel: ChatChannel) => {
    console.log('클라이언트가 ' + channel.Id + ' 방에서 나갔습니다');
});

client.on('message_read', (channel: ChatChannel, reader: ChatUser, watermark: Long) => {
    console.log(reader.Nickname + ' 이(가) ' + channel.Id + ' 방의 글을 읽었습니다. 워터마크: ' + watermark);
});

await client.login('123456789@email.com', '123456' /* nice password k*/, 'random base64 device id');
```

License
-------
node-kakao is following MIT License.

Basic Reference
---------
hallazzang([pykakao](https://github.com/hallazzang/pykakao/))  
ssut([pykakao](https://github.com/ssut/pykakao))  
Cai([0x90 :: Cai's Blog](http://www.bpak.org/blog/))
- [[KakaoTalk+] LOCO 프로토콜 분석 (1)](http://www.bpak.org/blog/2012/12/kakaotalk-loco-프로토콜-분석-1/)
- [[KakaoTalk+] LOCO 프로토콜 분석 (2)](http://www.bpak.org/blog/2012/12/kakaotalk-loco-프로토콜-분석-2/)
- [[KakaoTalk+] LOCO 프로토콜 분석 (3)](http://www.bpak.org/blog/2012/12/kakaotalk-loco-프로토콜-분석-3/)
- [[KakaoTalk+] LOCO 프로토콜 분석 (4)](http://www.bpak.org/blog/2012/12/kakaotalk-loco-프로토콜-분석-4/)
- [[KakaoTalkPC] 카카오톡 PC 버전 분석 (1)](https://www.bpak.org/blog/2013/08/kakaotalkpc-카카오톡-pc-버전-분석-1/)
