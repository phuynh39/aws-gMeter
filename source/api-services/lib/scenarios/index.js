const AWS = require('aws-sdk');
const moment = require('moment');
const shortid = require('shortid');
const jmx = require('./jmx_builder');

AWS.config.logger = console;


/** 
 * @function listTests 
 * Description: returns a consolidated list of test scenarios 
 */
const listTests = async () => {

    const dynamoDB = new AWS.DynamoDB.DocumentClient({
        region: process.env.AWS_REGION
    });

    let data;

    try {

        console.log('List tests');

        const params = {
            TableName: process.env.SCENARIOS_TABLE,
            AttributesToGet: [
                'testId',
                'testName',
                'testDescription',
                'status',
                'startTime'
            ],
        };
        data = await dynamoDB.scan(params).promise();
    } catch (err) {
        throw err;
    }
    return data;
};


/** 
 * @function createTest 
 * Description: returns a consolidated list of test scenarios 
 * @testId {string} Id for the test (if a new test value is null) 
 * @config {object} test scenario configuration 
 */
const createTest = async (config) => {

    const s3 = new AWS.S3();
    const dynamo = new AWS.DynamoDB.DocumentClient({
        region: process.env.AWS_REGION
    });
    const sqs = new AWS.SQS({
        region: process.env.AWS_REGION
    });

    let params;
    let data;

    try {

        console.log(`Create test: ${JSON.stringify(config, null, 2)}`);

        const testName = config.testName;
        const testDescription = config.testDescription;
        const testScenario = config.testScenario;
        const testgRPCConfig = config.testgRPCConfig;
        const testProtobufFile = config.testProtobufFile;
        const taskCount = config.taskCount;
        const startTime = moment().utc().format('YYYY-MM-DD HH:mm:ss');

        // Add reporting to Test Scenario so that the end results are export to 
        // Amazon s3 by each task. 
        testScenario.reporting = [
            {
                "module": "final-stats",
                "summary": true,
                "percentiles": true,
                "summary-labels": true,
                "test-duration": true,
                "dump-xml": "/tmp/artifacts/results.xml"
            },
        ];

        console.log('TEST:: ', JSON.stringify(testScenario, null, 2));

        //1. Check for a testId delete any old records from the results table 
        let testId;

        if (config.testId) {
            testId = config.testId;

            params = {
                TableName: process.env.RESULTS_TABLE,
                FilterExpression: 'testId = :id',
                ExpressionAttributeValues: {
                    ':id': testId
                }
            };
            data = await dynamo.scan(params).promise();

            if (data.Items.length !== 0) {

                for (let i in data.Items) {
                    params = {
                        TableName: process.env.RESULTS_TABLE,
                        Key: {
                            uuid: data.Items[i].uuid
                        }
                    };
                    await dynamo.delete(params).promise();
                }
            }
        } else {
            testId = shortid.generate();
        }

        //2. Write test scenario to S3
        // Write gRPC-test.jmx file to S3
        // Write the upload proto file to S3
        params = {
            Body: JSON.stringify(testScenario),
            Bucket: process.env.SCENARIOS_BUCKET,
            Key: `test-scenarios/${testId}/test_config.json`
        };
        await s3.putObject(params).promise();
        console.log(`test scenario upoladed to s3: test-scenarios/${testId}/test_config.json`);

        const gRPCTestJMX = await jmx.buildJMX(testgRPCConfig);
        params = {
            Body: gRPCTestJMX,
            Bucket: process.env.SCENARIOS_BUCKET,
            Key: `test-scenarios/${testId}/gRPC_test.jmx`
        };
        await s3.putObject(params).promise();
        console.log(`test gRPCConfig upoladed to s3: test-scenarios/${testId}/gRPC_test.jmx`);

        params = {
            Body: testProtobufFile,
            Bucket: process.env.SCENARIOS_BUCKET,
            Key: `test-scenarios/${testId}/test.proto`
        };
        await s3.putObject(params).promise();
        console.log(`test protobuf file upoladed to s3: test-scenarios/${testId}/test.proto`);

        //3. Send id and task count to SQS
        params = {
            MessageBody: JSON.stringify({ testId: testId, taskCount: taskCount }),
            QueueUrl: process.env.SQS_URL
        };
        await sqs.sendMessage(params).promise();

        //4. Update DynamoDB. values for history, taskIds and endTime are used to remove the old data. 
        params = {
            TableName: process.env.SCENARIOS_TABLE,
            Key: {
                testId: testId
            },
            UpdateExpression: 'set #n = :n, #d = :d, #c = :c, #t = :t, #g = :g, #p = :p, #s = :s, #r = :r, #i=:i, #st = :st, #et = :et',
            ExpressionAttributeNames: {
                '#n': 'testName',
                '#d': 'testDescription',
                '#c': 'taskCount',
                '#t': 'testScenario',
                '#g': 'testgRPCConfig',
                '#p': 'testProtobufFile',
                '#s': 'status',
                '#r': 'results',
                '#i': 'taskIds',
                '#st': 'startTime',
                '#et': 'endTime'
            },
            ExpressionAttributeValues: {
                ':n': testName,
                ':d': testDescription,
                ':c': taskCount,
                ':t': JSON.stringify(testScenario),
                ':g': JSON.stringify(testgRPCConfig),
                ':p': testProtobufFile,
                ':s': 'running',
                ":r": {},
                ":i": [],
                ':st': startTime,
                ':et': 'running'
            },
            ReturnValues: 'ALL_NEW'
        };
        data = await dynamo.update(params).promise();

        console.log(`Create test complete: ${data}`);

    } catch (err) {
        throw err;
    }
    return data.Attributes;
};


/** 
 * @function getTest 
 * Description: returns all data related to a specific testId 
 * @testId {string} the unique id of test scenario to return. 
 */
const getTest = async (testId) => {

    const dynamoDB = new AWS.DynamoDB.DocumentClient({
        region: process.env.AWS_REGION
    });
    const cloudwatch = new AWS.CloudWatch({
        region: process.env.AWS_REGION
    });
    const ecs = new AWS.ECS({
        region: process.env.AWS_REGION
    });

    let data;

    try {

        console.log(`Get test details for testId: ${testId}`);

        let params = {
            TableName: process.env.SCENARIOS_TABLE,
            Key: {
                testId: testId
            }
        };
        data = await dynamoDB.get(params).promise();
        data = data.Item;
        //covert testSceario back into an object
        data.testScenario = JSON.parse(data.testScenario);
        data.testgRPCConfig = JSON.parse(data.testgRPCConfig);

        if (data.status === 'running') {

            console.log(`testId: ${testId} is still running`);

            //Get list of task for testId 
            data.tasks = [];
            params = {
                cluster: process.env.TASK_CLUSTER
            };

            const tasks = await ecs.listTasks(params).promise();

            //2. check if any running task are associated with the testId 
            if (tasks.taskArns && tasks.taskArns.length != 0) {

                params = {
                    cluster: process.env.TASK_CLUSTER,
                    tasks: tasks.taskArns
                };

                const testTasks = await ecs.describeTasks(params).promise();

                //3. list any tasks associated with the testId 
                for (let i in testTasks.tasks) {

                    if (testTasks.tasks[i].group === testId) {
                        data.tasks.push(testTasks.tasks[i]);
                    }
                }
            }
        }

    } catch (err) {
        throw err;
    }
    return data;
};


/** 
 * @function deleteTest 
 * Description: deletes all data related to a specific testId 
 * @testId {string} the unique id of test scenario to delete 
 * e. 
 */
const deleteTest = async (testId) => {

    const dynamoDB = new AWS.DynamoDB.DocumentClient({
        region: process.env.AWS_REGION
    });

    try {

        console.log(`Delete test, testId: ${testId}`);

        const params = {
            TableName: process.env.SCENARIOS_TABLE,
            Key: {
                testId: testId
            }
        };
        await dynamoDB.delete(params).promise();

    } catch (err) {
        throw err;
    }
    return 'success';
};


/** 
 * @function cancelTest 
 * Description: stop all tasks related to a specific testId 
 * @testId {string} the unique id of test scenario to stop. 
 * e. 
 */
const cancelTest = async (testId) => {

    const dynamo = new AWS.DynamoDB.DocumentClient({
        region: process.env.AWS_REGION
    });

    const ecs = new AWS.ECS({
        region: process.env.AWS_REGION
    });

    let data, params;

    try {

        console.log(`Cancel test for testId: ${testId}`);

        //1. get a list of all running tasks 
        params = {
            cluster: process.env.TASK_CLUSTER,
            desiredStatus: 'RUNNING'
        };

        data = await ecs.listTasks(params).promise();

        //2. check if any running task are associated with the testId 
        if (data.taskArns && data.taskArns.length != 0) {

            params = {
                cluster: process.env.TASK_CLUSTER,
                tasks: data.taskArns
            };

            data = await ecs.describeTasks(params).promise();

            //3. stop any tasks associated with the testId 
            for (let i in data.tasks) {
                if (data.tasks[i].group === testId) {

                    console.log('Stopping ', data.tasks[i].taskArn);
                    params = {
                        cluster: process.env.TASK_CLUSTER,
                        task: data.tasks[i].taskArn
                    };
                    await ecs.stopTask(params).promise();
                } else {
                    console.log('no task running for testId: ', testId);
                }
            }
        } else {
            console.log('no task running for testId: ', testId);
        }
        
        //4. Update the status in the scenarios table. 
        params = {
            TableName: process.env.SCENARIOS_TABLE,
            Key: {
                testId: testId
            },
            UpdateExpression: 'set #s = :s',
            ExpressionAttributeNames: {
                '#s': 'status'
            },
            ExpressionAttributeValues: {
                ':s': 'cancelled'
            }
        };
        await dynamo.update(params).promise();

    } catch (err) {
        throw err;
    }
    return 'test cancelled';
};


/** 
 * @function listTasks 
 * Description: returns a list of ecs tasks
 */
const listTasks = async () => {

    const ecs = new AWS.ECS({
        region: process.env.AWS_REGION
    });

    let data;

    try {

        console.log('List tasks');

        //Get list of running tasks
        let params = {
            cluster: process.env.TASK_CLUSTER
        };
        data = await ecs.listTasks(params).promise();
        data = data.taskArns;

    } catch (err) {
        throw err;
    }
    return data;
};

module.exports = {
    listTests: listTests,
    createTest: createTest,
    getTest: getTest,
    deleteTest: deleteTest,
    cancelTest: cancelTest,
    listTasks: listTasks
}; 
