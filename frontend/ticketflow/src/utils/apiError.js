export function getApiErrorMessage(error, fallbackMessage) {
  if (!error.response) {
    return "Unable to reach TicketFlow. Make sure the backend is running and try again.";
  }

  if (error.response.status === 404) {
    return "The requested ticket could not be found.";
  }

  const responseData = error.response.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  if (responseData?.title) {
    return responseData.title;
  }

  if (responseData?.errors) {
    return Object.values(responseData.errors).flat().join(" ");
  }

  return fallbackMessage;
}
