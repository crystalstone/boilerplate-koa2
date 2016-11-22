/**
 * @file: 首页 router
 */

import Router from 'koa-router'
import fs from 'fs'
import path from 'path'

const router = new Router()

/**
 * 挂载所有的router
 */
function loop (dir) {
  if (!dir) {
    return
  }
  const temp = fs.readdirSync(dir)
  temp.map(file => {
    let tempPath = dir + '/' + file
    let stat = fs.statSync(tempPath)

    // 如果是文件夹 loop
    if (stat.isDirectory()) {
      loop(tempPath)
    }
    else if (file.substr(file.length - 3, 3) === '.js') {
      // 如果是文件，且名字是router.js
      let confRouter = require(tempPath).default
      if (confRouter.method && confRouter.path && confRouter.handler) {
        router[confRouter.method](confRouter.path, confRouter.handler)
      }
    }
  })
}

// 循环文件夹
loop(path.join(__dirname, 'routers'))

// 该页面的根路径
const rootPath = '/home'

export { rootPath, router }
