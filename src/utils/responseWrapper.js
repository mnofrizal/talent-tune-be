export const successResponse = (message, data, metadata = null) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (metadata) {
    response.metadata = metadata;
  }

  return response;
};

export const errorResponse = (message, errors = null) => ({
  success: false,
  message,
  errors,
  data: null,
});
