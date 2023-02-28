import type { S3BucketConfig } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketAcl } from '@cdktf/provider-aws/lib/s3-bucket-acl';
import type { S3BucketCorsConfigurationCorsRule } from '@cdktf/provider-aws/lib/s3-bucket-cors-configuration';
import { S3BucketCorsConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-cors-configuration';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketWebsiteConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-website-configuration';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

import { checkS3BucketName } from '../../utils/validation';
import { createForceHTTPSPolicyDocument } from './s3-policies';

export type CDSS3WebsiteBucketConfig = Pick<
  S3BucketConfig,
  'bucket' | 'bucketPrefix' | 'forceDestroy' | 'provider' | 'tags'
> & {
  readonly cors?: Array<S3BucketCorsConfigurationCorsRule>;
};

export const defaultCORSRule: S3BucketCorsConfigurationCorsRule = {
  allowedHeaders: ['*'],
  allowedMethods: ['GET', 'HEAD'],
  allowedOrigins: ['*'],
  exposeHeaders: [],
  maxAgeSeconds: 86_400
};

/**
 * Creates a static website bucket with good defaults, suitable for throwable
 * preview builds.
 */
export class CDSS3WebsiteBucket extends Construct {
  constructor(
    scope: Construct,
    name: string,
    config: CDSS3WebsiteBucketConfig
  ) {
    super(scope, name);

    const { bucket, bucketPrefix, provider, tags, forceDestroy, cors } = config;

    if (bucket && !checkS3BucketName(bucket)) {
      throw new Error(
        `${CDSS3WebsiteBucket.name}: '${bucket}' bucket name is invalid.`
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

    const doc = createForceHTTPSPolicyDocument(this, 'policy_doc', {
      bucket: resource.bucket
    });

    new S3BucketWebsiteConfiguration(this, 'website', {
      bucket: resource.id,
      provider,
      errorDocument: {
        key: 'index.html'
      },
      indexDocument: {
        suffix: 'index.html'
      }
    });

    new S3BucketPolicy(this, 'policy', {
      bucket: resource.id,
      policy: doc.json,
      provider
    });

    new TerraformOutput(this, 'bucket_arn', {
      value: resource.arn
    });
  }
}