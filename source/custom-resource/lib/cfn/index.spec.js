const axios = require('axios');
const expect = require('chai').expect;
const MockAdapter = require('axios-mock-adapter');

const lambda = require('./index.js');

  const _event = {
    RequestType: "Create",
    ServiceToken: "arn:aws:lambda",
    ResponseURL: "https://cloudformation",
    StackId: "arn:aws:cloudformation",
    RequestId: "1111111",
    LogicalResourceId: "Uuid",
    ResourceType: "Custom::UUID"
  };

  const _context = {
    logStreamName: 'cloudwatch'
  };

  const _responseStatus = 'ok';
  
  const  _responseData = {
    test: 'testing'
  };

  describe('#CFN RESONSE::',() => {

    it('should return "200" on a send cfn response sucess', async () => {

  		let mock = new MockAdapter(axios);
  		mock.onPut().reply(200, {});

  		lambda.send(_event,_context, _responseStatus, _responseData, (err, res) => {
  				expect(res.status).to.equal(200);
  		});
  	});

    it('should return "Network Error" on connection timedout', async () => {

      let mock = new MockAdapter(axios);
      mock.onPut().networkError();

      await lambda.send(_event,_context, _responseStatus, _responseData).catch(err => {
        expect(err.toString()).to.equal("Error: Network Error");
      });
    });

});
