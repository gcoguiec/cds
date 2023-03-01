import type { TerraformMetaArguments } from 'cdktf';
import type { Construct } from 'constructs';

import { TerraformStack } from 'cdktf';
import { S3PrivateBucket } from '@gcoguiec/cds-constructs';

export interface AwsTerraformStackConfig extends TerraformMetaArguments {
  readonly bucket?: string;
}

/**
 * Creates all the necessary resources to host a secure terraform backend on AWS.
 */
export class AwsTerraformStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: AwsTerraformStackConfig) {
    super(scope, id);

    const { bucket } = config;

    new S3PrivateBucket(this, 'bucket', {
      bucket: bucket ?? 'terraform-state',
      versioned: true,
      preventDestroy: true
    });
  }
}
