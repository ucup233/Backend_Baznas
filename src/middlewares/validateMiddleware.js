const validate = (schema, source = 'body') => (req, res, next) => {
  const data = {
    body: req.body,
    query: req.query,
    params: req.params,
  }[source];

  const result = schema.safeParse(data);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  // Overwrite req data dengan nilai yang sudah di-parse & di-transform (misal: string → number)
  if (source === 'body') req.body = result.data;
  if (source === 'query') Object.assign(req.query, result.data);
  if (source === 'params') Object.assign(req.params, result.data);

  next();
};

export default validate;