/**
 * 插件是否使用的 配置
 */

const pluginConf = {
  dev: { // 本地开发环境
    login: false,
    cluster: false
  },
  rd: { // rd环境
    login: false
  },
  stage: { // 测试环境
    login: false
  },
  prod: { // 线上
    login: false
  }
}

export const conf = (
  (env) => {
    return pluginConf[env || 'dev']
  }
)(process.env.NODE_ENV)
