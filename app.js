/**
 * @file: server 主入口
 */

import Koa from 'koa'
import co from 'co'
import render from 'koa-ejs'
import convert from 'koa-convert'
import bodyparser from 'koa-bodyparser'
import json from 'koa-json'
import Router from 'koa-router'
import fs from 'fs'
import path from 'path'
import log4js from 'log4js'
import {conf} from './conf/pluginConf'

// 设置日志
log4js.configure(path.join(__dirname, './log4js.json'), {})
global.logger = log4js.getLogger('projectName')
logger.setLevel('INFO')

const app = new Koa()

app.use(convert(bodyparser(
  {
    onerror: function (err, ctx) {
      logger.error('body parse error:',err)
      ctx.throw('body parse error', 422);
    }
  }
)))
app.use(convert(json()))

// 登陆处理
if (conf.login) {
  let login = require('./plugin/business/login')
  app.use(login.login(
    {
      sessionName: 'ehrsid',
      expires: 6 * 60 * 60, // session 超时时间 单位秒
      cookie: { // signed:sign cookie 值;expires;path;domain;secure;httpOnly
      }
    }
  ))
}


// 处理模板
render(app, {
  root: path.join(__dirname, 'view'),
  cache: false,
  layout: '' // 必须填空，不然默认回事layout文件夹
})

app.context.render = co.wrap(app.context.render)


// 路由处理
const router = new Router()

/**
 * 挂载所有的router
 */
function loop (dir) {
  if (!dir) {
    return
  }
  const actions = fs.readdirSync(dir)
  actions.map(file => {
    let tempPath = dir + '/' + file
    let stat = fs.statSync(tempPath)
    // 如果是文件夹 loop
    if (stat.isDirectory()) {
      loop(tempPath)
    }
    else if (file === 'router.js') {
      // 如果是文件，且名字是router.js
      let subRouter = require(tempPath)
      subRouter && router.use(
        subRouter.rootPath,
        subRouter.router.routes(),
        subRouter.router.allowedMethods()
      )
    }
  })
}

// 循环action 文件夹
loop(path.join(__dirname, 'action'))
app.use(router.routes(), router.allowedMethods())

// 错误监控
app.on('error',function(err,ctx){
 logger.error('server error', err, ctx)
})

module.exports = app
// export const app
