import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function runPowerShell(script, {
  platform = process.platform,
  env = process.env,
  spawn = spawnSync,
  reportError = console.error
} = {}) {
  if (!script) {
    reportError("실행할 PowerShell 스크립트 이름이 필요합니다.");
    return 1;
  }

  const command = platform === "win32" ? "powershell" : "pwsh";
  const result = spawn(command, ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script], {
    env,
    stdio: "inherit",
    shell: false
  });

  if (result.error) {
    reportError(result.error.code === "ENOENT"
      ? `${script}: 패키징에는 PowerShell(Windows PowerShell 또는 pwsh)이 필요합니다. npm run check는 모든 OS에서 실행할 수 있습니다.`
      : `${script}: PowerShell 실행 실패: ${result.error.message}`);
    return 1;
  }
  return result.status ?? 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = runPowerShell(process.argv[2]);
}
