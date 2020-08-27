const expect = require('chai').expect;
const path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

const lambda = require('../index.js');

const event = {
	"Records": [
	  {
		"body": "{\"testId\":\"5Q106Tg\",\"taskCount\":\"5\"}",
	  }
	]
  }


process.env.SCENARIOS_BUCKET = 'bucket';
process.env.TASK_DEFINITION = 'task';


describe('#TASK RUNNER:: ', () => {

    afterEach(() => {
        AWS.restore('ECS');
    });

	//Possitive tests
    it('should return "SUCCESS" when "RUNTASK" returns success', async () => {
  		AWS.mock('ECS', 'runTask', Promise.resolve());

		const response = await lambda.handler(event)
		expect(response).to.equal('success');
	});

	//Negative Tests
    it('should return "ECS ERROR" when "RUNTASK" fails', async () => {
        AWS.mock('ECS', 'runTask', Promise.reject('ECS ERROR'));
		AWS.mock('DynamoDB.DocumentClient', 'update', Promise.resolve());

		await lambda.handler(event).catch(err => {
			expect(err).to.equal('ECS ERROR');
		});
	});

});
