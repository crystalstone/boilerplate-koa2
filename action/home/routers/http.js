/**
 * 渲染home首页
 */
import { request } from './../../../util/request'

export default {
  method: 'get', // 方法
  path: '/', // 请求路径
  /**
   * 处理函数
   * @type {[type]}
   */
  handler: async (ctx, next) => {

    // 串行的示例
    let dataGet = await request.send(
      'ehr:bpm/conversion/search.json',
      {
        pageNo: 1,
        pageSize: 20,
        sort: 'DESC',
        columnName: 'createTime',
        category: 'pending'
      },
      {
        method: 'get',
        ctx: ctx
      }
    )

    // 串行的示例
    let dataPost = await request.send(
      'ehr:blacklist/detail.json',
      {
        pageNo: 1,
        pageSize: 20,
        sort: 'DESC',
        columnName: 'createTime',
        category: 'pending'
      },
      {
        method: 'post',
        ctx: ctx
      }
    )


    // 并行的示例
    let dataParal = await request.send([
      {
        path: 'ehr:bpm/conversion/search.json',
        param: {},
        option: {
          method: 'get',
          ctx: ctx
        }
      },
      {
        path: 'ehr:blacklist/detail.json',
        param: {},
        option: {
          method: 'get',
          ctx: ctx
        }
      }
    ])

    ctx.state.user = {
      name: 'test'
    }
    
    await ctx.render('pages/home/index', {title: 33})
  }
}
