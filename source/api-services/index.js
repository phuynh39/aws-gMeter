const scenarios = require('./lib/scenarios/');

exports.handler = async (event) => {

    console.log(JSON.stringify(event, null, 2));

    const resource = event.resource;
    const method = event.httpMethod;
    const config = JSON.parse(event.body);
    const errMsg = `Method: ${method} not supported for this resource: ${resource} `;

    let testId;
    let data;
    let response = {
        headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept"
        },
        statusCode: 200,
    };

    try {

        switch (resource) {

            case '/scenarios':
                switch (method) {
                    case 'GET':
                        data = await scenarios.listTests();
                        break;
                    case 'POST':
                        data = await scenarios.createTest(config);
                        break;
                    default:
                        throw new Error(errMsg);
                }
                break;

            case '/scenarios/{testId}':

                testId = event.pathParameters.testId;

                switch (method) {
                    case 'GET':
                        data = await scenarios.getTest(testId);
                        break;
                    case 'POST':
                        data = await scenarios.cancelTest(testId);
                        break;
                    case 'DELETE':
                        data = await scenarios.deleteTest(testId);
                        break;
                    default:
                        throw new Error(errMsg);
                }
                break;
            
            case '/tasks':
                switch (method) {
                    case 'GET':
                        data = await scenarios.listTasks();
                        break;
                    default:
                        throw new Error(errMsg);
                }
                break;
            default:
                throw new Error(errMsg);
        }

        response.body = JSON.stringify(data);

    } catch (err) {
        console.log(err);
        response.body = err.toString();
        response.statusCode = 400;
    }

    console.log(response);
    return response;
};
