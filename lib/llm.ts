import { spawn } from 'node:child_process';

const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude';
const DEFAULT_TIMEOUT_MS = 60_000;

export type RunOpts = {
  timeoutMs?: number;
  json?: boolean;
  systemPrompt?: string;
};

export async function runClaude(prompt: string, opts: RunOpts = {}): Promise<string> {
  const fullPrompt = opts.systemPrompt
    ? `${opts.systemPrompt}\n\n---\n\n${prompt}`
    : prompt;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    const child = spawn(CLAUDE_BIN, ['--print', fullPrompt], {
      env: { ...process.env, ANTHROPIC_API_KEY: '' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));

    child.on('close', (code) => {
      clearTimeout(timer);
      if (killed) return reject(new Error(`claude CLI timeout after ${timeoutMs}ms`));
      if (code !== 0) return reject(new Error(`claude CLI exit ${code}: ${stderr.slice(0, 500)}`));
      resolve(stdout.trim());
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export async function runClaudeJSON<T = unknown>(prompt: string, opts: RunOpts = {}): Promise<T> {
  const jsonInstruction =
    'Respond ONLY with valid JSON. No prose, no markdown fences, no explanations. Just the JSON object or array.';
  const wrapped = `${prompt}\n\n${jsonInstruction}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    const raw = await runClaude(wrapped, opts);
    const parsed = tryExtractJson<T>(raw);
    if (parsed !== null) return parsed;
    if (attempt === 2) {
      throw new Error(`Failed to parse JSON after 3 attempts. Raw: ${raw.slice(0, 300)}`);
    }
  }
  throw new Error('unreachable');
}

function tryExtractJson<T>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const candidate = fenced ? fenced[1] : text;
  const trimmed = candidate.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {}
  const objMatch = trimmed.match(/[\{\[][\s\S]*[\}\]]/);
  if (!objMatch) return null;
  try {
    return JSON.parse(objMatch[0]) as T;
  } catch {
    return null;
  }
}
