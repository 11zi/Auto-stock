# 自动炒股插件

## 部署

1.  [[koishi]花园机器人搭建教程](https://forum.reifuu.icu/d/9-koishihua-yuan-ji-qi-ren-da-jian-jiao-cheng)
2.  放置于`../external`目录下
3.  `npm run`
4.  在`插件配置->添加插件`添加本插件
5.  以开发者模式重新启动机器人
    `npm run dev`

## 一些想更新的内容

- 在插件配置里改变算法参数（什么时候买，买多少）
- 另一种算法（买入后按照当前价格找机会卖出）
- 另一种算法
  以固定资金入场，跌20%买20%，涨20%卖20%