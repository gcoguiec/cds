import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketLoggingA } from '@cdktf/provider-aws/lib/s3-bucket-logging';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { Testing } from 'cdktf';

import { SSEAlgorithm } from '..';
import { CDSPrivateS3Bucket } from './s3-private-bucket';

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
            expect.objectContaining({
              apply_server_side_encryption_by_default: {
                sse_algorithm: SSEAlgorithm.AES
              }
            })
          ]
        }
      );
    });
  });

  describe('when a name is set on the bucket', () => {
    const bucket = 'tfstate';

    beforeAll(() => {
      synthetized = Testing.synthScope(scope => {
        new CDSPrivateS3Bucket(scope, 'private', {
          bucket
        });
      });
    });

    it('creates a bucket and log buckets resources based on provided name', () => {
      expect(synthetized).toHaveResourceWithProperties(S3Bucket, {
        bucket
      });

      expect(synthetized).toHaveResourceWithProperties(S3Bucket, {
        bucket: `${bucket}-logs`
      });
    });
  });

  describe('when an invalid name is set on the bucket', () => {
    const bucket = 'invalid-';

    it('throws an error', () => {
      expect(() => {
        Testing.synthScope(scope => {
          new CDSPrivateS3Bucket(scope, 'private', {
            bucket
          });
        });
      }).toThrowError("CDSPrivateS3Bucket: 'invalid-' bucket name is invalid.");
    });
  });

  describe('when server-side encryption is set to aws:kms', () => {
    beforeAll(() => {
      synthetized = Testing.synthScope(scope => {
        new CDSPrivateS3Bucket(scope, 'private', {
          sseAlgorithm: SSEAlgorithm.KMS
        });
      });
    });

    it('enables bucket key as default', () => {
      expect(synthetized).toHaveResourceWithProperties(
        S3BucketServerSideEncryptionConfigurationA,
        {
          bucket: expect.stringContaining('aws_s3_bucket.private_bucket'),
          rule: [
            expect.objectContaining({
              bucket_key_enabled: true
            })
          ]
        }
      );
    });

    describe('when bucket key is manually set to false', () => {
      const bucketKeyEnabled = false;

      beforeAll(() => {
        synthetized = Testing.synthScope(scope => {
          new CDSPrivateS3Bucket(scope, 'private', {
            sseAlgorithm: SSEAlgorithm.KMS,
            bucketKeyEnabled
          });
        });
      });

      it('sets bucket key to false on the resource', () => {
        expect(synthetized).toHaveResourceWithProperties(
          S3BucketServerSideEncryptionConfigurationA,
          {
            bucket: expect.stringContaining('aws_s3_bucket.private_bucket'),
            rule: [
              expect.objectContaining({
                bucket_key_enabled: bucketKeyEnabled
              })
            ]
          }
        );
      });
    });
  });

  describe('when a log target prefix is specified', () => {
    const targetPrefix = 'audit-logs';

    beforeAll(() => {
      synthetized = Testing.synthScope(scope => {
        new CDSPrivateS3Bucket(scope, 'private', {
          log: {
            targetPrefix
          }
        });
      });
    });

    it('sets the target prefix on the resource', () => {
      expect(synthetized).toHaveResourceWithProperties(S3BucketLoggingA, {
        bucket: expect.any(String),
        target_bucket: expect.any(String),
        target_prefix: targetPrefix
      });
    });
  });

  describe('when private bucket is configured with versioning', () => {
    beforeAll(() => {
      synthetized = Testing.synthScope(scope => {
        new CDSPrivateS3Bucket(scope, 'private', {
          versioned: true
        });
      });
    });

    it('enables versioning on the primary bucket', () => {
      expect(synthetized).toHaveResourceWithProperties(S3BucketVersioningA, {
        bucket: expect.any(String),
        versioning_configuration: {
          status: 'Enabled'
        }
      });
    });
  });
});
