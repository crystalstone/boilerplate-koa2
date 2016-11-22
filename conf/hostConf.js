/**
 * 后端host 配置
 */

const hosts = {
  dev: { // 本地开发环境
    ehr: 'http://127.0.0.1:8002/',
    login: 'http://172.30.11.77:8088/'
  },
  rd: { // rd环境
    //ehr: 'http://dev.personnel.lianjia.com/'
    ehr: 'http://172.30.22.8:8082/',
    login: 'http://172.30.11.77:8088/'
  },
  stage: { // 测试环境

  },
  prod: { // 线上

  }
}

export const conf = (
  (env) => {
    return hosts[env || 'dev']
  }
)(process.env.NODE_ENV)
