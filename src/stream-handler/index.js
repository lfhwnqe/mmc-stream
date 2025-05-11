const awslambda = require('aws-lambda');

/**
 * u4e13u7528u7684u6d41u5f0fu54cdu5e94Lambdau5904u7406u7a0bu5e8f
 * u7eafJavaScriptu5b9eu73b0uff0cu65e0u9700TypeScriptu7f16u8bd1
 */
exports.handler = async function(event, context) {
  return awslambda.streamifyResponse(streamResponseHandler.bind(null, event, context));
};

/**
 * u6d41u5f0fu54cdu5e94u5904u7406u51fdu6570
 */
async function streamResponseHandler(event, context, responseStream) {
  // u8bbeu7f6eu54cdu5e94u5934
  responseStream.setContentType('text/plain');
  
  // u89e3u6790u8bf7u6c42
  let requestBody = {};
  try {
    if (event.body) {
      requestBody = JSON.parse(event.body);
    }
  } catch (e) {
    console.error('u89e3u6790u8bf7u6c42u4f53u5931u8d25', e);
  }
  
  // u83b7u53d6u6d88u606fu6570u91cfu53c2u6570 (u9ed8u8ba4u4e3a5u6761)
  const messageCount = requestBody.messageCount || event.queryStringParameters?.count || 5;
  
  // u83b7u53d6u5ef6u8fdfu53c2u6570 (u9ed8u8ba4u4e3a1000ms)
  const delay = requestBody.delay || event.queryStringParameters?.delay || 1000;
  
  // u6d41u5f0fu53d1u9001u54cdu5e94
  responseStream.write(`u5f00u59cbu6d41u5f0fu54cdu5e94 - u5c06u53d1u9001 ${messageCount} u6761u6d88u606fuff0cu6bcfu6761u5ef6u8fdf ${delay}ms\n`);
  
  // u6a21u62dfu751fu6210u591au6761u6d88u606f
  for (let i = 0; i < messageCount; i++) {
    await sleep(delay);
    const message = `[${new Date().toISOString()}] u6d41u5f0fu6d88u606f #${i+1} - u6765u81eammc-streamu670du52a1\n`;
    responseStream.write(message);
  }
  
  // u6dfbu52a0u7ed3u675fu6807u8bb0
  await sleep(delay);
  responseStream.write('\n==u6d41u5f0fu54cdu5e94u7ed3u675f==\n');
  
  // u7ed3u675fu6d41
  responseStream.end();
}

/**
 * u5de5u5177u51fdu6570uff1au5ef6u8fdfu6267u884c
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
