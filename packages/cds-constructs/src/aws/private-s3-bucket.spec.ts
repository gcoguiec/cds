import { S3BucketLoggingA } from '@cdktf/provider-aws/lib/s3-bucket-logging';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { Testing } from 'cdktf';

import { CDSPrivateS3Bucket } from './private-s3-bucket';

describe('CDSPrivateS3Bucket', () => {
  let synthetized: string;

  describe('when no configuration is provided', () => {
    beforeAll(() => {
      synthetized = Testing.synthScope(scope => {
        new CDSPrivateS3Bucket(scope, 'private', {});
      });
    });

    it('creates bucket logging ressource with a default target prefix', () => {
      expect(synthetized).toHaveResourceWithProperties(S3BucketLoggingA, {
        bucket: expect.any(String),
        target_bucket: expect.any(String),
        target_prefix: 'logs'
      });
    });

    it('creates bucket with server-side encryption set to AES256 by default', () => {
      expect(synthetized).toHaveResourceWithProperties(
        S3BucketServerSideEncryptionConfigurationA,
        {
          bucket: expect.stringContaining('aws_s3_bucket.private_bucket'),
          rule: [
            {
              bucket_key_enabled: expect.any(Boolean),
              apply_server_side_encryption_by_default: {
                sse_algorithm: 'AES256'
              }
            }
          ]
        }
      );
    });
  });
});
