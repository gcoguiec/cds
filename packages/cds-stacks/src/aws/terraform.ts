import type { TerraformMetaArguments } from 'cdktf';
import type { Construct } from 'constructs';

import { TerraformStack } from 'cdktf';
import { S3PrivateBucket, SSEAlgorithm } from '@gcoguiec/cds-constructs';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

export interface AwsTerraformStackConfig extends TerraformMetaArguments {
  readonly bucket: string;
  readonly tags?: Record<string, string>;
}

/**
 * Creates all the necessary resources to host a secure terraform backend on AWS.
 */
export class AwsTerraformStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: AwsTerraformStackConfig) {
    super(scope, id);

    const { bucket } = config;

    const identity = new DataAwsCallerIdentity(this, 'current');

    const tags = {
      Stack: AwsTerraformStack.name,
      Owner: identity.accountId,
      ...config.tags
    };

    const key = new KmsKey(this, 'key', {
      description: `Terraform state '${bucket}' bucket master key.`,
      deletionWindowInDays: 7,
      enableKeyRotation: true,
      tags
    });

    new KmsAlias(this, 'key_alias', {
      name: `alias/terraform-key-${identity.accountId}`,
      targetKeyId: key.arn
    });

    new S3PrivateBucket(this, 'bucket', {
      bucket,
      versioned: true,
      preventDestroy: true,
      sseAlgorithm: SSEAlgorithm.KMS,
      kmsMasterKeyId: key.arn,
      bucketKeyEnabled: true,
      tags: {
        Area: 'terraform',
        StackId: id,
        ...tags
      }
    });
  }
}
