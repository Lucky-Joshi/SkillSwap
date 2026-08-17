const sendSuccess = (res, { message = 'Success', data = null, meta = null, statusCode = 200 } = {}) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(statusCode).json(body);
};

const sendCreated = (res, { message = 'Created', data = null } = {}) =>
  sendSuccess(res, { message, data, statusCode: 201 });

const sendNoContent = (res) => res.status(204).end();

const paginateMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.max(Math.ceil(total / limit), 1),
  hasMore: page * limit < total,
});

module.exports = { sendSuccess, sendCreated, sendNoContent, paginateMeta };
