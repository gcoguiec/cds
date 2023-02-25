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

import { SSEAlgorithm } from '../aws';
import { checkS3BucketName } from '../utils/validation';

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
  readonly versioned?: boolean;
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
 * Creates a private S3 bucket.
 *
 * This resource blocks public access and log all accesses in a secondary
 * bucket by default.
 */
export class CDSPrivateS3Bucket extends Construct {
  constructor(
    scope: Construct,
    name: string,
    config: CDSPrivateS3BucketConfig
  ) {
    super(scope, name);

    const { provider, log, bucket } = config;

    if (bucket && !checkS3BucketName(bucket)) {
      throw new Error(
        `${CDSPrivateS3Bucket.name}: '${bucket}' bucket name is invalid.`
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

  public createBucket(config: CDSPrivateS3BucketConfig): S3Bucket {
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
    config: CDSPrivateS3ServerSideEncryptionConfig
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
