const EndPoint = import.meta.env.VITE_API_ENDPOINT;
const S3EndPoint = import.meta.env.VITE_S3_ENDPOINT;
const Server47 = import.meta.env.VITE_SERVER47;
const MetaService = import.meta.env.VITE_META_SERVICE;
const DoSuggestionService = import.meta.env.VITE_DO_SUGGESTION_SERVICE;

const DWHCallplanAPI = import.meta.env.VITE_SNOWFLAKE_API_URL
const DWHCallplanAPItoken = import.meta.env.VITE_SNOWFLAKE_TOKEN


export { EndPoint, S3EndPoint, Server47, MetaService, DoSuggestionService, DWHCallplanAPI, DWHCallplanAPItoken };