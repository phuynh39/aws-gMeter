# set a uuid for the resultsxml file name in S3
UUID=$(cat /proc/sys/kernel/random/uuid)

echo "S3_BUCKET:: ${S3_BUCKET}"
echo "TEST_ID:: ${TEST_ID}"
echo "UUID:: ${UUID}"

echo "Download test_config.json"
aws s3 cp s3://$S3_BUCKET/test-scenarios/$TEST_ID/test_config.json test_config.json
echo "Download gRPC_test.jmx"
aws s3 cp s3://$S3_BUCKET/test-scenarios/$TEST_ID/gRPC_test.jmx grpc_test.jmx
echo "Download protobuf file"
mkdir proto
aws s3 cp s3://$S3_BUCKET/test-scenarios/$TEST_ID/test.proto proto/test.proto

echo "Running test"
bzt test_config.json -o modules.console.disable=true

t=$(python -c "import random;print(random.randint(1, 30))")
echo "sleep for: $t seconds."
sleep $t

echo "Uploading results"
aws s3 cp /tmp/artifacts/results.xml s3://$S3_BUCKET/results/${TEST_ID}/${UUID}.xml



