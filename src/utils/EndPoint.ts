// const EndPoint = "http://10.0.29.47:9005/";
// const S3EndPoint = "http://10.0.29.47:9007/s3";
// export { EndPoint, S3EndPoint };


const EndPoint = import.meta.env.VITE_API_ENDPOINT;
const S3EndPoint = import.meta.env.VITE_S3_ENDPOINT;

export { EndPoint, S3EndPoint };
