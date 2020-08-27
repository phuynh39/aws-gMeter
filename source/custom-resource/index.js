const uuid = require('uuid');
const cfn = require('./lib/cfn');
const s3 = require('./lib/s3');


exports.handler = async (event, context) => {

    console.log(`event: ${JSON.stringify(event,null,2)}`);
    
    const resource = event.ResourceProperties.Resource;
    const config = event.ResourceProperties;
    let responseData = {};

    try {
        if (event.RequestType === 'Create') {

            switch (resource) {

                case ('UUID'):
                    responseData = {
                        UUID: uuid.v4()
                    };
                    break;

                case ('S3PutNotification'):
                    await s3.putNotification(config.Bucket, config.LambdaArn);
                    break;

                case ('CopyAssets'):
                    await s3.copyAssets(config.SrcBucket, config.SrcPath, config.ManifestFile, config.DestBucket);
                    break;
                
                case ('ConfigFile'):
                    await s3.configFile(config.AwsExports, config.DestBucket);
                    break;
            }
        }
        if (event.RequestType === 'Update') {
            //Update not required for metrics
        }
        
        if (event.RequestType === 'Delete') {
            //Delete not required for metrics
        }
        
        await cfn.send(event, context, 'SUCCESS', responseData, resource);
        
    } 
    catch (err) {
        console.log(err, err.stack);
        cfn.send(event, context, 'FAILED',{},resource);
    }
};
