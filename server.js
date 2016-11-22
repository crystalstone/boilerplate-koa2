
require('babel-core/register')
require('babel-polyfill')
const cluster = require('cluster')
const app = require('./app')
const conf = require('./conf/pluginConf')

const port = process.env.PORT || '3000'
var sigkill = false
var workerList = []

function removeWorkerFromListByPID (pid) {
  workerList.forEach(function (worker, index) {
    if (worker.pid === pid) {
      workerList.splice(index, 1)
    }
  })
}

process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', err)
})

if (conf.conf.cluster) { // 如果开启多线程模式
  if (cluster.isMaster) { // 如果是主线程
    require('os').cpus().forEach(function(){
      let worker = cluster.fork()
      workerList.push(worker)
    })

    // Ctrl-C for instance, POSIX signals
    process.on('SIGINT',function(){
      sigkill = true
      process.exit()
    })

    // 进程死后，重启
    cluster.on('exit', (worker, code, signal) => {
      if (sigkill) {
        logger.info('SIGKINT received - not respawning workers')
        return
      }

      logger.info('Worker ' + worker.pid + ' died and it will be re-spawned')


      let newWorker = cluster.fork()
      removeWorkerFromListByPID(worker.pid)
      workerList.push(newWorker)
    })
  } else {
    // listen
    app.listen(port)
  }
} else { // 不启动多线程
  app.listen(port)
}
