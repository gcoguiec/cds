import { ArnError, parseArn } from './arn';

describe('parseArn()', () => {
  describe('when providing an ARN with a missing prefix', () => {
    const arnStr = 'aws:s3:::bucket';

    it('throws an error', () => {
      expect(() => parseArn(arnStr)).toThrowError(
        new ArnError('Prefix is missing.')
      );
    });
  });

  describe('when providing an ARN that does have all the sections', () => {
    const arnStr = 'arn:aws:s3:bucket';

    it('throws an error', () => {
      expect(() => parseArn(arnStr)).toThrowError(
        new ArnError('Wrong number of sections.')
      );
    });
  });

  describe('when ARN only has partition, service and resource fields', () => {
    const arnStr = 'arn:aws:s3:::bucket/picture.jpg';

    it('returns a partially mapped ARN object', () => {
      const arn = parseArn(arnStr);
      expect(arn).toStrictEqual({
        partition: 'aws',
        service: 's3',
        region: '',
        accountId: '',
        resource: 'bucket/picture.jpg'
      });
    });
  });

  describe('when ARN has all its sections', () => {
    const uuts = [
      'arn:aws:elasticbeanstalk:us-east-1:123456789012:environment/my-app',
      'arn:aws:iam::123456789012:user/User',
      'arn:aws:rds:eu-west-1:123456789012:db:mysql-db'
    ];

    const expected = [
      {
        partition: 'aws',
        service: 'elasticbeanstalk',
        region: 'us-east-1',
        accountId: '123456789012',
        resource: 'environment/my-app'
      },
      {
        partition: 'aws',
        service: 'iam',
        region: '',
        accountId: '123456789012',
        resource: 'user/User'
      },
      {
        partition: 'aws',
        service: 'rds',
        region: 'eu-west-1',
        accountId: '123456789012',
        resource: 'db:mysql-db'
      }
    ];

    it('returns a completely mapped ARN object', () => {
      for (const [index, arnStr] of uuts.entries()) {
        const arn = parseArn(arnStr);
        expect(arn).toStrictEqual(expected[index]);
      }
    });
  });
});
