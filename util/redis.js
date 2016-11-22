/**
 * @file: redis
 * @author: wangshiying@lianjia.com
 */

import Redis from 'redis'
import {conf} from '../conf/redisConf'

// 链接redis
// 注意，如果是远程的redis，
// 把redis.conf 中的 protected-mode on；bind 127.0.0.1 注释掉
const client = Redis.createClient({
  host:conf.host,
  port: conf.port,
  db: conf.db || 0, // 不分库 默认 0库，共16个库
  prefix: 'projectName:' // name space
})

client.on('ready',function(err) {
  if (err) {
    logger.error('redisInfo: ready-error-', err)
  } else {
    logger.info('redisInfo: ready')
  }
})

client.on('err',function(err) {
  logger.error('redisInfo: client-error-', err)
})


export const redis = {
  client: client,

  /**
   * 设置数据
   * @param {string} key key
   * @param {string} value JSON.stringify({key: v}) || str
   * @return {object} Promise Promise 对象
   */
  set: (key, value) => {
    return new Promise((resolve, reject) => {
      client.set(key, value, function (err, isOk) {
        if (err) {
          logger.error('redisInfo: set-error-', err)
        }
        resolve({
          err: err,
          isOk: isOk
        })
      })
    })
  },

  /**
   * 获得数据
   * @param {string} key key
   * @param {string} value JSON.stringify({key: v}) || str
   * @return {object} Promise Promise 对象
   */
  get: (key) => {
    return new Promise((resolve, reject) => {
      client.get(key, function (err, value) {
        if (err) {
          logger.error('redisInfo: get-error-', err)
        }

        resolve({
          err: err,
          value: value
        })
      })
    })
  },

  /**
   * 设置数据缓存时间
   * @param {string} key key
   * @param {number} time 超时时间  精确到秒
   * @return {object} Promise Promise 对象
   */
  expireat: (key, time) => {
    return new Promise((resolve, reject) => {
      client.expireat(key, time, function (err, isOk) {
        if (err) {
          logger.error('redisInfo: expireat-error-', err)
        }

        resolve({
          err: err,
          isOk: isOk
        })
      })
    })
  },

  /**
   * 获得缓存剩余时间
   * @param {string} key key
   * @param {string} value JSON.stringify({key: v}) || str
   * @return {object} Promise Promise 对象
   */
  ttl: (key) => {
    return new Promise((resolve, reject) => {
      client.ttl(key, function (err, value) {
        if (err) {
          logger.error('redisInfo: ttl-error-', err)
        }

        resolve({
          err: err,
          value: value
        })
      })
    })
  }
}
