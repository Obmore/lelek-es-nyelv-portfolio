export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailMessage {
  to: string;
  from: EmailAddress;
  replyTo: EmailAddress;
  subject: string;
  text: string;
  html: string;
}

export interface Env {
  EMAIL: { send(message: EmailMessage): Promise<unknown> };
  RL_IP: { limit(options: { key: string }): Promise<{ success: boolean }> };
  RL_GLOBAL: { limit(options: { key: string }): Promise<{ success: boolean }> };
}

export interface Deps {
  /** Send timeout in milliseconds (default 10 000). */
  sendTimeoutMs?: number;
  /** Clock for the duration in the log line. */
  now?: () => number;
}
