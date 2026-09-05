import "dotenv/config";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`환경변수 ${key}가 설정되지 않았습니다. .env 파일을 확인하세요.`);
  }
  return value;
}

export function getConfig() {
  return {
    baseUrl: requireEnv("N8N_API_URL").replace(/\/+$/, ""),
    apiKey: requireEnv("N8N_API_KEY"),
  };
}
