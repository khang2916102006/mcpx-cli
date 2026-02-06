import pc from 'picocolors';

export const logger = {
  success(msg: string) {
    console.log(pc.green(`✓ ${msg}`));
  },
  error(msg: string) {
    console.error(pc.red(`✗ ${msg}`));
  },
  warn(msg: string) {
    console.warn(pc.yellow(`⚠ ${msg}`));
  },
  info(msg: string) {
    console.log(pc.cyan(`ℹ ${msg}`));
  },
  dim(msg: string) {
    console.log(pc.dim(msg));
  },
  bold(msg: string) {
    console.log(pc.bold(msg));
  },
};
