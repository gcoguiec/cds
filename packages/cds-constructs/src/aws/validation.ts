import { checkIpv4 } from '../validation';

// https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html
export function checkS3BucketName(value: string): boolean {
  if (!/(?!xn--)(?!.*-s3alias)^[a-z0-9][a-z0-9-.]{1,61}[a-z0-9]$/.test(value)) {
    return false;
  }

  return !checkIpv4(value) && !value.includes('..');
}
