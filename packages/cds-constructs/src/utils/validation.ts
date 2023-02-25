export function checkIpv4(value: string): boolean {
  // https://github.com/sindresorhus/ip-regex/blob/main/index.js#L7
  return /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/.test(
    value
  );
}

// https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html
export function checkS3BucketName(value: string): boolean {
  if (!/(?!xn--)(?!.*-s3alias)^[a-z0-9][a-z0-9-.]{1,61}[a-z0-9]$/.test(value)) {
    return false;
  }

  return !checkIpv4(value) && !value.includes('..');
}
