import fs from 'fs';
import path from 'path';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isProcessAlive(pid: number): boolean {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err: any) {
    return err?.code === 'EPERM';
  }
}

/**
 * Cross-process OS-level exclusive lockfile (`O_CREAT | O_EXCL` via `wx`)
 * combined with an in-process async mutex tail for zero-contention single-process
 * queueing and full multi-process mutual exclusion on disk stores.
 */
export function createCrossProcessLock(targetFilePath: string) {
  const lockPath = `${targetFilePath}.lock`;
  let inProcessTail: Promise<unknown> = Promise.resolve();

  async function acquireOsLock(timeoutMs = 15000, staleMs = 20000): Promise<() => void> {
    const dir = path.dirname(lockPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const deadline = Date.now() + timeoutMs;
    const token = `${process.pid}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;

    while (true) {
      try {
        const fd = fs.openSync(lockPath, 'wx', 0o600);
        try {
          fs.writeFileSync(fd, token, 'utf8');
        } finally {
          fs.closeSync(fd);
        }

        return () => {
          try {
            if (fs.existsSync(lockPath)) {
              const current = fs.readFileSync(lockPath, 'utf8');
              if (current === token) {
                fs.unlinkSync(lockPath);
              }
            }
          } catch {
            // Best-effort unlock cleanup
          }
        };
      } catch (err: any) {
        if (err?.code !== 'EEXIST') {
          throw err;
        }

        // Recover stale lock if holding PID exited or lock exceeded stale threshold
        try {
          const stat = fs.statSync(lockPath);
          const content = fs.readFileSync(lockPath, 'utf8');
          const holderPid = Number(content.split(':')[0]);
          const ageMs = Date.now() - stat.mtimeMs;
          if (ageMs > staleMs || (Number.isFinite(holderPid) && holderPid > 0 && !isProcessAlive(holderPid))) {
            fs.unlinkSync(lockPath);
            continue;
          }
        } catch {
          // Lock disappeared concurrently; retry immediately
          continue;
        }

        if (Date.now() >= deadline) {
          throw new Error(`Timed out waiting for cross-process lock: ${lockPath}`);
        }
        await sleep(10);
      }
    }
  }

  return function runWithCrossProcessLock<T>(task: () => Promise<T> | T): Promise<T> {
    const run = inProcessTail.then(async () => {
      const release = await acquireOsLock();
      try {
        return await task();
      } finally {
        release();
      }
    });

    inProcessTail = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  };
}
