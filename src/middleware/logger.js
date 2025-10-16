const logger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
    
    console.log(`${log.method} ${log.url} ${log.status} - ${log.duration}`);
  });
  
  next();
};

module.exports = logger;
