import type { S3BucketConfig } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketAcl } from '@cdktf/provider-aws/lib/s3-bucket-acl';
import type { S3BucketCorsConfigurationCorsRule } from '@cdktf/provider-aws/lib/s3-bucket-cors-configuration';
import { S3BucketCorsConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-cors-configuration';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { Construct } from 'constructs';

import { checkS3BucketName } from '../../utils/validation';
import { createForceHTTPSPolicyDocument } from './s3-policies';

export type CDSS3PublicBucketConfig = Pick<
  S3BucketConfig,
  'bucket' | 'bucketPrefix' | 'forceDestroy' | 'provider' | 'tags'
> & {
  versioned?: boolean;
  cors?: Array<S3BucketCorsConfigurationCorsRule>;
  forceTLS?: boolean;
};

export const defaultCORSRule: S3BucketCorsConfigurationCorsRule = {
  allowedHeaders: ['*'],
  allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
  allowedOrigins: ['*'],
  exposeHeaders: [],
  maxAgeSeconds: 3_600
};

/**
 * Creates a read-only public and unencrypted S3 bucket, suitable for hosting
 * static website assets.
 */
export class CDSS3PublicBucket extends Construct {
  constructor(scope: Construct, name: string, config: CDSS3PublicBucketConfig) {
    super(scope, name);

    const {
      bucket,
      bucketPrefix,
      provider,
      tags,
      forceDestroy,
      versioned,
      cors,
      forceTLS
    } = config;

    if (bucket && !checkS3BucketName(bucket)) {
      throw new Error(
        `${CDSS3PublicBucket.name}: '${bucket}' bucket name is invalid.`
      );
    }

    const resource = new S3Bucket(this, 'bucket', {
      bucket,
      bucketPrefix,
      forceDestroy: forceDestroy ?? true,
      tags,
      provider
    });

    new S3BucketAcl(this, 'acl', {
      bucket: resource.id,
      provider,
      acl: 'public-read'
    });

    new S3BucketCorsConfiguration(this, 'cors', {
      bucket: resource.id,
      provider,
      corsRule: cors?.length ? cors : [defaultCORSRule]
    });

    if (forceTLS) {
      const doc = createForceHTTPSPolicyDocument(scope, 'policy_doc', {
        bucket: resource.bucket
      });

      new S3BucketPolicy(this, 'policy', {
        bucket: resource.bucket,
        policy: doc.json,
        provider
      });
    }

    if (versioned) {
      new S3BucketVersioningA(this, 'versioning', {
        bucket: resource.id,
        provider,
        versioningConfiguration: {
          status: 'Enabled'
        }
      });
    }
  }
}
