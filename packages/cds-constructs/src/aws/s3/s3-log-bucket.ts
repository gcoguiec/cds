import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { S3Bucket, S3BucketConfig } from '@cdktf/provider-aws/lib/s3-bucket';
import {
  S3BucketLifecycleConfiguration,
  S3BucketLifecycleConfigurationRule
} from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketOwnershipControls } from '@cdktf/provider-aws/lib/s3-bucket-ownership-controls';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { Construct } from 'constructs';
import { SSEAlgorithm } from '..';
import { createAllowLoggingServiceStatement } from './s3-policies';

export type S3LogBuckletConfig = Pick<
  S3BucketConfig,
  'bucket' | 'provider' | 'tags'
> & {
  readonly logPrefix: string;
  readonly sseAlgorithm?: SSEAlgorithm;
  readonly kmsMasterKeyId?: string;
  readonly bucketKeyEnabled?: boolean;
  readonly lifecycleRules?: S3BucketLifecycleConfigurationRule[];
  readonly preventDestroy?: boolean;
};

/**
 * Creates a private S3 log bucket with reasonable defaults.
 */
export class S3LogBucket extends Construct {
  public readonly resource: S3Bucket;
  readonly #config: S3LogBuckletConfig;

  public get id(): string {
    return this.resource.id;
  }

  public get arn(): string {
    return this.resource.arn;
  }

  constructor(scope: Construct, name: string, config: S3LogBuckletConfig) {
    super(scope, name);

    this.#config = {
      sseAlgorithm: SSEAlgorithm.AES,
      bucketKeyEnabled: config.sseAlgorithm === SSEAlgorithm.KMS,
      preventDestroy: false,
      ...config
    };
    const { bucket, provider, tags, preventDestroy } = this.#config;

    const identity = new DataAwsCallerIdentity(this, 'current');
    const resource = new S3Bucket(this, 'bucket', {
      bucket,
      tags,
      provider,
      lifecycle: {
        preventDestroy
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

    this.#setupLifecycle(resource);
    this.#setupPolicy(resource, identity);
    this.#setupEncryption(resource);
    this.resource = resource;
  }

  /**
   * Configure lifecycle on the log bucket.
   *
   * Log retention is set to one year by default.
   *
   * You can override the default lifecycle using the `lifecycleRules`
   * configuration variable.
   */
  #setupLifecycle(resource: S3Bucket) {
    const { lifecycleRules } = this.#config;
    new S3BucketLifecycleConfiguration(this, 'lifecycle', {
      bucket: resource.id,
      rule: lifecycleRules ?? [
        {
          id: 'AutoArchive',
          status: 'Enabled',
          transition: [
            {
              days: 30,
              storageClass: 'STANDARD_IA'
            },
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
  }

  /**
   * Set-up policies on the log bucket.
   *
   * We need to give the AWS logging service access so it can push the logs
   * to their bucket directory.
   */
  #setupPolicy(resource: S3Bucket, identity: DataAwsCallerIdentity) {
    const { provider, logPrefix } = this.#config;
    const doc = new DataAwsIamPolicyDocument(this, 'policy_doc', {
      provider,
      version: '2012-10-17',
      statement: [
        createAllowLoggingServiceStatement(
          resource.arn,
          identity.accountId,
          logPrefix
        )
      ]
    });

    new S3BucketPolicy(this, 'policy', {
      bucket: resource.id,
      provider,
      policy: doc.json
    });
  }

  /**
   * Set-up encryption on the log bucket.
   *
   * Bucket key will be enabled by default if you're using a KMS master key
   * (cost saving), you'll have to set `bucketKeyEnabled` to false
   * if you want to disable it.
   *
   * More about the bucket key feature at:
   * https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-key.html
   */
  #setupEncryption(resource: S3Bucket) {
    const { provider, sseAlgorithm, bucketKeyEnabled, kmsMasterKeyId } =
      this.#config;
    new S3BucketServerSideEncryptionConfigurationA(this, 'sse_encryption', {
      bucket: resource.id,
      provider,
      rule: [
        {
          ...(sseAlgorithm === SSEAlgorithm.KMS ? { bucketKeyEnabled } : {}),
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: sseAlgorithm ?? SSEAlgorithm.AES,
            ...(sseAlgorithm === SSEAlgorithm.KMS ? { kmsMasterKeyId } : {})
          }
        }
      ]
    });
  }
}
