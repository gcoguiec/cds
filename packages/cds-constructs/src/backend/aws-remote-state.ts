import type { TerraformMetaArguments } from 'cdktf';
import { Construct } from 'constructs';

export interface AWSRemoteStateConfig extends TerraformMetaArguments {
  region?: string;
}

/**
 * Creates all the resources necessary to initialize a Terraform backend on AWS.
 */
export class AWSRemoteState extends Construct {
  constructor(scope: Construct, name: string) {
    super(scope, name);
    console.log('remote-state');
  }
}
