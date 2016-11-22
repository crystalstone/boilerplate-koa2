/**
 * request 配置
 */

const fetchConf = {
  dev: { // 本地开发环境
    retry: {
      retries: 1,
      minTimeout: 5 * 1000, // The number of milliseconds before starting the first retry
      maxTimeout: 5 * 1000 // The maximum number of milliseconds between two retries
    },
    timeout: 4 * 1000
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
    return fetchConf[env || 'dev']
  }
)(process.env.NODE_ENV)
