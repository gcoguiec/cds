export const ARN_SECTIONS_LENGTH = 6;
export const ARN_SECTION_DELIMITER = ':';

export interface ARN {
  readonly partition?: string;
  readonly service?: string;
  readonly region?: string;
  readonly accountId?: string;
  readonly resource?: string;
}

export class ArnError extends Error {
  constructor(message: string) {
    super(`Invalid ARN: ${message}

An ARN string representation must follow the general formats:
  - arn:partition:service:resource-type/resource-id
  - arn:partition:service:region:account-id:resource-id
  - arn:partition:service:region:account-id:resource-type/resource-id
  - arn:partition:service:region:account-id:resource-type:resource-id

More at https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html
    `);
  }
}

export function parseArn(value: string): ARN {
  if (!value.startsWith('arn:')) {
    throw new ArnError('Prefix is missing.');
  }

  const parts = value.split(ARN_SECTION_DELIMITER);
  const sections = [
    ...parts.splice(0, ARN_SECTIONS_LENGTH - 1),
    parts.join(ARN_SECTION_DELIMITER)
  ];

  if (sections.length !== ARN_SECTIONS_LENGTH) {
    throw new ArnError(`Wrong number of sections.`);
  }

  const [, partition, service, region, accountId, resource] = sections;
  return {
    partition,
    service,
    region,
    accountId,
    resource
  };
}

export function isArn(value: string): boolean {
  try {
    parseArn(value);
    return true;
  } catch (error) {
    if (error instanceof ArnError) {
      return false;
    }
    throw error;
  }
}

export function hasArnService(value: string, service: string): boolean {
  return parseArn(value).service === service;
}
