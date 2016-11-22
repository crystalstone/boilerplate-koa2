/**
 * @file: 封装请求
 * @author: wangshiying@lianjia.com
 */
import Uid from 'uid-safe'
import Fetch from 'fetch.io'
import {conf} from '../conf/hostConf'
import * as fetchConf from '../conf/fetchConf'
import retry from 'retry'

const req = new Fetch({
  timeout: fetchConf.conf.timeout,
  // credentials: 'include',
  headers: {
    // 'content-type': 'application/json;charset=UTF-8'
  }
})

export const request = {

  /**
   * 单个接口
   * @param  {string} url host:path eg: ehr:org/add.json
   * @param  {object} param 参数 {}
   * @param  {object} option {method: get, parse: text} 不传默认是get
   * @return {object} Promise Promise对象
   */
  single: (url, param, option, uid) => {
    let start = (new Date()).getTime()
    let path = request.resolvePath(url)
    let params = param || {}
    let options = option || {}
    let method = options && options.method || 'get' // 默认get
    var operation = retry.operation(fetchConf.conf.retry)

    return new Promise((resolve, reject) => {
      operation.attempt(
        currentAttempt => {
          request[method](path, params, options)
            .then(
              res => {
                let end = (new Date()).getTime()

                if (!options.parse == 'text') { // 默认都是json的, 除非特殊指定 parse: text
                  res = JSON.parse(res)
                }

                logger.info('fetchInfo:' + JSON.stringify({
                  pageUrl: option.ctx && option.ctx.url, // 页面路径
                  uid: uid,
                  api: path, // 接口api
                  currentAttempt: currentAttempt, // 第几次重连
                  method: method, // 第几次重连
                  request: params, // 第几次重连
                  response: res,
                  cost: end - start,
                  err: ''
                }))

                resolve({
                  err: null,
                  res: res
                })
              }
            )
            .catch(
              err => {
                let end = (new Date()).getTime()

                logger.error('fetchInfo:' + JSON.stringify({
                  pageUrl: option.ctx && option.ctx.url, // 页面路径
                  uid: uid,
                  isParallel: 0, // 是不是并行
                  api: path, // 接口api
                  currentAttempt: currentAttempt, // 第几次重连
                  method: method, // 第几次重连
                  request: params, // 第几次重连
                  response: '',
                  cost: end - start,
                  err: err
                }))

                if (operation.retry(err)) {
                  return
                }

                resolve({
                  err: err,
                  res: null
                })
              }
            )
        }
      )
    })
  },

  /**
   * 并行接口处理
   * @param  {array} requestArr 并行处理的请求
   * @param  {string} uid uid
   * @return {object} Promise Promise 对象
   */
  parallel: (requestArr, uid) => {
    let queue = []
    let apis = [] // for logger
    let methods = [] // for logger
    let params = [] // for logger
    let pageUrl = ''

    let start = (new Date()).getTime()

    requestArr.forEach(item => {
      apis.push(item.path)
      methods.push(item.option && item.option.method || 'get')
      params.push(item.param || {})
      pageUrl = item.option && item.option.ctx && item.option.ctx.url
      item.path && queue.push(request.single(item.path, item.param || {}, item.option || {}, uid))
    })

    return new Promise((resolve, reject) => {
       Promise.all(queue)
        .then(
           res => {
             let end = (new Date()).getTime()

             logger.info('fetchInfo:' + JSON.stringify({
               pageUrl: pageUrl, // 页面路径
               uid: uid,
               isParallel: 1,
               api: apis, // 接口api
               method: methods,
               request: params,
               response: res,
               cost: end - start,
               err: err
             }))

             resolve({
               err: null,
               res: res
             })
           }
         )
         .catch(
           err => {
             let end = (new Date()).getTime()
             logger.error('fetchInfo:' + JSON.stringify({
               pageUrl: pageUrl, // 页面路径
               isParallel: 1,
               api: apis, // 接口api
               method: methods,
               request: params,
               response: '',
               cost: end - start,
               err: err
             }))

             resolve({
               err: err,
               res: null
             })
           }
         )
    })
  },

  /**
   * get
   * @param  {string} path 路径
   * @param  {object} param  参数
   * @param  {object} option 其他选择
   * @return {object} Promise Promise 对象
   */
  get: (path, param, option) => {
    return req.get(path).set({cookie: option.ctx && option.ctx.cookie}).query(param).text()
  },

  /**
   * post json
   * @param  {string} path 路径
   * @param  {object} param  参数
   * @param  {object} option 其他选择
   * @return {object} Promise Promise 对象
   */
  post: (path, param, option) => {
    return req.post(path).set({cookie: option.ctx && option.ctx.cookie}).send(param).text()
  },

  /**
   * post key form-data
   * @param  {string} path 路径
   * @param  {object} param  参数
   * @param  {object} option 其他选择
   * @return {object} Promise Promise 对象
   */
  postKey: (path, param, option) => {
    return req.post(path).set({cookie: option.ctx && option.ctx.cookie}).type('form').send(param).text()
  },

  /**
   * 解析 host 和 path
   * @param {string} path 请求路径 eg: ehr:org/add.json
   */
  resolvePath: (path) => {
    let arr = path.split(':')
    if (arr && arr.length === 2 && conf[arr[0]]) {
      return conf[arr[0]] + arr[1]
    } else {
      return path
    }
  },

  /**
   * 接口配置
   * @param {string || array} first 是string的时候，表示path，单个接口；array的时候是并行接口
   * @param {array} others [param, option] 当存在的时候，表示单个接口
   * @return {Promise} [description]
   */
  send: (first, ...others) => {
    try {
      let uid = Uid.sync(24)
      if (first && typeof first === 'string') {
        // 处理单个接口
        return request.single(first, others && others[0] || {}, others && others[1] || {}, uid)
      } else if (first && Object.prototype.toString.call(first) === '[object Array]' && first.length) {
        // 并行接口
        return request.parallel(first, uid)
      }
    } catch (err) {
      logger.error('fetchInfo:' + err)
      return new Promise((resolve, reject) => {
        resolve({
          err: err,
          res: null
        })
      })
    }
  }
}
