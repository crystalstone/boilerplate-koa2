/**
 * 渲染home dubbo node 直接连接dubbo
 */
import { request } from './../../../util/request'
import { dubbo } from './../../../util/dubbo'

export default {
  method: 'get', // 方法
  path: '/dubbo', // 请求路径
  /**
   * 处理函数
   * @type {[type]}
   */
  handler: async (ctx, next) => {

    console.log(2)
    let invoker = dubbo.getInvoker('com.lianjia.uc.api.auth.UcAuthFacade')
    let arg1 = {$class: 'long', $: 1000000010011273}
    let arg2 = {$class: 'long', $: 1}

    invoker.excute('getPermissionByUcidAndAppId', [arg1, arg2], function (err, data) {
      if (err) {
          console.log(err)
          return
      }
      console.log('数据数据')
      console.log(data)
    })

    ctx.state.user = {
      name: 'test'
    }

    await ctx.render('pages/home/index', {title: 33})
  }
}
