const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Erro de validação do Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors
    });
  }

  // Erro de duplicação do Mongoose
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} já existe`,
      field
    });
  }

  // Erro de cast do Mongoose
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID inválido'
    });
  }

  // Erro padrão
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor'
  });
};

module.exports = errorHandler;
