#!/usr/bin/env node

var child_process = require('child_process')
var fs = require('fs')
var path = require('path')
var currentDir = __dirname
var options = process.argv
var slice = Array.prototype.slice
var argvs = slice.call(options, 2)
var pidsFile = require('path').join(currentDir, 'pids')
var cwd = path.join(currentDir, '..')
var env = argvs[1] || 'dev'
var opt = argvs[0] || 'start'

/**
 * 将主进程id 写入 pids 文件，需要sudo 权限
 * @param  {string} pid 主进程id
 */
var writePidToFile = function (pid) {
    var writeStream = fs.createWriteStream(pidsFile)
    writeStream.write(new Buffer(pid + ''))
    writeStream.end()
    return writeStream
}

/**
 * 关闭服务
 * @param  {Function} cb 回调函数
 */
var stop = function (cb) {
    fs.readFile(pidsFile, (err, data) => {
        if (err) {
            return cb && cb()
        }
        child_process.spawn('kill', ['-9', data.toString()]).on('close', (e) => {
            cb && cb()
        })
    })
}

/**
 * 启动服务
 * @param  {string} env dev、rd、stage、prod
 */
var start = function (env) {
    var mainProcess = child_process.fork(path.join(currentDir, './server.js'), [],
      {env: {NODE_ENV: env}, cwd: cwd})
    // 存下进程id，因为上线后，启动多进程，不方便重启以及关掉进程
    writePidToFile(mainProcess.pid).on('finish', () => {
        process.exit()
    })
}

switch(opt) {
  case 'restart':
    stop(() => {
      start(env)
    })
    break
  case 'stop':
    stop()
    break
  case 'start':
    start(env)
    break
}
