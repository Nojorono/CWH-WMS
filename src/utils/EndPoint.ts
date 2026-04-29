// const EndPoint = import.meta.env.VITE_API_ENDPOINT;
// const S3EndPoint = import.meta.env.VITE_S3_ENDPOINT;
// const Server47 = import.meta.env.VITE_SERVER47;
// const MetaService = import.meta.env.VITE_META_SERVICE;

// export { EndPoint, S3EndPoint, Server47, MetaService };


import ACTIVE_ENV from './ActiveEnv'

const configs = {
  dev: {
    EndPoint: import.meta.env.VITE_API_ENDPOINT,
    S3EndPoint: import.meta.env.VITE_S3_ENDPOINT,
    Server47: import.meta.env.VITE_SERVER47,
    MetaService: import.meta.env.VITE_META_SERVICE,
  },
  prod: {
    EndPoint: import.meta.env.VITE_API_ENDPOINT,
    S3EndPoint: import.meta.env.VITE_S3_ENDPOINT,
    Server47: import.meta.env.VITE_SERVER47,
    MetaService: import.meta.env.VITE_META_SERVICE,
  },
}

const config = configs[ACTIVE_ENV]

export const { EndPoint, S3EndPoint, Server47, MetaService } = config