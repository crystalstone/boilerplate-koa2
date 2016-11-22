/**
 * @file: 登陆中间件
 */

import {request} from './../../util/request'
import {conf} from './../../conf/hostConf'
import uid from 'uid-safe'
import {redis} from './../../util/redis'

// TODO: servicePath 不同项目不一样啊
const servicePath = 'http://dev.personnel.lianjia.com/shiro-cas'
const loginHost = conf['login']

export const login = (options) => {
  options = options || {}
  var initPath = ''

  const LoginProcess = {

    /**
     * 设置session
     *
     * @param {object} ctx ctx
     * @param {object} userInfo userInfo
     */
    async setSession (ctx, userInfo) {
      let name = options.sessionName || 'sid'
      let sid = uid.sync(24, ctx)
      // 如果不存在sid，则cookie种sid
      ctx.cookies.set(
        name,
        sid,
        options.cookie || {}
      )
      ctx.sessionId = sid

      // redis 存储sid
      let session = await redis.set("session:" + sid, userInfo)
      if (session.isOk) {
        let expiTime = options.expires || 6 * 60 * 60
        await redis.expireat('session:' + sid, parseInt((+new Date)/1000) + expiTime)
      }
    },

    /**
     * 判断 是不是登陆
     *
     * @param {object} ctx ctx
     */
    isLogin (ctx) {
      // cookie 中拿到 sid
      let sid = ctx.cookies.get(options.sessionName || 'sid')

      return new Promise(async (resolve, reject) => {
        if (sid) {
          // 从redis 中获得session 并判断是否要失效了
          let tl = await redis.ttl('session:' + sid)
          if (tl.value > 0) { // 没有失效
            let info = await redis.get('session:' + sid)

            if (info && info.value) {
              let tmp = JSON.parse(info.value)
              tmp && tmp.isLogin && resolve()
              return
            }
          }
        }
        reject()
      })
    },

    /**
     * 获得ticket
     *
     * @param {stirng} url
     * @return {string} ticket
     */
    getTickets (url) {
      if (url) {
        let ticket = url.split('ticket=')
        if (ticket && ticket[1]) {
          ticket = ticket[1]
        }
        return ticket
      }
    },

    /**
     * 处理登陆
     * @param  {object} ctx
     */
    processLogin (ctx) {
      let ticket = LoginProcess.getTickets(ctx.url)
      let sid = ctx.sessionId

      return new Promise(async (resolve, reject) => {
        let userInfo = await request.send(
          'login:cas/serviceValidate',
          {
            ticket: ticket,
            service: servicePath
          },
          {
            method: 'get',
            parse: 'text',
            ctx: ctx
          }
        )

        if (userInfo && !userInfo.err && userInfo.res && userInfo.res.match(/<cas:uid>([0-9]{1,})<\/cas:uid>/)) {
          let uid = userInfo.res.match(/<cas:uid>([0-9]{1,})<\/cas:uid>/)[1]
          let ucid = userInfo.res.match(/<cas:ucid>([0-9]{1,})<\/cas:ucid>/)[1]
          let ucname = userInfo.res.match(/<cas:ucname>([\s\S]{1,})<\/cas:ucname>/)[1]

          await LoginProcess.setSession(ctx, JSON.stringify({
            isLogin: true,
            uid: uid,
            ucid: ucid,
            ucname: ucname
          }))
          ctx.state = {
            userInfo: {
              uid: uid,
              ucid: ucid,
              ucname: ucname
            }
          }
          resolve()
        } else {
          reject()
        }
      })
    }
  }

  return async function (ctx, next) {
    if (/^\/shiro-cas\?ticket=([\S\s]+)$/.test(ctx.url)) {
      return LoginProcess.processLogin(ctx).then(
        () => {
          // 记录用户信息成功
          ctx.redirect(`${initPath}`)
        },
        () => {
          //todo：没有拿用户信息成功 ？？？ todo 跳error页？
          next()
        }
      )
    } else {
      // 没有登录 重定向到passport
      return LoginProcess.isLogin(ctx).then(
        async () => {
          // 已登陆
          await next()
        },
        () => {
          // 未登陆
          initPath = ctx.url
          ctx.redirect(`${loginHost}cas/login?service=${servicePath}`)
        }
      )
    }
  }

}
