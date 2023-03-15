# websocket和eventSource和ajax轮询之间的区别

## 1、即时通讯的方案

后台向前端实时的推送数据、目前的方案分为以下几种：

* 1、`ajax`轮询

  * 介绍： 本质上不属于实时通信、只是通过`setInterval`开启一个定时器、来模拟达到实时通信的目的
  * 缺点：在建立连接通信上会耗费大量的时间和流量
  * 优点：简单

* 2、`websocket`双向通信

  * 介绍： HTML5 WebSocket规范定义了一种API，使Web页面能够使用WebSocket协议与远程主机进行双向通信。与轮询和长轮询相比，巨大减少了不必要的网络流量和等待时间。WebSocket属于应用层协议。它基于TCP传输协议，并复用HTTP的握手通道。但不是基于HTTP协议的，只是在建立连接之前要借助一下HTTP，然后在第一次握手是升级协议为ws或者wss。
  * 缺点：会占用服务端资源比较高
  * 优点：双向通信、可以推送任何类型的数据（字符串、二进制...）

* 3、`EventSource` 服务端向前台推送信息
  * EventSource 基于 HTTP 协议实现，通过与服务器建立一个持续连接，实现了服务器向客户端推送事件数据的功能。在客户端，EventSource 对象通过一个 URL 发起与服务器的连接。连接成功后，服务器可以向客户端发送事件数据。在客户端，通过 EventSource 对象注册事件处理函数，以接收来自服务器的事件数据。

  * 缺点： 只能接推送字符串类型的数据、只能服务端单向通信

  * 优点： 服务端占用资源较少


## 2、测试ajax轮询

**WebSockets** 是一种先进的技术。它可以在用户的浏览器和服务器之间打开交互式通信会话。使用此 API，您可以向服务器发送消息并接收事件驱动的响应，而无需通过轮询服务器的方式以获得响应。

兼容性

![image-20230315175016167](https://blog-1302889287.cos.ap-nanjing.myqcloud.com/websocket%E5%92%8CeventSource%E5%92%8Cajax%E8%BD%AE%E8%AF%A2%E4%B9%8B%E9%97%B4%E7%9A%84%E5%8C%BA%E5%88%AB/image-20230315175016167.png)

客户端代码

```js
      function ajax(options) {
        return new Promise((resolve, reject) => {
          const method = options.method || "GET";
          let url = options.url;
          url += `?${stringify(options.params)}`;
          const xhr = new XMLHttpRequest();
          xhr.open(method, url, true);
          xhr.send(options.data || null);
          xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
              resolve(xhr.response);
            }
          };
        });
      }

      function stringify(obj) {
        if (typeof obj !== "object" || obj === null) return "";
        return Object.entries(obj)
          .reduce((acc, [key, value]) => {
            acc.push(`${key}=${value}`);
            return acc;
          }, [])
          .join("&");
      }

     // 开启轮询请求
      setInterval(() => {
        ajax({
          url: "/lunxun",
        }).then((res) => {
          console.log(res);
        });
      }, 2000);
```

服务端代码

```js
app.get("/lunxun", (req, res, next) => {
  res.json({
    code: 200,
    data: lunxunNum++,
  });
  next();
});
```

结果如下：

![image-20230315173145123](https://blog-1302889287.cos.ap-nanjing.myqcloud.com/websocket%E5%92%8CeventSource%E5%92%8Cajax%E8%BD%AE%E8%AF%A2%E4%B9%8B%E9%97%B4%E7%9A%84%E5%8C%BA%E5%88%AB/image-20230315173145123.png)



> 此方案在建立连接通信上会耗费大量的时间和流量

## 3、测试websocket

客户端代码

```js
      // 创建连接
      var socket = new WebSocket("ws://localhost:3000/socket/test");
      socket.onopen = function (e) {
        console.log("您已连接成功");
      };
      // 监听服务端返回的数据
      socket.onmessage = function (e) {
        console.log(e);
      };
      // 定时发送
      setInterval(() => {
        socket.send("心跳数据：" + Date.now());
      }, 2000);
```

服务端代码

```js
// socket.js
var express = require("express");
var expressWs = require("express-ws");

var router = express.Router();
expressWs(router); //将 express 实例上绑定 websocket 的一些方法

router.ws("/test", function (ws, req) {
  ws.send("你连接成功了");
  ws.on("message", function (msg) {
    console.log(`接收到数据：${msg}`);
    ws.send("pong" + msg);
  });
});

module.exports = router;
```

```js
// app.js
var expressWs = require("express-ws");
var socketRouter = require("./socket");
app.use("/socket", socketRouter);
...
```

结果如下：

![image-20230315173502662](https://blog-1302889287.cos.ap-nanjing.myqcloud.com/websocket%E5%92%8CeventSource%E5%92%8Cajax%E8%BD%AE%E8%AF%A2%E4%B9%8B%E9%97%B4%E7%9A%84%E5%8C%BA%E5%88%AB/image-20230315173502662.png)

> 此方案：
>
> 优点： 1、不受跨域限制（基于tcp协议） 2、支持前后端双向通信   3、支持任何类型的数据
>
> 缺点： 占用服务器资源



## 4、测试EventSource

**`EventSource`** 是服务器推送的一个网络事件接口。**一个 EventSource 实例会对 HTTP 服务开启一个持久化的连接**，以`text/event-stream` 格式发送事件，会一直保持开启直到被要求关闭。

一旦连接开启，来自服务端传入的消息会以事件的形式分发至你代码中。如果接收消息中有一个事件字段，触发的事件与事件字段的值相同。如果没有事件字段存在，则将触发通用事件。

与 [WebSockets](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSockets_API),不同的是**，服务端推送是单向的。数据信息被单向从服务端到客户端分发**。当不需要以消息形式将数据从客户端发送到服务器时，这使它们成为绝佳的选择。例如，对于处理社交媒体状态更新，新闻提要或将数据传递到客户端存储机制（如 IndexedDB 或 Web 存储）之类的，EventSource 无疑是一个有效方案。



**兼容性稍差， 但是我们可以使用[event-source-polyfill](https://github.com/Yaffle/EventSource) 来模拟EventSource**

![image-20230315174609233](https://blog-1302889287.cos.ap-nanjing.myqcloud.com/websocket%E5%92%8CeventSource%E5%92%8Cajax%E8%BD%AE%E8%AF%A2%E4%B9%8B%E9%97%B4%E7%9A%84%E5%8C%BA%E5%88%AB/image-20230315174609233.png)



客户端代码

```js
      const es = new EventSource("/eventSource");
      es.onmessage = function (e) {
        console.log(e);
      };
```



服务端代码

```js
app.get("/eventSource", (req, res, next) => {
  // 根据 EventSource 规范设置报头
  res.writeHead(200, {
    "Content-Type": "text/event-stream", // 规定把报头设置为 text/event-stream
    "Cache-Control": "no-cache", // 设置不对页面进行缓存
  });
  // 用write返回事件流，事件流仅仅是一个简单的文本数据流，每条消息以一个空行(\n)做为分割。
  res.write(":注释" + "\n\n"); // 注释行
  res.write("data:" + "消息内容1" + "\n\n"); // 未命名事件

  res.write(
    // 命名事件
    "event: myEve" +
      "\n" +
      "data:" +
      "消息内容2" +
      "\n" +
      "retry:" +
      "2000" +
      "\n" +
      "id:" +
      "12345" +
      "\n\n"
  );

  setInterval(() => {
    // 定时事件
    res.write("data:" + "定时消息" + Date.now() + "\n\n");
  }, 2000);
});
```

结果如下：

![image-20230315173825382](https://blog-1302889287.cos.ap-nanjing.myqcloud.com/websocket%E5%92%8CeventSource%E5%92%8Cajax%E8%BD%AE%E8%AF%A2%E4%B9%8B%E9%97%B4%E7%9A%84%E5%8C%BA%E5%88%AB/image-20230315173825382.png)

>  此方案：
>
> 优点：1、占用服务资源较少 2、支付服务端单向推送给客户端 3、简单
>
> 缺点： 1、仅支持单向通信、2、只能发送文本内容 3、兼容性稍差值、4、会有跨域的限制



## 5、WebSocket & EventSource 的区别

1. WebSocket基于TCP协议，EventSource基于http协议。
2. EventSource是单向通信，而websocket是双向通信。
3. EventSource只能发送文本，而websocket支持发送二进制数据。
4. 在实现上EventSource比websocket更简单。
5. EventSource有自动重连接（不借助第三方）以及发送随机事件的能力。
6. websocket的资源占用过大EventSource更轻量。
7. websocket可以跨域，EventSource基于http跨域需要服务端设置请求头。

