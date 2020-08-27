const { create } = require('xmlbuilder2');

const buildJMX = async (jmxConfig) => {
    const jmx_obj = {
        jmeterTestPlan: {
            "@version": "1.2",
            "@properties": "5.0",
            "@jmeter": "5.3",
            hashTree: {
                TestPlan: {
                    "@guiclass": "TestPlanGui",
                    "@testclass": "TestPlan",
                    "@testname": "Test Plan",
                    "@enabled": "true",
                    stringProp: [
                        {"@name": "TestPlan.comments", "#text": ""},
                        {"@name": "TestPlan.user_define_classpath", "#text": ""}
                    ],
                    boolProp: [
                        {"@name": "TestPlan.functional_mode", "#text": "false"},
                        {"@name": "TestPlan.tearDown_on_shutdown", "#text": "true"},
                        {"@name": "TestPlan.serialize_threadgroups", "#text": "false"},
                    ],
                    elementProp: {
                        "@name": "TestPlan.user_defined_variables",
                        "@elementType": "Arguments",
                        "@guiclass": "ArgumentsPanel",
                        "@testclass": "Arguments",
                        "@testname": "User Defined Variables",
                        "@enabled": "true",
                        collectionProp: {
                            "@name": "Arguments.arguments"
                        }
                    }
                },
                hashTree: {
                    ThreadGroup: {
                        "@guiclass": "ThreadGroupGui",
                        "@testclass": "ThreadGroup",
                        "@testname": jmxConfig.testName,
                        "@enabled": "true",
                        stringProp: [
                            {"@name": "ThreadGroup.on_sample_error", "#text": "continue"},
                            {"@name": "ThreadGroup.num_threads", "#text": "1"},
                            {"@name": "ThreadGroup.ramp_time", "#text": "1"},
                            {"@name": "ThreadGroup.duration", "#text": ""},
                            {"@name": "ThreadGroup.delay", "#text": ""},
                            {"@name": "TestPlan.comments", "#text": jmxConfig.testDescription}
                        ],
                        boolProp: [
                            {"@name": "ThreadGroup.scheduler", "#text": "false"},
                            {"@name": "ThreadGroup.same_user_on_next_iteration", "#text": "true"},
                        ],
                        elementProp: {
                            "@name": "ThreadGroup.main_controller",
                            "@guiclass": "LoopControlPanel",
                            "@elementType": "LoopController",
                            "@testclass": "LoopController",
                            "@testname": "Loop Controller",
                            "@enabled": "true",
                            boolProp: {"@name": "LoopController.continue_forever", "#text": "false"},
                            stringProp: {"@name": "LoopController.loops", "#text": "1"}
                        }
                    },
                    hashTree: {
                        "vn.zalopay.benchmark.testbean.GrpcRequest": {
                            "@guiclass": "TestBeanGUI",
                            "@testclass": "vn.zalopay.benchmark.testbean.GrpcRequest",
                            "@testname": jmxConfig.testName,
                            "@enabled": "true",
                            stringProp: [
                                {"@name": "HOST_PORT", "#text": jmxConfig.hostPort},
                                {"@name": "FULL_METHOD", "#text": jmxConfig.fullMethod},
                                {"@name": "PROTO_FOLDER", "#text": "/test_cases/proto"},
                                {"@name": "REQUEST_FILE", "#text": ""},
                                {"@name": "REQUEST_JSON", "#text": jmxConfig.requestJson}
                            ],
                            boolProp: {"@name": "TLS", "#text": jmxConfig.tls},
                            longProp: {"@name": "DEADLINE", "#text": jmxConfig.deadline}
                        },
                        hashTree: {}
                    },
                }
            }
        }
    }

    const doc = create({
        version: '1.0',
        encoding: 'UTF-8'
    }, jmx_obj);
    const xml = doc.end({ prettyPrint: true }).replace(/&amp;/g, '&');

    console.log("gRPC JMX: ", xml);
    
    return xml;
}

module.exports = { 
    buildJMX: buildJMX
};
