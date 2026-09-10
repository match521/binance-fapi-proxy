const axios = require('axios');

module.exports = async (req, res) => {
  try {
    // 币安合约基准官方端点
    const targetBaseUrl = 'https://fapi.binance.com';
    
    // 拼接请求路径与查询参数
    const targetUrl = targetBaseUrl + req.url;

    // 清理并构造转发请求头，必须重置 Host
    const headers = { ...req.headers };
    delete headers.host;
    delete headers['x-forwarded-for'];
    delete headers['x-forwarded-host'];
    delete headers['x-forwarded-proto'];
    delete headers['content-length'];
    headers['host'] = 'fapi.binance.com';

    const axiosConfig = {
      method: req.method,
      url: targetUrl,
      headers: headers,
      validateStatus: () => true, // 允许所有状态码原样透传
      responseType: 'arraybuffer',
      timeout: 15000
    };

    // 针对带 Body 的请求进行数据透传
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase()) && req.body) {
      axiosConfig.data = req.body;
    }

    const response = await axios(axiosConfig);

    // 转发上游响应头
    for (const [key, value] of Object.entries(response.headers)) {
      try {
        res.setHeader(key, value);
      } catch (e) {
        // 忽略受保护或无效响应头
      }
    }

    res.status(response.status).send(response.data);
  } catch (error) {
    res.status(500).json({
      code: -1,
      msg: 'Vercel Proxy Error: ' + (error.message || 'Unknown network error')
    });
  }
};
