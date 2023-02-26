import type { S3BucketConfig } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketAcl } from '@cdktf/provider-aws/lib/s3-bucket-acl';
import type { S3BucketLoggingAConfig } from '@cdktf/provider-aws/lib/s3-bucket-logging';
import { S3BucketLoggingA } from '@cdktf/provider-aws/lib/s3-bucket-logging';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import type { TerraformMetaArguments } from 'cdktf';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

import { checkS3BucketName } from '../../utils/validation';
import { SSEAlgorithm } from '..';

export type CSDS3PrivateBucketLogConfig = Pick<
  S3BucketLoggingAConfig,
  'targetPrefix'
>;

export type CDSS3PrivateBucketConfig = Pick<
  S3BucketConfig,
  'bucket' | 'provider' | 'tags'
> & {
  readonly sseAlgorithm?: SSEAlgorithm;
  readonly kmsMasterKeyId?: string;
  readonly bucketKeyEnabled?: boolean;
  readonly log?: CSDS3PrivateBucketLogConfig;
  readonly versioned?: boolean;
};

export interface CDSS3PrivateServerSideEncryptionConfig
  extends TerraformMetaArguments {
  readonly bucket: string;
  readonly sseAlgorithm?: SSEAlgorithm;
  readonly kmsMasterKeyId?: string;
  readonly bucketKeyEnabled?: boolean;
}

export interface CDSS3PrivateLoggingConfig extends TerraformMetaArguments {
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
export class CDSS3PrivateBucket extends Construct {
  constructor(
    scope: Construct,
    name: string,
    config: CDSS3PrivateBucketConfig
  ) {
    super(scope, name);

    const { provider, log, bucket } = config;

    if (bucket && !checkS3BucketName(bucket)) {
      throw new Error(
        `${CDSS3PrivateBucket.name}: '${bucket}' bucket name is invalid.`
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

    new TerraformOutput(this, 'bucket_name', {
      value: s3Bucket.bucket
    });
    new TerraformOutput(this, 'log_bucket_name', {
      value: logBucket.bucket
    });
  }

  public createBucket(config: CDSS3PrivateBucketConfig): S3Bucket {
    const {
      bucket,
      tags,
      provider,
      sseAlgorithm,
      kmsMasterKeyId,
      bucketKeyEnabled,
      versioned
    } = config;

    const resource = new S3Bucket(this, 'bucket', {
      bucket,
      tags,
      provider
    });

    new S3BucketAcl(this, 'acl', {
      bucket: resource.id,
      provider,
      acl: 'private'
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

  public createLogBucket(config: CDSS3PrivateBucketConfig): S3Bucket {
    const {
      bucket,
      tags,
      provider,
      sseAlgorithm,
      kmsMasterKeyId,
      bucketKeyEnabled
    } = config;

    const resource = new S3Bucket(this, 'log_bucket', {
      bucket: bucket ? `${bucket}-logs` : undefined,
      tags,
      provider
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
    config: CDSS3PrivateServerSideEncryptionConfig
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
                // Bucket key is enabled by default when using KMS.
                // see: https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-key.html
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

  public createLogging(name: string, config: CDSS3PrivateLoggingConfig) {
    const { bucket, targetBucket, provider, targetPrefix } = config;
    new S3BucketLoggingA(this, name, {
      bucket,
      provider,
      targetBucket,
      targetPrefix: targetPrefix ?? 'logs'
    });
  }
}
