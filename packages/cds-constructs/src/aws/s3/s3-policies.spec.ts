// import { Testing } from 'cdktf';
// import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';

// import { SSEAlgorithm } from '..';

// describe('createForceHTTPSPolicyDocument()', () => {
//   const bucket = 'bucket';
//   let synthetized: string;

//   describe('when no policy principals are provided', () => {
//     beforeAll(() => {
//       synthetized = Testing.synthScope(scope => {
//         createForceHTTPSPolicyDocument(scope, 'policy_doc', {
//           bucket
//         });
//       });
//     });

//     it('assigns "*" as principal', () => {
//       expect(synthetized).toHaveDataSourceWithProperties(
//         DataAwsIamPolicyDocument,
//         {
//           statement: [
//             expect.objectContaining({
//               sid: 'ForceTLSRequestsOnly',
//               principals: [{ type: 'AWS', identifiers: ['*'] }]
//             }),
//             expect.objectContaining({
//               sid: 'EnforceTLSv12OrHigher',
//               principals: [{ type: 'AWS', identifiers: ['*'] }]
//             })
//           ]
//         }
//       );
//     });
//   });
// });

// describe('createForceObjectEncryptionPolicyDocument()', () => {
//   const bucket = 'bucket';
//   let synthetized: string;

//   describe('when no policy principals are provided', () => {
//     beforeAll(() => {
//       synthetized = Testing.synthScope(scope => {
//         createForceObjectEncryptionPolicyDocument(scope, 'policy_doc', {
//           bucket,
//           sseAlgorithm: SSEAlgorithm.AES,
//           bucketKeyEnabled: true
//         });
//       });
//     });

//     it('assigns "*" as principal', () => {
//       expect(synthetized).toHaveDataSourceWithProperties(
//         DataAwsIamPolicyDocument,
//         {
//           statement: [
//             expect.objectContaining({
//               sid: 'DenyIncorrectEncryptionHeader',
//               principals: [{ type: 'AWS', identifiers: ['*'] }]
//             }),
//             expect.objectContaining({
//               sid: 'DenyUnencryptedObjectUploads',
//               principals: [{ type: 'AWS', identifiers: ['*'] }]
//             })
//           ]
//         }
//       );
//     });
//   });
// });
