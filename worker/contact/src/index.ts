import { handle } from './handler.ts';
import type { Env } from './env.ts';

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handle(request, env);
  },
};
