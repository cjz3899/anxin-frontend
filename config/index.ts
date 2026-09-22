import { defineConfig } from '@tarojs/cli'

export default defineConfig({
  projectName: 'anxin-frontend',
  date: '2026-9-7',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    375: 2,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: ['@tarojs/plugin-html'],
  defineConstants: {
    //只有本地联调才注入 http 地址；线上不注入即走云托管内网 callContainer
    'process.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL || ''),
    //留空时由 src/constants 里的默认环境 ID 与服务名兜底
    'process.env.CLOUDRUN_ENV': JSON.stringify(process.env.CLOUDRUN_ENV || ''),
    'process.env.CLOUDRUN_SERVICE': JSON.stringify(process.env.CLOUDRUN_SERVICE || ''),
  },
  copy: {
    patterns: [],
    options: {},
  },
  framework: 'react',
  compiler: {
    type: 'webpack5',
    prebundle: {
      enable: false,
    },
  },
  cache: {
    enable: false,
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      cssModules: {
        enable: false,
      },
    },
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
  },
})
