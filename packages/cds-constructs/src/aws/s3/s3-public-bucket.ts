import type { DataAwsIamPolicyDocumentStatement } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import type { S3BucketConfig } from '@cdktf/provider-aws/lib/s3-bucket';
import type { S3BucketCorsConfigurationCorsRule } from '@cdktf/provider-aws/lib/s3-bucket-cors-configuration';

import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketCorsConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-cors-configuration';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';

import { checkS3BucketName } from '../validation';
import {
  createAllowPublicGetObjectStatement,
  createEnforceTLSv12OrHigherStatement,
  createForceTLSRequestsOnlyStatement
} from './s3-policies';

export type S3PublicBucketConfig = Pick<
  S3BucketConfig,
  'bucket' | 'bucketPrefix' | 'forceDestroy' | 'provider' | 'tags'
> & {
  readonly versioned?: boolean;
  readonly cors?: Array<S3BucketCorsConfigurationCorsRule>;
  readonly forceTLS?: boolean;
};

const defaultCORSRule: S3BucketCorsConfigurationCorsRule = {
  allowedHeaders: ['*'],
  allowedMethods: ['GET', 'HEAD'],
  allowedOrigins: ['*'],
  exposeHeaders: [],
  maxAgeSeconds: 3_600
};

/**
 * Creates a read-only public and unencrypted S3 bucket, suitable for hosting
 * static website assets.
 */
export class S3PublicBucket extends Construct {
  constructor(scope: Construct, name: string, config: S3PublicBucketConfig) {
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

    const statement: DataAwsIamPolicyDocumentStatement[] = [];

    if (bucket && !checkS3BucketName(bucket)) {
      throw new Error(
        `${S3PublicBucket.name}: '${bucket}' bucket name is invalid.`
      );
    }

    const resource = new S3Bucket(this, 'bucket', {
      bucket,
      bucketPrefix,
      forceDestroy: forceDestroy ?? true,
      tags,
      provider
    });

    statement.push(createAllowPublicGetObjectStatement(resource.arn));

    new S3BucketCorsConfiguration(this, 'cors', {
      bucket: resource.id,
      provider,
      corsRule: cors?.length ? cors : [defaultCORSRule]
    });

    if (forceTLS) {
      statement.push(
        createForceTLSRequestsOnlyStatement(resource.arn),
        createEnforceTLSv12OrHigherStatement(resource.arn)
      );
    }

    if (versioned) {
      new S3BucketVersioningA(this, 'versioning', {
        bucket: resource.id,
        provider,
        versioningConfiguration: {
          status: 'Enabled'
        }
      });

      // @TODO: lifecyle
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

    new TerraformOutput(this, 'bucket_arn', {
      value: resource.arn
    });
  }
}
