const invalidLoginMessage = "없는 아이디거나 비밀번호가 틀렸습니다.";

export function getSignInErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return invalidLoginMessage;
  }

  const authError = error as Error & { code?: string };
  const normalizedMessage = error.message.toLowerCase();

  if (authError.code === "invalid_credentials" || normalizedMessage.includes("invalid login credentials")) {
    return invalidLoginMessage;
  }

  return error.message;
}
