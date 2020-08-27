const parser = require('./lib/parser/');

exports.handler = async (event) => {
    
    console.log(JSON.stringify(event,null,2));
    
    try {

        const bucket = event.Records[0].s3.bucket.name;
        const key =  event.Records[0].s3.object.key;
        const testId = key.split('/').slice(1,2)[0];
        const uuid = key.split('/').slice(2,3)[0].slice(0, -4);

        //parse results from an individualtask and update dynamodb 
        const results = await parser.results(bucket, key, uuid, testId);

        if (results.taskIds.length >= results.taskCount) {
            console.log('All Task Complete');
            //Parser final results and update dynamodb
            await parser.finalResults(testId);
        } else {
            console.log('tasks still running');
        }

	} catch (err) {
		throw err;
    }
	return 'success';
};
