import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import type { TerraformMetaArguments } from 'cdktf';
import type { Construct } from 'constructs';

export interface ForceTLSv12OrHigherDataPolicyConfig
  extends TerraformMetaArguments {
  bucket: string;
}

export function createForceHTTPSPolicyDocument(
  scope: Construct,
  name: string,
  config: ForceTLSv12OrHigherDataPolicyConfig
): DataAwsIamPolicyDocument {
  const { bucket, provider } = config;
  return new DataAwsIamPolicyDocument(scope, name, {
    provider,
    version: '2012-10-17',
    statement: [
      {
        sid: 'ForceTLSRequestsOnly',
        effect: 'Deny',
        actions: ['s3:*'],
        principals: [
          {
            type: 'AWS',
            identifiers: ['*']
          }
        ],
        resources: [`arn:aws:s3:::${bucket}`, `arn:aws:s3:::${bucket}/*`],
        condition: [
          {
            test: 'Bool',
            variable: 'aws:SecureTransport',
            values: ['false']
          }
        ]
      },
      {
        sid: 'EnforceTLSv12OrHigher',
        effect: 'Deny',
        actions: ['s3:*'],
        principals: [
          {
            type: 'AWS',
            identifiers: ['*']
          }
        ],
        resources: [`arn:aws:s3:::${bucket}`, `arn:aws:s3:::${bucket}/*`],
        condition: [
          {
            test: 'NumericLessThan',
            variable: 's3:TlsVersion',
            values: ['1.2']
          }
        ]
      }
    ]
  });
}
