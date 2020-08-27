const assert = require('chai').assert;
const expect = require('chai').expect;
const path = require('path');

let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

const lambda = require('./index.js');

describe('#S3::', () => {

	afterEach(() => {
    AWS.restore('S3');
	});

	it('should return "success" on putNotification sucess', async () => {

		AWS.mock('S3', 'putBucketNotificationConfiguration', Promise.resolve());

    let response = await lambda.putNotification('bucket','lambdaArn')
    expect(response).to.equal('success');
	});

  it('should return "ERROR" on putNotification failure', async () => {

    AWS.mock('S3', 'putBucketNotificationConfiguration', Promise.reject('ERROR'));

    await lambda.putNotification('bucket','lambdaArn').catch(err => {
      expect(err).to.equal('ERROR');
    });
  });

  it('should return "success" on copyAssets sucess', async () => {

    let data = {Body:"[\"console/file1\",\"console/file2\"]"};
    let resp = {};

    AWS.mock('S3', 'getObject', Promise.resolve(data));
    AWS.mock('S3', 'copyObject', Promise.resolve(resp));

    let response = await lambda.copyAssets('srcBucket', 'srcPath', 'manifestFile', 'destBucket')
    expect(response).to.equal('success');
	});

  it('should return "ERROR" on copyAssets failure', async () => {

    AWS.mock('S3', 'getObject', Promise.reject('ERROR'));

    await lambda.copyAssets('srcBucket', 'srcPath', 'manifestFile', 'destBucket').catch(err => {
      expect(err).to.equal('ERROR');
    });
  });

  it('should return "success" on ConfigFile sucess', async () => {

    let file = "configfile";

    AWS.mock('S3', 'putObject', Promise.resolve());

    let response = await lambda.configFile('file', 'destBucket')
    expect(response).to.equal('success');
	});

  it('should return "ERROR" on ConfigFile failure', async () => {

    AWS.mock('S3', 'putObject', Promise.reject('ERROR'));

    await lambda.configFile('file', 'destBucket').catch(err => {
      expect(err).to.equal('ERROR');
    });
  });

});
