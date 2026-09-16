// Show useful API diagnostics without copying response bodies or credentials to IPC.
export function safeVoiceError(error, action, env = process.env) {
 const status = Number.isInteger(error?.statusCode) ? error.statusCode : null;
 const body = error?.body;
 const detail = body?.message ?? body?.reason ?? body?.error?.message ?? (typeof body?.error === 'string' ? body.error : undefined);
 let message = typeof detail === 'string' ? detail : typeof error?.message === 'string' ? error.message.split('\nBody:')[0] : 'Unknown voice error';
 for (const [key, value] of Object.entries(env)) {
  if (/KEY|SECRET|TOKEN|CERTIFICATE|APP_ID|PIPELINE_ID/i.test(key) && typeof value === 'string' && value.length > 3) message = message.split(value).join('[redacted]');
 }
 message = message.replace(/\b007[A-Za-z0-9+/=]{30,}/g, '[redacted token]').replace(/\b[a-f\d]{32,128}\b/gi, '[redacted]').replace(/(Bearer|Basic)\s+\S+/gi, '$1 [redacted]').replace(/\s+/g, ' ').trim();
 const networkCode = error?.cause?.code ?? error?.code;
 if (['ENOTFOUND','ECONNREFUSED','ETIMEDOUT','ECONNRESET'].includes(networkCode)) message = `Network connection failed (${networkCode}).`;
 const hint = status === 401 ? ' Verify the App ID and App Certificate belong to the same project.' : status === 403 ? ' Check Conversational AI access and managed-model permissions.' : status === 429 ? ' Check project quota and active agent limits.' : '';
 return `Agora ${action}${status ? ` (HTTP ${status})` : ''}: ${message.slice(0, 500)}${hint}`;
}
