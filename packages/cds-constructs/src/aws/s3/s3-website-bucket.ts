import type { S3BucketConfig } from '@cdktf/provider-aws/lib/s3-bucket';
import type { S3BucketCorsConfigurationCorsRule } from '@cdktf/provider-aws/lib/s3-bucket-cors-configuration';
import type { S3BucketWebsiteConfigurationRoutingRule } from '@cdktf/provider-aws/lib/s3-bucket-website-configuration';

import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketAcl } from '@cdktf/provider-aws/lib/s3-bucket-acl';
import { S3BucketCorsConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-cors-configuration';
// import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketWebsiteConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-website-configuration';

import { checkS3BucketName } from '../validation';

export type S3WebsiteBucketConfig = Pick<
  S3BucketConfig,
  'bucket' | 'bucketPrefix' | 'forceDestroy' | 'provider' | 'tags'
> & {
  readonly versioned?: boolean;
  readonly cors?: Array<S3BucketCorsConfigurationCorsRule>;
  readonly index?: string;
  readonly errorIndex?: string;
  readonly rules?: Array<S3BucketWebsiteConfigurationRoutingRule>;
};

const defaultCORSRule: S3BucketCorsConfigurationCorsRule = {
  allowedHeaders: ['*'],
  allowedMethods: ['GET', 'HEAD'],
  allowedOrigins: ['*'],
  exposeHeaders: [],
  maxAgeSeconds: 86_400
};

/**
 * Creates a static website bucket with good defaults, suitable for throwable
 * preview builds or static API documentations.
 */
export class S3WebsiteBucket extends Construct {
  constructor(scope: Construct, name: string, config: S3WebsiteBucketConfig) {
    super(scope, name);

    const {
      bucket,
      bucketPrefix,
      provider,
      tags,
      forceDestroy,
      cors,
      index,
      errorIndex,
      rules,
      versioned
    } = config;

    if (bucket && !checkS3BucketName(bucket)) {
      throw new Error(
        `${S3WebsiteBucket.name}: '${bucket}' bucket name is invalid.`
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

    new S3BucketWebsiteConfiguration(this, 'website', {
      bucket: resource.id,
      provider,
      indexDocument: {
        suffix: index ?? 'index.html'
      },
      errorDocument: {
        key: errorIndex ?? 'index.html'
      },
      routingRule: rules
    });

    // const doc = createForceHTTPSPolicyDocument(this, 'policy_doc', {
    //   bucket: resource.bucket
    // });

    // new S3BucketPolicy(this, 'policy', {
    //   bucket: resource.id,
    //   policy: doc.json,
    //   provider
    // });

    if (versioned) {
      new S3BucketVersioningA(this, 'versioning', {
        bucket: resource.id,
        provider,
        versioningConfiguration: {
          status: 'Enabled'
        }
      });
    }

    new TerraformOutput(this, 'bucket_arn', {
      value: resource.arn
    });
  }
}
