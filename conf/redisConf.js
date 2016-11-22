/**
 * redis 配置
 */

const redisConf = {
  dev: { // 本地开发环境
    host: '10.33.106.178',
    port: 6379
  },
  rd: { // rd环境

  },
  stage: { // 测试环境

  },
  prod: { // 线上

  }
}

export const conf = (
  (env) => {
    return redisConf[env || 'dev']
  }
)(process.env.NODE_ENV)
