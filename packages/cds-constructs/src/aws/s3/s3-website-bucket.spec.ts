import { Testing } from 'cdktf';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';

import { S3WebsiteBucket } from './s3-website-bucket';

describe('S3WebsiteBucket', () => {
  let synthetized: string;

  describe('when bucket name provided is invalid', () => {
    const bucket = 'invalid-';

    it('throws an error', () => {
      expect(() => {
        Testing.synthScope(scope => {
          new S3WebsiteBucket(scope, 'website', {
            bucket
          });
        });
      }).toThrowError("S3WebsiteBucket: 'invalid-' bucket name is invalid.");
    });
  });

  describe('when no configuration is provided', () => {
    beforeAll(() => {
      synthetized = Testing.synthScope(scope => {
        new S3WebsiteBucket(scope, 'website', {});
      });
    });

    it('does not configure versioning by default', () => {
      expect(synthetized).not.toHaveResource(S3BucketVersioningA);
    });

    it('forces TLS by default via a bucket policy', () => {
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

  describe('when versioned option is enabled', () => {
    beforeAll(() => {
      synthetized = Testing.synthScope(scope => {
        new S3WebsiteBucket(scope, 'website', {
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
});
