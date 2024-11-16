export const successResponse = (message, data) => ({
  success: true,
  message,
  data,
});

export const errorResponse = (message, errors = null) => ({
  success: false,
  message,
  errors,
  data: null,
});
