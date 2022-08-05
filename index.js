const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const fetch = require("node-fetch");
const mime = require("mime-types");
const FormData = require("form-data");

function isStream(stream) {
  return (
    stream !== null &&
    typeof stream === "object" &&
    typeof stream.pipe === "function"
  );
}

function getToken(app_id, app_secret) {
  return fetch(
    "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
    {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        app_id,
        app_secret,
      }),
    }
  )
    .then((res) => res.json())
    .then((data) => {
      if (data.msg === "ok") {
        return data.tenant_access_token;
      } else {
        throw new Error("get token fail");
      }
    });
}

function uploadFile(file, token) {
  const form = new FormData();
  let file_binary, content_type;
  if (typeof file === "string") {
    file_binary = fs.readFileSync(file);
    content_type = mime.lookup(path.extname(file));
  } else if (typeof file === "object" && isStream(file.value)) {
    file_binary = file.value;
    content_type = file.content_type;
  } else if (typeof file === "object" && Buffer.isBuffer(file.value)) {
    file_binary = file.value;
    content_type = file.content_type;
  } else if (
    typeof file === "object" &&
    file.type &&
    file.type.toLowerCase() === "base64"
  ) {
    file_binary = Buffer.from(file.value, "base64");
    content_type = file.content_type;
  } else {
    throw new Error("传入文件格式不正确");
  }
  form.append("image_type", "message");
  form.append("image", file_binary, {
    content_type,
    name: "image",
  });
  return fetch("https://open.feishu.cn/open-apis/im/v1/images", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.msg === "ok") {
        return data.data.image_key;
      } else {
        throw new Error("upload image fail");
      }
    });
}

class Bot {
  constructor(url, secret_key, app_config = {}) {
    this.webhookUrl = url;
    this.secret_key = secret_key;
    this.app_id = app_config.app_id;
    this.app_secret = app_config.app_secret;
  }
  getToken() {
    if (!this.app_id || !this.app_secret) {
      throw new Error("请传入appId 和 appSecret");
    }
    return getToken(this.app_id, this.app_secret);
  }
  sign(timestamp) {
    const hmac = crypto.createHmac(
      "sha256",
      timestamp + "\n" + this.secret_key
    );
    return hmac.digest("base64");
  }
  post(data) {
    if (this.secret_key) {
      const timestamp = Math.floor(Date.now() / 1000);
      data.timestamp = timestamp;
      data.sign = this.sign(timestamp);
    }
    return fetch(this.webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.StatusMessage === "success") {
          return data;
        } else {
          //   throw new Error(data);
          return data;
        }
      })
      .catch((err) => {
        console.error("发送失败，发生错误！");
        throw err;
      });
  }
  /**
   * @ 单个用户
   * <at user_id="ou_xxx">名字</at>
   * @ 所有人
   * <at user_id="all">所有人</at>
   */
  sendText(text) {
    return this.post({
      msg_type: "text",
      content: {
        text,
      },
    });
  }
  /**
   * 富文本
   * title: 标题 [可选]
   * content 接受二维数组，每个数组代表一行消息
   * [{ tag: "text", "text": "hello" }]
   * 数组内容为内容对象，支持4种类型: text, a, at, img
   * text:
   *  text: 文本内容  [必填]
   *  un_escape: 是否解码 [可选]
   * a:
   *  text: 链接内容  [必填]
   *  href: 地址 [可选]
   * at:
   *  user_id: open_id，union_id或user_id [必填]
   *  user_name: 用户姓名 [可选]
   * img:
   *  image_key: 上传到飞书的文件 key [必填]
   */
  sendRich(content) {
    return this.post({
      msg_type: "post",
      content: {
        post: {
          zh_cn: content,
        },
      },
    });
  }
  sendCard(content) {
    return this.post({
      msg_type: "interactive",
      card: content,
    });
  }
  sendImage(image_key) {
    return this.post({
      msg_type: "image",
      content: {
        image_key: image_key,
      },
    });
  }
  shareChat(chat_id) {
    return this.post({
      msg_type: "share_chat",
      content: {
        share_chat_id: chat_id,
      },
    });
  }
  shareUser(user_id) {
    return this.post({
      msg_type: "share_user",
      content: {
        user_id: user_id,
      },
    });
  }
  /**
   * 高级功能需要 appId 和 appSecret
   */
  async uploadFile(file) {
    const token = await this.getToken();
    const image_key = await uploadFile(file, token);
    return image_key;
  }
  async getImageKeyFromUrl(url) {
    const urlRes = await fetch(url);
    return this.uploadFile({
      value: urlRes.body,
      content_type: "image/png",
    });
  }
  async sendImageFile(file) {
    const token = await this.getToken();
    const image_key = await uploadFile(file, token);
    return this.post({
      msg_type: "image",
      content: {
        image_key: image_key,
      },
    });
  }
  async sendImageUrl(url) {
    const urlRes = await fetch(url);
    return this.sendImageFile({
      value: urlRes.body,
      content_type: "image/png",
    });
  }
}

module.exports = Bot;
