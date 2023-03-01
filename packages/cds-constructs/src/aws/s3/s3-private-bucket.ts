import type { S3BucketConfig } from '@cdktf/provider-aws/lib/s3-bucket';
import type { S3BucketLoggingAConfig } from '@cdktf/provider-aws/lib/s3-bucket-logging';
import type { TerraformMetaArguments } from 'cdktf';

import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketAcl } from '@cdktf/provider-aws/lib/s3-bucket-acl';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketLoggingA } from '@cdktf/provider-aws/lib/s3-bucket-logging';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';

import { checkS3BucketName } from '../../utils/validation';
import { SSEAlgorithm } from '..';
import { createForceObjectEncryptionPolicyDocument } from './s3-policies';

export type S3PrivateBucketLogConfig = Pick<
  S3BucketLoggingAConfig,
  'targetPrefix'
>;

export type S3PrivateBucketConfig = Pick<
  S3BucketConfig,
  'bucket' | 'provider' | 'tags'
> & {
  readonly bucketPrefix?: string;
  readonly sseAlgorithm?: SSEAlgorithm;
  readonly kmsMasterKeyId?: string;
  readonly bucketKeyEnabled?: boolean;
  readonly log?: S3PrivateBucketLogConfig;
  readonly versioned?: boolean;
  readonly preventDestroy?: boolean;
};

export interface S3PrivateServerSideEncryptionConfig
  extends TerraformMetaArguments {
  readonly bucket: string;
  readonly sseAlgorithm?: SSEAlgorithm;
  readonly kmsMasterKeyId?: string;
  readonly bucketKeyEnabled?: boolean;
}

export interface S3PrivateLoggingConfig extends TerraformMetaArguments {
  readonly bucket: string;
  readonly targetBucket: string;
  readonly targetPrefix?: string;
}

/**
 * Creates a private and encrypted S3 bucket.
 *
 * This resource blocks public access and log all accesses in a secondary
 * bucket by default.
 *
 * https://aws.amazon.com/blogs/aws/heads-up-amazon-s3-security-changes-are-coming-in-april-of-2023/
 */
export class S3PrivateBucket extends Construct {
  constructor(scope: Construct, name: string, config: S3PrivateBucketConfig) {
    super(scope, name);

    const { provider, log, bucket } = config;

    if (bucket && !checkS3BucketName(bucket)) {
      throw new Error(
        `${S3PrivateBucket.name}: '${bucket}' bucket name is invalid.`
      );
    }

    const s3Bucket = this.createBucket(config);
    const logBucket = this.createLogBucket(config);

    this.createLogging('logging', {
      bucket: s3Bucket.id,
      targetBucket: logBucket.id,
      provider,
      targetPrefix: log?.targetPrefix
    });

    new TerraformOutput(this, 'bucket_arn', {
      value: s3Bucket.arn
    });
    new TerraformOutput(this, 'log_bucket_arn', {
      value: logBucket.arn
    });
  }

  public createBucket(config: S3PrivateBucketConfig): S3Bucket {
    const {
      bucket,
      bucketPrefix,
      tags,
      provider,
      sseAlgorithm,
      kmsMasterKeyId,
      bucketKeyEnabled,
      versioned,
      preventDestroy
    } = config;

    const resource = new S3Bucket(this, 'bucket', {
      bucket,
      bucketPrefix,
      tags,
      provider
    });

    new S3BucketAcl(this, 'acl', {
      bucket: resource.id,
      provider,
      acl: 'private',
      lifecycle: {
        preventDestroy
      }
    });

    new S3BucketPublicAccessBlock(this, 'public_access_block', {
      bucket: resource.id,
      provider,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });

    this.createServiceSideEncryption('sse_encryption', {
      bucket: resource.id,
      provider,
      sseAlgorithm,
      kmsMasterKeyId,
      bucketKeyEnabled
    });

    const doc = createForceObjectEncryptionPolicyDocument(this, 'policy_doc', {
      bucket: resource.bucket,
      sseAlgorithm: sseAlgorithm ?? SSEAlgorithm.AES
    });

    new S3BucketPolicy(this, 'policy', {
      bucket: resource.id,
      policy: doc.json,
      provider
    });

    if (versioned) {
      new S3BucketVersioningA(this, 'versioning', {
        bucket: resource.id,
        provider,
        versioningConfiguration: {
          status: 'Enabled'
        }
      });
    }

    return resource;
  }

  public createLogBucket(config: S3PrivateBucketConfig): S3Bucket {
    const {
      bucket,
      tags,
      provider,
      sseAlgorithm,
      kmsMasterKeyId,
      bucketKeyEnabled,
      preventDestroy
    } = config;

    const resource = new S3Bucket(this, 'log_bucket', {
      bucket: bucket ? `${bucket}-logs` : undefined,
      tags,
      provider,
      lifecycle: {
        preventDestroy
      }
    });

    new S3BucketAcl(this, 'log_acl', {
      bucket: resource.id,
      provider,
      acl: 'log-delivery-write'
    });

    new S3BucketPublicAccessBlock(this, 'log_public_access_block', {
      bucket: resource.id,
      provider,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });

    new S3BucketLifecycleConfiguration(this, 'log_lifecycle', {
      bucket: resource.id,
      rule: [
        {
          id: 'AutoArchive',
          status: 'Enabled',
          transition: [
            {
              days: 90,
              storageClass: 'GLACIER'
            }
          ],
          expiration: {
            days: 365
          }
        }
      ]
    });

    this.createServiceSideEncryption('log_sse_encryption', {
      bucket: resource.id,
      provider,
      sseAlgorithm,
      kmsMasterKeyId,
      bucketKeyEnabled
    });

    return resource;
  }

  public createServiceSideEncryption(
    name: string,
    config: S3PrivateServerSideEncryptionConfig
  ) {
    const { bucket, bucketKeyEnabled, provider, sseAlgorithm, kmsMasterKeyId } =
      config;

    new S3BucketServerSideEncryptionConfigurationA(this, name, {
      bucket,
      provider,
      rule: [
        {
          ...(sseAlgorithm === SSEAlgorithm.KMS
            ? {
                // https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-key.html
                bucketKeyEnabled: bucketKeyEnabled ?? true
              }
            : {}),
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: sseAlgorithm ?? SSEAlgorithm.AES,
            ...(sseAlgorithm === SSEAlgorithm.KMS ? { kmsMasterKeyId } : {})
          }
        }
      ]
    });
  }

  public createLogging(name: string, config: S3PrivateLoggingConfig) {
    const { bucket, targetBucket, provider, targetPrefix } = config;
    new S3BucketLoggingA(this, name, {
      bucket,
      provider,
      targetBucket,
      targetPrefix: targetPrefix ?? 'logs'
    });
  }
}
