import { checkIpv4, checkS3BucketName } from './validation';

describe('checkIpv4()', () => {
  describe('when address is valid', () => {
    const pool = [
      '0.0.0.0',
      '8.8.8.8',
      '127.0.0.1',
      '100.100.100.100',
      '192.168.0.1',
      '18.101.25.153',
      '123.23.34.2',
      '172.26.168.134',
      '212.58.241.131',
      '128.0.0.0',
      '23.71.254.72',
      '223.255.255.255',
      '192.0.2.235',
      '99.198.122.146',
      '46.51.197.88',
      '173.194.34.134'
    ];

    it('returns true', () => {
      for (const address of pool) {
        expect(checkIpv4(address)).toBe(true);
      }
    });
  });

  describe('when address is not valid', () => {
    const pool = [
      '256.0.0.0',
      '192.168.1.256',
      '300.0.0.0',
      '127.0.0.01',
      '10.10.10.10.',
      '172.16.256.1',
      '192.168.257.1',
      '0.0.0.0.0',
      '1.2.3.4.5',
      '192.168.1.0/24',
      '192.168.1.256/24',
      '256.256.256.256',
      '192.168.1.300',
      '192.168.1.256/16'
    ];

    it('returns false', () => {
      for (const address of pool) {
        expect(checkIpv4(address)).toBe(false);
      }
    });
  });
});

describe('checkS3BucketName()', () => {
  it('must be between 3 (min) and 63 (max) characters long', () => {
    expect(checkS3BucketName('a')).toBe(false);
    expect(checkS3BucketName('a'.repeat(2))).toBe(false);
    expect(checkS3BucketName('a'.repeat(3))).toBe(true);
    expect(checkS3BucketName('a'.repeat(63))).toBe(true);
    expect(checkS3BucketName('a'.repeat(64))).toBe(false);
  });

  it('consists only of lowercase letters, numbers, dots (.), and hyphens (-)', () => {
    expect(checkS3BucketName('Abc123')).toBe(false);
    expect(checkS3BucketName('my_bucket')).toBe(false);
    expect(checkS3BucketName('a.b.c')).toBe(true);
    expect(checkS3BucketName('a-b-c')).toBe(true);
  });

  it('begins and end with a letter or number', () => {
    expect(checkS3BucketName('-abc')).toBe(false);
    expect(checkS3BucketName('abc-')).toBe(false);
    expect(checkS3BucketName('.abc')).toBe(false);
    expect(checkS3BucketName('abc.')).toBe(false);
    expect(checkS3BucketName('abc')).toBe(true);
    expect(checkS3BucketName('1abc')).toBe(true);
    expect(checkS3BucketName('abc1')).toBe(true);
  });

  it('cannot contain two adjacent periods', () => {
    expect(checkS3BucketName('a..c')).toBe(false);
  });

  it('cannot contain an IP address', () => {
    expect(checkS3BucketName('192.168.1.3')).toBe(false);
    expect(checkS3BucketName('172.16.16.1')).toBe(false);
    expect(checkS3BucketName('10.0.1.1')).toBe(false);
  });

  it('cannot start with `xn--` prefix', () => {
    expect(checkS3BucketName('xn--foo')).toBe(false);
  });

  it('cannot end with `-s3alias` suffix', () => {
    expect(checkS3BucketName('foo-s3alias')).toBe(false);
  });

  ['docexamplebucket1', 'log-delivery-march-2020', 'my-hosted-content'].forEach(
    name => {
      it(`'${name}' bucket name checks true`, () => {
        expect(checkS3BucketName(name)).toBe(true);
      });
    }
  );

  ['doc_example_bucket', 'DocExampleBucket', 'doc-example-bucket-'].forEach(
    name => {
      it(`'${name}' bucket name checks false`, () => {
        expect(checkS3BucketName(name)).toBe(false);
      });
    }
  );
});
