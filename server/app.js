const express = require("express");

const exStatic = require("express-static");
var expressWs = require("express-ws");
var socketRouter = require("./socket");
const app = express();
expressWs(app);
const port = 3000;
let lunxunNum = 0;
app.use("/socket", socketRouter);
app.get("/", (req, res, next) => {
  res.send("服务已启动！");
  next();
});
app.get("/lunxun", (req, res, next) => {
  res.json({
    code: 200,
    data: lunxunNum++,
  });
  next();
});

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

app.use(exStatic("./views"));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
