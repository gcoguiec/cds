import type { SSEAlgorithm } from '..';
import type { DataAwsIamPolicyDocumentStatementPrincipals } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import type { TerraformMetaArguments } from 'cdktf';
import type { Construct } from 'constructs';

import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';

export interface S3PolicyDocumentConfig extends TerraformMetaArguments {
  readonly bucket: string;
  readonly principals?: Array<DataAwsIamPolicyDocumentStatementPrincipals>;
}

export function createForceHTTPSPolicyDocument(
  scope: Construct,
  name: string,
  config: S3PolicyDocumentConfig
): DataAwsIamPolicyDocument {
  const { bucket, provider, principals } = config;

  return new DataAwsIamPolicyDocument(scope, name, {
    provider,
    version: '2012-10-17',
    statement: [
      {
        sid: 'ForceTLSRequestsOnly',
        effect: 'Deny',
        actions: ['s3:*'],
        principals: principals?.length
          ? principals
          : [
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
        principals: principals?.length
          ? principals
          : [
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

export function createForceObjectEncryptionPolicyDocument(
  scope: Construct,
  name: string,
  config: S3PolicyDocumentConfig & { sseAlgorithm: SSEAlgorithm }
): DataAwsIamPolicyDocument {
  const { bucket, provider, principals, sseAlgorithm } = config;

  return new DataAwsIamPolicyDocument(scope, name, {
    provider,
    version: '2012-10-17',
    statement: [
      {
        sid: 'DenyIncorrectEncryptionHeader',
        effect: 'Deny',
        actions: ['s3:PutObject'],
        principals: principals?.length
          ? principals
          : [
              {
                type: 'AWS',
                identifiers: ['*']
              }
            ],
        resources: [`arn:aws:s3:::${bucket}/*`],
        condition: [
          {
            test: 'StringNotEquals',
            variable: 's3:x-amz-server-side-encryption',
            values: [sseAlgorithm]
          }
        ]
      },
      {
        sid: 'DenyUnencryptedObjectUploads',
        effect: 'Deny',
        actions: ['s3:PutObject'],
        principals: principals?.length
          ? principals
          : [
              {
                type: 'AWS',
                identifiers: ['*']
              }
            ],
        resources: [`arn:aws:s3:::${bucket}/*`],
        condition: [
          {
            test: 'Null',
            variable: 's3:x-amz-server-side-encryption',
            values: ['true']
          }
        ]
      }
    ]
  });
}
