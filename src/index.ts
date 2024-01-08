import { Context, Logger, Schema, Session } from 'koishi'
import { } from "koishi-plugin-adapter-iirose"

export const name = 'auto-stock'

export interface Config { 

}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  const logger = new Logger('stock')
  /**
   * 2分钟执行一次，和花园股票刷新同步
   */
  var last_price = -1
  ctx.on("iirose/before-getUserList", async (session) => {
    setTimeout(() => {
      ctx.emit('iirose/stockGet', (data) => {
        if (data.unitPrice == 1) {
          result = 0
          last_price = 1
          logger.info(`股市已崩盘，当前金钱 ${data.personalMoney}`)
        }
        else {
          var result = stock_calc1(data.unitPrice, data.totalStock, data.personalStock)
        }

        if (result == 0) {
          return
        }
        if (result > 0) {
          ctx.emit('iirose/stockBuy', result)
          logger.info(`价 ${data.unitPrice}，股 ${data.totalStock}，买 ${result}，余 ${data.personalMoney-data.unitPrice*result}`)
        } else {
          ctx.emit('iirose/stockSell', -result)
          logger.info(`价 ${data.unitPrice}，股 ${data.totalStock}，卖 ${result}，余 ${data.personalMoney+data.unitPrice*result}`)
        }
        last_price = data.unitPrice // 记录上一次价格
      })
    }, 10000)
  })

  /**
   * 当有人好奇你的炒股情况
   */
  ctx.on('message', (session) => {
    if (session.content == 'yaoz查询') {
      ctx.emit('iirose/stockGet', (data) => {
        session.send(`当前股价 ${data.unitPrice}，总股 ${data.totalStock}，yaoz持股 ${data.personalStock}，余额 ${data.personalMoney}`)
      })
    }
  })
  ctx.on('message', (session) => {
    if (session.content.search(` [*yaoz*]   [*yaoz*]  `) != -1) {
      session.send(
        ` [*${session.username}*]   当前关键词有：
yaoz查询
yaoz测试`
      )
    }
  })

}

/**
 * 炒股策略1号  无情的梭哈机器，坐等发财
 * @param price 股价
 * @param stock 总股
 * @param personalStock 持股
 * @returns 交易额
 */
function stock_calc1(price, stock, personalStock) {
  var multi = 4000 / stock
  var result = 0

  if (price == 1) return result
  if (price < 0.1) return result
  if (price < 0.4) {
    // 决定持有0~400股
    if (price < 0.23) result += 60
    if (price < 0.3) result += 60
    if (price < 0.37) result += 60
    result += 12
    result = Math.floor(result * multi)
    if (result < personalStock && result > 0) result = 0
    else result = result - personalStock
  } else {
    result = -personalStock * 0.25
    if (price > 0.6) result -= personalStock * 0.0625
    if (price > 0.7) result -= personalStock * 0.0625
    if (price > 0.8) result -= personalStock * 0.0625
    if (price > 0.9) result -= personalStock * 0.125
    if (price > 1.0) result -= personalStock * 0.125
    if (price > 2.2) result -= personalStock * 0.0625
    if (price > 2.8) result -= personalStock * 0.0625
    if (price > 3.5) return -personalStock
    if (-result > personalStock) result = -personalStock
  }

  return Math.floor(result)
}
