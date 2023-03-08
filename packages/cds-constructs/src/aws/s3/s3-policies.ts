import type { SSEAlgorithm } from '..';
import type {
  DataAwsIamPolicyDocumentStatement,
  DataAwsIamPolicyDocumentStatementPrincipals
} from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';

import { hasArnService } from '../arn';

export interface S3IamPolicyStatementOptions {
  readonly principals?: DataAwsIamPolicyDocumentStatementPrincipals[];
}

export type CreateAllowPublicGetObjectStatementOptions =
  S3IamPolicyStatementOptions;

export function createAllowPublicGetObjectStatement(
  bucketArn: string,
  options: CreateAllowPublicGetObjectStatementOptions = {}
): DataAwsIamPolicyDocumentStatement {
  if (!hasArnService(bucketArn, 's3')) {
    throw new Error(
      'AllowPublicGetObject requires an ARN for a S3 bucket resource.'
    );
  }
  if (bucketArn.endsWith('/*')) {
    throw new Error(
      'AllowPublicGetObject ARN must not end with a slash wildcard (`/*`).'
    );
  }
  const { principals } = options;
  return {
    sid: 'AllowPublicGetObject',
    effect: 'Allow',
    actions: ['s3:GetObject'],
    principals: principals ?? [
      {
        type: 'AWS',
        identifiers: ['*']
      }
    ],
    resources: [`${bucketArn}/*`]
  };
}

export type CreateForceTLSRequestOnlyStatementOptions =
  S3IamPolicyStatementOptions;

export function createForceTLSRequestsOnlyStatement(
  bucketArn: string,
  options: CreateForceTLSRequestOnlyStatementOptions = {}
): DataAwsIamPolicyDocumentStatement {
  if (!hasArnService(bucketArn, 's3')) {
    throw new Error(
      'ForceTLSRequestsOnly requires an ARN for a S3 bucket resource.'
    );
  }
  if (bucketArn.endsWith('/*')) {
    throw new Error(
      'ForceTLSRequestsOnly ARN must not end with a slash wildcard (`/*`).'
    );
  }
  const { principals } = options;
  return {
    sid: 'ForceTLSRequestsOnly',
    effect: 'Deny',
    actions: ['s3:*'],
    principals: principals ?? [
      {
        type: 'AWS',
        identifiers: ['*']
      }
    ],
    resources: [bucketArn, `${bucketArn}/*`],
    condition: [
      {
        test: 'Bool',
        variable: 'aws:SecureTransport',
        values: ['false']
      }
    ]
  };
}

export type CreateEnforceTLSv12OrHigherStatementOptions =
  S3IamPolicyStatementOptions;

export function createEnforceTLSv12OrHigherStatement(
  bucketArn: string,
  options: CreateEnforceTLSv12OrHigherStatementOptions = {}
): DataAwsIamPolicyDocumentStatement {
  if (!hasArnService(bucketArn, 's3')) {
    throw new Error(
      'EnforceTLSv12OrHigher requires an ARN for a S3 bucket resource.'
    );
  }
  if (bucketArn.endsWith('/*')) {
    throw new Error(
      'EnforceTLSv12OrHigher ARN must not end with a slash wildcard (`/*`).'
    );
  }
  const { principals } = options;
  return {
    sid: 'EnforceTLSv12OrHigher',
    effect: 'Deny',
    actions: ['s3:*'],
    principals: principals ?? [
      {
        type: 'AWS',
        identifiers: ['*']
      }
    ],
    resources: [bucketArn, `${bucketArn}/*`],
    condition: [
      {
        test: 'NumericLessThan',
        variable: 's3:TlsVersion',
        values: ['1.2']
      }
    ]
  };
}

export type CreateDenyIncorrectEncryptionHeaderStatementOptions =
  S3IamPolicyStatementOptions;

export function createDenyIncorrectEncryptionHeaderStatement(
  bucketArn: string,
  sseAlgorithm: SSEAlgorithm,
  options: CreateDenyIncorrectEncryptionHeaderStatementOptions = {}
): DataAwsIamPolicyDocumentStatement {
  if (!hasArnService(bucketArn, 's3')) {
    throw new Error(
      'DenyIncorrectEncryptionHeader requires an ARN for a S3 bucket resource.'
    );
  }
  if (bucketArn.endsWith('/*')) {
    throw new Error(
      'DenyIncorrectEncryptionHeader ARN must not end with a slash wildcard (`/*`).'
    );
  }
  const { principals } = options;
  return {
    sid: 'DenyIncorrectEncryptionHeader',
    effect: 'Deny',
    actions: ['s3:PutObject'],
    principals: principals ?? [
      {
        type: 'AWS',
        identifiers: ['*']
      }
    ],
    resources: [`${bucketArn}/*`],
    condition: [
      {
        test: 'StringNotEquals',
        variable: 's3:x-amz-server-side-encryption',
        values: [sseAlgorithm]
      }
    ]
  };
}

export type CreateDenyUnencryptedObjectUploadsStatementOptions =
  S3IamPolicyStatementOptions;

export function createDenyUnencryptedObjectUploadsStatement(
  bucketArn: string,
  options: CreateDenyUnencryptedObjectUploadsStatementOptions = {}
): DataAwsIamPolicyDocumentStatement {
  if (!hasArnService(bucketArn, 's3')) {
    throw new Error(
      'DenyUnencryptedObjectUploads requires an ARN for a S3 bucket resource.'
    );
  }
  if (bucketArn.endsWith('/*')) {
    throw new Error(
      'DenyUnencryptedObjectUploads ARN must not end with a slash wildcard (`/*`).'
    );
  }
  const { principals } = options;
  return {
    sid: 'DenyUnencryptedObjectUploads',
    effect: 'Deny',
    actions: ['s3:PutObject'],
    principals: principals ?? [
      {
        type: 'AWS',
        identifiers: ['*']
      }
    ],
    resources: [`${bucketArn}/*`],
    condition: [
      {
        test: 'Null',
        variable: 's3:x-amz-server-side-encryption',
        values: ['true']
      }
    ]
  };
}

export type CreateDenyBucketKeylessUploadsStatementOptions =
  S3IamPolicyStatementOptions;

export function createCreateDenyBucketKeylessUploadsStatement(
  bucketArn: string,
  options: CreateDenyBucketKeylessUploadsStatementOptions = {}
): DataAwsIamPolicyDocumentStatement {
  if (!hasArnService(bucketArn, 's3')) {
    throw new Error(
      'DenyBucketKeylessUploads requires an ARN for a S3 bucket resource.'
    );
  }
  if (bucketArn.endsWith('/*')) {
    throw new Error(
      'DenyBucketKeylessUploads ARN must not end with a slash wildcard (`/*`).'
    );
  }
  const { principals } = options;
  return {
    sid: 'DenyBucketKeylessUploads',
    effect: 'Deny',
    actions: ['s3:PutObject'],
    principals: principals ?? [
      {
        type: 'AWS',
        identifiers: ['*']
      }
    ],
    resources: [`${bucketArn}/*`],
    condition: [
      {
        test: 'Null',
        variable: 's3:x-amz-server-side-encryption-bucket-key-enabled',
        values: ['true']
      }
    ]
  };
}

export function createAllowLoggingServiceStatement(
  bucketArn: string,
  accountId: string,
  logPrefix: string
): DataAwsIamPolicyDocumentStatement {
  if (!hasArnService(bucketArn, 's3')) {
    throw new Error(
      'AllowLoggingService requires an ARN for a S3 bucket resource.'
    );
  }
  if (bucketArn.endsWith('/*')) {
    throw new Error(
      'AllowLoggingService ARN must not end with a slash wildcard (`/*`).'
    );
  }
  return {
    sid: 'AllowLoggingService',
    effect: 'Allow',
    actions: ['s3:PutObject'],
    principals: [
      {
        type: 'Service',
        identifiers: ['logging.s3.amazonaws.com']
      }
    ],
    resources: [
      `${bucketArn}${
        logPrefix.endsWith('/') ? logPrefix.slice(0, -1) : logPrefix
      }/*`
    ],
    condition: [
      {
        test: 'ArnLike',
        variable: 'aws:SourceArn',
        values: [bucketArn]
      },
      {
        test: 'StringEquals',
        variable: 'aws:SourceAccount',
        values: [accountId]
      }
    ]
  };
}
