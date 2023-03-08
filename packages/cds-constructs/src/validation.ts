export function checkIpv4(value: string): boolean {
  // https://github.com/sindresorhus/ip-regex/blob/main/index.js#L7
  return /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/.test(
    value
  );
}
