# feishu-webhook-bot

### 飞书 webhook 机器人

飞书群组机器人分为两种。

一种是单向的基于 webhook 机器人，优点是配置简单，群组设置里就能配置好。缺点是只能单向发送消息，没有交互能力。

另一种是后台配置的应用型机器人，优点是具备交互能力，缺点是有一定的学习成本。

这个 bot 是 webhook 型。

## Usage

```sh
npm i --save feishu-webhook-bot
```

或

```sh
yarn add feishu-webhook-bot
```

创建一个 bot 对象来调用方法：

```js
const Bot = require("feishu-webhook-bot");

// class 第一个参数是群组设置里的 webhook 地址，设置了签名校验的话，第二个参数传入密钥。
const bot = new Bot(
  "https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
);

// 返回一个 Promise Promise 结果是飞书返回的 Response { StatusCode: 0, StatusMessage: 'success' }
bot.sendText("hello world!");
```

## API

### sendTet(text) [官方文档](https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN#发送文本消息)

发送一个文本消息  
| 参数 | 类型 | 说明 |  
| - | - | - |  
| text | `String` | 需要发送的文本 |

Example:

```js
bot.sendText("hello world!");
```

![alt send_text](http://paste.file.dayustudio.com/send_text.png)

### sendRich(richContent) [官方文档](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/im-v1/message/create_json#富文本%20post)

发送一个复杂文本消息  
| 参数 | 类型 | 说明 |  
| - | - | - |  
| richContent | `Object` | 对象 |

### richContent

| 参数    | 类型     | 说明                               |
| ------- | -------- | ---------------------------------- |
| title   | `String` | 标题                               |
| content | `Array`  | 内容二维数组，每个数组代表一行消息 |

### content

`[[{ tag: "text", "text": "hello" }] ]`  
单行消息数组内容为内容对象，tag 支持 4 种类型: text, a, at, img

### text

`{ tag: "text", "text": "hello" }`  
text: 文本内容 `[必填]`  
un_escape: 是否解码 `[可选]`

### a

`{ tag: "a", text: "链接", href: "https://xx.xx" }`  
text: 链接内容 [必填]  
href: 地址 [可选]

### at

`{ tag: "at", user_id: "all", use_name: "所有人" }`  
user_id: open_id，union_id 或 user_id [必填]  
user_name: 用户姓名 [可选]

### img

`{ image_key: "xxxxxxxxxxxxxx" }`  
image_key: 上传到飞书的文件 key [必填]

Example:

```js
bot.sendRich({
  title: "rich title",
  content: [
    [
      {
        tag: "text",
        text: "测试",
      },
      {
        tag: "a",
        href: "http://github.com",
        text: "测试",
      },
    ],
    [
      {
        tag: "at",
        user_id: "all",
      },
    ],
  ],
});
```

![alt send_rich](http://paste.file.dayustudio.com/send_rich.png)
