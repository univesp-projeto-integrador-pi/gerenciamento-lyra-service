import { defineConfig } from "vitest/config";

try {
    process.loadEnvFile(".env.test");
} catch {
    // sem .env.test: o global-setup recusa rodar, com uma mensagem clara
}

export default defineConfig({
    test: {
        environment: "node",
        include: ["tests/**/*.test.ts"],
        globalSetup: ["./tests/global-setup.ts"],
        fileParallelism: false,
        testTimeout: 20000,
        hookTimeout: 30000,
    },
});