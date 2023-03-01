import { Testing } from 'cdktf';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';

import { S3PublicBucket } from './s3-public-bucket';

describe('S3PublicBucket', () => {
  let synthetized: string;

  describe('when bucket name provided is invalid', () => {
    const bucket = 'invalid-';

    it('throws an error', () => {
      expect(() => {
        Testing.synthScope(scope => {
          new S3PublicBucket(scope, 'public', {
            bucket
          });
        });
      }).toThrowError("S3PublicBucket: 'invalid-' bucket name is invalid.");
    });
  });

  describe('when no configuration is provided', () => {
    beforeAll(() => {
      synthetized = Testing.synthScope(scope => {
        new S3PublicBucket(scope, 'public', {});
      });
    });

    it('does not configure versioning nor force TLS', () => {
      expect(synthetized).not.toHaveResource(S3BucketPolicy);
      expect(synthetized).not.toHaveResource(S3BucketVersioningA);
    });
  });

  describe('when versioned option is enabled', () => {
    beforeAll(() => {
      synthetized = Testing.synthScope(scope => {
        new S3PublicBucket(scope, 'public', {
          versioned: true
        });
      });
    });

    it('registers and enables versioning for the bucket resource', () => {
      expect(synthetized).toHaveResourceWithProperties(S3BucketVersioningA, {
        bucket: expect.any(String),
        versioning_configuration: {
          status: 'Enabled'
        }
      });
    });
  });

  describe('when force TLS option is enabled', () => {
    beforeAll(() => {
      synthetized = Testing.synthScope(scope => {
        new S3PublicBucket(scope, 'public', {
          forceTLS: true
        });
      });
    });

    it('set-ups a bucket policy document and resource', () => {
      expect(synthetized).toHaveDataSourceWithProperties(
        DataAwsIamPolicyDocument,
        {
          statement: [
            expect.objectContaining({
              sid: 'ForceTLSRequestsOnly'
            }),
            expect.objectContaining({
              sid: 'EnforceTLSv12OrHigher'
            })
          ]
        }
      );
      expect(synthetized).toHaveResource(S3BucketPolicy);
    });
  });
});
