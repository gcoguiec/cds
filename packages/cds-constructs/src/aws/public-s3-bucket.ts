import type { S3BucketConfig } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import type { S3BucketCorsConfigurationCorsRule } from '@cdktf/provider-aws/lib/s3-bucket-cors-configuration';
import { S3BucketCorsConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-cors-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { Construct } from 'constructs';

import { checkS3BucketName } from '../utils/validation';

export type CDSPublicS3BucketConfig = Pick<
  S3BucketConfig,
  'bucket' | 'provider' | 'tags'
> & {
  versioned?: boolean;
  cors?: Array<S3BucketCorsConfigurationCorsRule>;
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
export class CDSPublicS3Bucket extends Construct {
  constructor(scope: Construct, name: string, config: CDSPublicS3BucketConfig) {
    super(scope, name);

    const { bucket, provider, tags, versioned, cors } = config;

    if (bucket && !checkS3BucketName(bucket)) {
      throw new Error(
        `${CDSPublicS3Bucket.name}: '${bucket}' bucket name is invalid.`
      );
    }

    const resource = new S3Bucket(this, 'bucket', {
      bucket,
      tags,
      provider
    });

    new S3BucketCorsConfiguration(this, 'cors', {
      bucket: resource.id,
      corsRule: cors?.length ? cors : [defaultCORSRule]
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
  }
}
