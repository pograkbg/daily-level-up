import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// 자동 테스트 설정: "@/..." 경로를 src 폴더로 연결합니다.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
