const GRAPHQL_URL = "https://api.github.com/graphql";

export async function queryGitHub<Data>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<Data> {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    throw new Error(`GitHub 조회 실패: HTTP ${response.status}`);
  }

  const { data, errors } = (await response.json()) as {
    data: Data;
    errors?: { message: string }[];
  };
  if (errors) {
    throw new Error(errors.map(({ message }) => message).join(", "));
  }
  return data;
}
