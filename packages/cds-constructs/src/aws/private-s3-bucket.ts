import type { S3BucketConfig } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketAcl } from '@cdktf/provider-aws/lib/s3-bucket-acl';
import type { S3BucketLoggingAConfig } from '@cdktf/provider-aws/lib/s3-bucket-logging';
import { S3BucketLoggingA } from '@cdktf/provider-aws/lib/s3-bucket-logging';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import type { TerraformMetaArguments } from 'cdktf';
import { Construct } from 'constructs';

import { SSEAlgorithm } from '../common';

export type CSDS3PrivateBucketLogConfig = Pick<
  S3BucketLoggingAConfig,
  'targetPrefix'
>;

export type CDSPrivateS3BucketConfig = Pick<
  S3BucketConfig,
  'bucket' | 'provider' | 'tags'
> & {
  readonly sseAlgorithm?: SSEAlgorithm;
  readonly kmsMasterKeyId?: string;
  readonly bucketKeyEnabled?: boolean;
  readonly log?: CSDS3PrivateBucketLogConfig;
};

export interface CDSPrivateS3ServerSideEncryptionConfig
  extends TerraformMetaArguments {
  readonly bucket: string;
  readonly sseAlgorithm?: SSEAlgorithm;
  readonly kmsMasterKeyId?: string;
  readonly bucketKeyEnabled?: boolean;
}

export interface CDSPrivateS3LoggingConfig extends TerraformMetaArguments {
  readonly bucket: string;
  readonly targetBucket: string;
  readonly targetPrefix?: string;
}

/**
 * Creates a private S3 bucket with good defaults.
 */
export class CDSPrivateS3Bucket extends Construct {
  constructor(
    scope: Construct,
    name: string,
    config: CDSPrivateS3BucketConfig
  ) {
    super(scope, name);

    const { provider, log } = config;
    const s3Bucket = this.createBucket(config);
    const logBucket = this.createLogBucket(config);

    this.createLogging('logging', {
      bucket: s3Bucket.id,
      targetBucket: logBucket.id,
      provider,
      targetPrefix: log?.targetPrefix
    });
  }

  public createBucket(config: CDSPrivateS3BucketConfig): S3Bucket {
    const {
      bucket,
      tags,
      provider,
      sseAlgorithm,
      kmsMasterKeyId,
      bucketKeyEnabled
    } = config;

    const resource = new S3Bucket(this, 'bucket', {
      bucket,
      tags,
      provider
    });

    new S3BucketAcl(this, 'acl', {
      bucket: resource.id,
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
      sseAlgorithm,
      kmsMasterKeyId,
      bucketKeyEnabled
    });

    new S3BucketVersioningA(this, 'versioning', {
      bucket: resource.id,
      provider,
      versioningConfiguration: {
        status: 'Enabled'
      }
    });

    return resource;
  }

  public createLogBucket(config: CDSPrivateS3BucketConfig): S3Bucket {
    const {
      bucket,
      tags,
      provider,
      sseAlgorithm,
      kmsMasterKeyId,
      bucketKeyEnabled
    } = config;

    const resource = new S3Bucket(this, 'log_bucket', {
      bucket,
      tags,
      provider
    });

    new S3BucketAcl(this, 'log_acl', {
      bucket: resource.id,
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
      sseAlgorithm,
      kmsMasterKeyId,
      bucketKeyEnabled
    });

    return resource;
  }

  public createServiceSideEncryption(
    name: string,
    config: CDSPrivateS3ServerSideEncryptionConfig
  ) {
    const { bucket, bucketKeyEnabled, provider, sseAlgorithm, kmsMasterKeyId } =
      config;

    new S3BucketServerSideEncryptionConfigurationA(this, name, {
      bucket,
      provider,
      rule: [
        {
          bucketKeyEnabled:
            bucketKeyEnabled ?? sseAlgorithm === SSEAlgorithm.KMS,
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: sseAlgorithm ?? SSEAlgorithm.AES,
            ...(sseAlgorithm === SSEAlgorithm.KMS ? { kmsMasterKeyId } : {})
          }
        }
      ]
    });
  }

  public createLogging(name: string, config: CDSPrivateS3LoggingConfig) {
    const { bucket, targetBucket, provider, targetPrefix } = config;
    new S3BucketLoggingA(this, name, {
      bucket,
      provider,
      targetBucket,
      targetPrefix: targetPrefix ?? 'logs'
    });
  }
}
