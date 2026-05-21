export type Intent =
  | "CREATE_TASK"
  | "UPDATE_TASK"
  | "LIST_TASKS"
  | "CREATE_PAYMENT"
  | "UPDATE_PAYMENT"
  | "LIST_PAYMENTS"
  | "PROJECT_STATUS"
  | "DOCUMENT_QUESTION"
  | "GENERAL_REPORT"
  | "UNKNOWN";

export const classifyIntent = (message: string): Intent => {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("add task") ||
    normalizedMessage.includes("create task") ||
    normalizedMessage.includes("remind me to")
  ) {
    return "CREATE_TASK";
  }

  if (
    normalizedMessage.includes("open task") ||
    normalizedMessage.includes("tasks") ||
    normalizedMessage.includes("to do") ||
    normalizedMessage.includes("todo")
  ) {
    return "LIST_TASKS";
  }

  if (
    normalizedMessage.includes("pending payment") ||
    normalizedMessage.includes("overdue payment") ||
    normalizedMessage.includes("payments")
  ) {
    return "LIST_PAYMENTS";
  }

  if (normalizedMessage.includes("report")) {
    return "GENERAL_REPORT";
  }

  if (
    normalizedMessage.includes("summarize") ||
    normalizedMessage.includes("status") ||
    normalizedMessage.includes("project")
  ) {
    return "PROJECT_STATUS";
  }

  if (
    normalizedMessage.includes("invoice") ||
    normalizedMessage.includes("quote") ||
    normalizedMessage.includes("pdf") ||
    normalizedMessage.includes("document") ||
    normalizedMessage.includes("file") ||
    normalizedMessage.includes("contract")
  ) {
    return "DOCUMENT_QUESTION";
  }

  return "UNKNOWN";
};
