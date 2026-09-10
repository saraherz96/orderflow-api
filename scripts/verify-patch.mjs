import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const artifactDirectory = ".artifacts";
const reportPath = process.env.PATCH_REPORT_PATH ?? "patch-report.json";
const vitestReportPath = `${artifactDirectory}/vitest.json`;

mkdirSync(artifactDirectory, { recursive: true });

function run(command, args) {
    const startedAt = Date.now();
    const result = spawnSync(command, args, {
        encoding: "utf8",
        shell: process.platform === "win32",
    });

    return {
        command: [command, ...args].join(" "),
        durationMs: Date.now() - startedAt,
        exitCode: result.status ?? 1,
        output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
        passed: result.status === 0,
    };
}

const checks = [
    run("npm", ["test", "--", "--reporter=json", `--outputFile=${vitestReportPath}`]),
    run("npm", ["run", "typecheck"]),
    run("npm", ["run", "build:ui"]),
];

let tests = null;
try {
    tests = JSON.parse(readFileSync(vitestReportPath, "utf8"));
} catch {
    // Preserve check output when Vitest cannot produce its JSON report.
}

const report = {
    schemaVersion: 1,
    project: "orderflow-api",
    generatedAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA ?? null,
    branch: process.env.GITHUB_REF_NAME ?? null,
    status: checks.every((check) => check.passed) ? "passed" : "failed",
    checks,
    tests,
};

writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "passed" ? 0 : 1);