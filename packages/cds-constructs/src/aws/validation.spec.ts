import { checkS3BucketName } from './validation';

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
