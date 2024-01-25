import { Context, Logger, Schema, Session } from 'koishi'
import { } from "koishi-plugin-adapter-iirose"
import { readFile } from 'fs'

// const nodePickle = require('node-pickle')

export const name = 'auto-stock'

export interface Config { 

}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  const logger = new Logger('stock')
  var last_money = 0
  var isDead = false

  /**
   * 2分钟执行一次，和花园股票刷新同步
   */
  ctx.on("iirose/before-getUserList", async (session) => {
    // setTimeout(() => {
      ctx.emit('iirose/stockGet', (data) => {
        if (data.unitPrice == 1.00000) {
          var msg = `本次崩盘收益 ${data.personalMoney-last_money} ，余额 ${data.personalMoney} 钞`
          last_money = data.personalMoney // 记录上一次崩盘的钱
          isDead=false
          logger.info(msg)
          // session.send({
          //   public:{
          //     message:msg
          //   }
          // })
        }
        
        if(data.unitPrice<0.10000) isDead=true
        // var result = stock_calc1(data.unitPrice, data.totalStock, data.personalStock)
        var result = stock_calc3(data.unitPrice, data.personalStock)
        // logger.info(`价 ${data.unitPrice}，${result}股，花 ${data.unitPrice*result}，持 ${data.personalStock+result}`)

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
    // }, 1)
  })

  /**
   * 当有人好奇你的炒股情况
   */
  // ctx.on('message', (session) => {
  //   if (session.content == `查股票`) {
  //     ctx.emit('iirose/stockGet', (data) => {
  //       var msg = `当前股价 ${data.unitPrice}，总股 ${data.totalStock}，持股 ${data.personalStock}，余额 ${data.personalMoney}`
  //       session.send(msg)
  //     })
  //   }
  // })

}

/**
 * 炒股策略1号  无情的梭哈机器，坐等发财
 * @param price 股价
 * @param stock 总股
 * @param personalStock 持股
 * @returns 交易额
 */
function stock_calc1(price, stock, personalStock) {
  var multi = 3500 / stock
  var result = 0

  if (price == 1.00000) return result
  if (price < 0.1) return result
  if (price < 0.7) {
    // 决定持有0~400股
    if (price < 0.23) result += 70
    if (price < 0.3) result += 80
    if (price < 0.37) result += 70
    result += 12
    result = Math.floor(result * multi)
    if (result < personalStock && result > 0) result = 0
    else result = result - personalStock
  } else {
    result = -personalStock * 0.5
    // if (price > 0.7) result -= personalStock * 0.0625
    // if (price > 0.8) result -= personalStock * 0.0625
    // if (price > 0.9) result -= personalStock * 0.0625
    if (price > 1.0) result -= personalStock * 0.5
    if (price > 1.2) result -= personalStock * 0.25
    if (price > 1.5) result -= personalStock * 0.125
    if (price > 1.9) result -= personalStock * 0.125
    if (price > 3.5) return -personalStock
    if (-result > personalStock) result = -personalStock
  }

  return Math.floor(result)
}

/**
 * 炒股策略2号  总是留30块在里面
 * @param price 股价
 * @param personalStock 持股
 * @returns 交易额
 */
function stock_calc2(price, personalStock) {
  var result = 9
  var MONEY_KEEP = 10.00000

  if (price == 1.00000) return result
  if (price < 0.10000) return 0

  result = Math.floor(MONEY_KEEP / price) - personalStock - 1
  if((result+personalStock)<0) result=-personalStock
  return result
}

/**
 * 炒股策略3号  铁血的梭哈机器
 * @param price 股价
 * @param personalStock 持股
 * @returns 交易额
 */
function stock_calc3(price, personalStock) {
  var result = 0
  var multi = 2.00000

  if (price == 1.00000) return result
  if (price < 0.10000) return 0

  // 买个几十股
  if(price<0.3) {
    result = Math.floor(multi / (price * price))
    if(result > personalStock) result -= personalStock
    else result = 0
  }
  if(price>1.7) result = Math.floor(personalStock / 2) - personalStock
  if(price>20) result = -personalStock
  return result
}