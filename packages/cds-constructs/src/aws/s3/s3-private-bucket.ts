import type { S3BucketConfig } from '@cdktf/provider-aws/lib/s3-bucket';

import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import {
  S3BucketLifecycleConfiguration,
  S3BucketLifecycleConfigurationRule
} from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketLoggingA } from '@cdktf/provider-aws/lib/s3-bucket-logging';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';

import { checkS3BucketName } from '../validation';
import { SSEAlgorithm } from '..';
import { S3BucketOwnershipControls } from '@cdktf/provider-aws/lib/s3-bucket-ownership-controls';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import {
  createCreateDenyBucketKeylessUploadsStatement,
  createDenyIncorrectEncryptionHeaderStatement,
  createDenyUnencryptedObjectUploadsStatement,
  createEnforceTLSv12OrHigherStatement,
  createForceTLSRequestsOnlyStatement
} from './s3-policies';
import { S3LogBucket } from './s3-log-bucket';
import type { TerraformMetaArguments } from 'cdktf';

export interface S3PrivateBucketLogConfig {
  readonly logPrefix?: string;
}

export type S3PrivateBucketConfig = Pick<S3BucketConfig, 'bucket' | 'tags'> &
  TerraformMetaArguments & {
    readonly bucketPrefix?: string;
    readonly sseAlgorithm?: SSEAlgorithm;
    readonly kmsMasterKeyId?: string;
    readonly bucketKeyEnabled?: boolean;
    readonly log?: S3PrivateBucketLogConfig;
    readonly versioned?: boolean;
    readonly lifecycleRules?: S3BucketLifecycleConfigurationRule[];
    readonly preventDestroy?: boolean;
  };

/**
 * Creates a private and encrypted S3 bucket.
 *
 * This resource blocks public access, log all accesses in a secondary
 * bucket by default and doesn't use ACLs.
 */
export class S3PrivateBucket extends Construct {
  readonly #config: S3PrivateBucketConfig;

  constructor(scope: Construct, name: string, config: S3PrivateBucketConfig) {
    super(scope, name);

    this.#config = config;
    const { provider, bucket, tags, preventDestroy } = config;
    const logPrefix = config.log?.logPrefix ?? '/logs';

    if (bucket && !checkS3BucketName(bucket)) {
      throw new Error(
        `${S3PrivateBucket.name}: '${bucket}' bucket name is invalid.`
      );
    }

    const s3Bucket = this.createBucket();
    const logBucket = new S3LogBucket(this, 'log', {
      bucket: bucket ? `${bucket}-logs` : undefined,
      provider,
      tags,
      logPrefix,
      preventDestroy
    });
    new S3BucketLoggingA(this, name, {
      bucket: s3Bucket.id,
      provider,
      targetBucket: logBucket.id,
      targetPrefix: logPrefix
    });
  }

  public createBucket(): S3Bucket {
    const { bucket, bucketPrefix, tags, provider, versioned, preventDestroy } =
      this.#config;

    const resource = new S3Bucket(this, 'bucket', {
      bucket,
      bucketPrefix,
      tags,
      provider,
      lifecycle: {
        preventDestroy: preventDestroy ?? false
      }
    });

    new S3BucketOwnershipControls(this, 'ownership_controls', {
      bucket: resource.id,
      provider,
      rule: {
        objectOwnership: 'BucketOwnerEnforced'
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

    this.setupLifecycle(resource);
    this.setupEncryption(resource);
    this.setupPolicy(resource);

    if (versioned) {
      this.setupVersioning(resource);
    }

    return resource;
  }

  /**
   * Configure lifecycle on the bucket.
   *
   * Version retention is set to one year by default.
   *
   * You can override the default lifecycle via the `lifecycleRules`
   * configuration variable.
   */
  private setupLifecycle(resource: S3Bucket) {
    const { provider, versioned, lifecycleRules } = this.#config;
    new S3BucketLifecycleConfiguration(this, 'lifecycle', {
      bucket: resource.id,
      provider,
      rule:
        lifecycleRules ?? versioned
          ? [
              {
                id: 'AutoArchiveVersions',
                status: 'Enabled',
                noncurrentVersionTransition: [
                  {
                    noncurrentDays: 7,
                    storageClass: 'GLACIER'
                  }
                ],
                noncurrentVersionExpiration: {
                  noncurrentDays: 365
                }
              }
            ]
          : []
    });
  }

  private setupPolicy(resource: S3Bucket) {
    const { provider } = this.#config;
    const sseAlgorithm = this.#config.sseAlgorithm ?? SSEAlgorithm.AES;
    const bucketKeyEnabled =
      this.#config.bucketKeyEnabled ?? sseAlgorithm === SSEAlgorithm.KMS;
    const statement = [
      createForceTLSRequestsOnlyStatement(resource.arn),
      createEnforceTLSv12OrHigherStatement(resource.arn),
      createDenyIncorrectEncryptionHeaderStatement(resource.arn, sseAlgorithm),
      createDenyUnencryptedObjectUploadsStatement(resource.arn)
    ];

    if (sseAlgorithm === SSEAlgorithm.KMS && bucketKeyEnabled) {
      statement.push(
        createCreateDenyBucketKeylessUploadsStatement(resource.arn)
      );
    }

    const doc = new DataAwsIamPolicyDocument(this, 'policy_doc', {
      provider,
      version: '2012-10-17',
      statement
    });

    new S3BucketPolicy(this, 'policy', {
      bucket: resource.id,
      policy: doc.json,
      provider
    });
  }

  private setupVersioning(resource: S3Bucket) {
    const { provider } = this.#config;
    new S3BucketVersioningA(this, 'versioning', {
      bucket: resource.id,
      provider,
      versioningConfiguration: {
        status: 'Enabled'
      }
    });
  }

  /**
   * Set-up encryption on the bucket.
   *
   * Bucket key will be enabled by default if you're using a KMS master key
   * (cost saving), you'll have to set `bucketKeyEnabled` to false
   * if you want to disable it.
   *
   * More about the bucket key feature at:
   * https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-key.html
   */
  private setupEncryption(resource: S3Bucket) {
    const { provider, sseAlgorithm, bucketKeyEnabled, kmsMasterKeyId } =
      this.#config;
    new S3BucketServerSideEncryptionConfigurationA(this, 'sse_encryption', {
      bucket: resource.id,
      provider,
      rule: [
        {
          ...(sseAlgorithm === SSEAlgorithm.KMS
            ? {
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
}
