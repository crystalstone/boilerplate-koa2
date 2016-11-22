/**
 * @file: 链接dubbo
 * @author: wangshiying@lianjia.com
 */

import ZD from 'zoodubbo'
// import {conf} from '../conf/redisConf'

const zd = new ZD({
  // conn: '172.30.11.77:2181'
  conn: '172.16.3.147:14200'
})

zd.connect()

export const dubbo = zd
