import { Context, Logger, Schema, Session } from 'koishi'
import { } from "koishi-plugin-adapter-iirose"

export const name = 'auto-stock'

export interface Config { 

}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  const logger = new Logger('stock')
  var last_money = 0
  
  ctx.emit('iirose/stockGet', (data) => {
    last_money = data.personalMoney
  })
  /**
   * 2分钟执行一次，和花园股票刷新同步
   */
  ctx.on("iirose/before-getUserList", async (session) => {
    setTimeout(() => {
      ctx.emit('iirose/stockGet', (data) => {
        if (data.unitPrice == 1.00000) {
          result = 0
          var msg = `本次崩盘收益 ${data.personalMoney-last_money} ，余额 ${data.personalMoney} 钞`
          last_money = data.personalMoney // 记录上一次崩盘的钱
          logger.info(msg)
          session.send({
            public:{
              message:msg
            }
          })
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
          logger.info(`价 ${data.unitPrice}，股 ${data.totalStock}，卖 ${-result}，余 ${data.personalMoney-data.unitPrice*result}`)
        }
      })
    }, 100000)
  })

  /**
   * 当有人好奇你的炒股情况
   */
  ctx.on('message', (session) => {
    if (session.content == `查股票`) {
      ctx.emit('iirose/stockGet', (data) => {
        session.send(`当前股价 ${data.unitPrice}，总股 ${data.totalStock}，持股 ${data.personalStock}，余额 ${data.personalMoney}`)
      })
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
  if (price < 0.5) {
    // 决定持有0~400股
    if (price < 0.23) result += 60
    if (price < 0.3) result += 60
    if (price < 0.37) result += 60
    result += 12
    result = Math.floor(result * multi)
    if (result < personalStock && result > 0) result = 0
    else result = result - personalStock
  } else {
    result = -personalStock * 0.125
    if (price > 0.7) result -= personalStock * 0.0625
    if (price > 0.8) result -= personalStock * 0.0625
    if (price > 0.9) result -= personalStock * 0.0625
    if (price > 1.0) result -= personalStock * 0.0625
    if (price > 1.2) result -= personalStock * 0.125
    if (price > 1.5) result -= personalStock * 0.125
    if (price > 1.9) result -= personalStock * 0.125
    if (price > 3.5) return -personalStock
    if (-result > personalStock) result = -personalStock
  }

  return Math.floor(result)
}
