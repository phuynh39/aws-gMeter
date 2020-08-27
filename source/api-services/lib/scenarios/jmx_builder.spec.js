const expect = require('chai').expect;
const jmx = require('./jmx_builder');

const gRPCConfig = {
    testName: "gRPC-Greeter",
    testDescription: "Test gRPC Greeter method",
    hostPort: "127.0.0.1:9090",
    fullMethod: "greeting.Greeter/SayHello",
    requestJson: "{&quot;name&quot;: &quot;World&quot;}",
    tls: false,
    deadline: 1000
}

const expectedJMX = `<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.3">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="Test Plan" enabled="true">
      <stringProp name="TestPlan.comments"/>
      <stringProp name="TestPlan.user_define_classpath"/>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.tearDown_on_shutdown">true</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
        <collectionProp name="Arguments.arguments"/>
      </elementProp>
    </TestPlan>
    <hashTree>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="gRPC-Greeter" enabled="true">
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <stringProp name="ThreadGroup.num_threads">1</stringProp>
        <stringProp name="ThreadGroup.ramp_time">1</stringProp>
        <stringProp name="ThreadGroup.duration"/>
        <stringProp name="ThreadGroup.delay"/>
        <stringProp name="TestPlan.comments">Test gRPC Greeter method</stringProp>
        <boolProp name="ThreadGroup.scheduler">false</boolProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
        <elementProp name="ThreadGroup.main_controller" guiclass="LoopControlPanel" elementType="LoopController" testclass="LoopController" testname="Loop Controller" enabled="true">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <stringProp name="LoopController.loops">1</stringProp>
        </elementProp>
      </ThreadGroup>
      <hashTree>
        <vn.zalopay.benchmark.testbean.GrpcRequest guiclass="TestBeanGUI" testclass="vn.zalopay.benchmark.testbean.GrpcRequest" testname="gRPC-Greeter" enabled="true">
          <stringProp name="HOST_PORT">127.0.0.1:9090</stringProp>
          <stringProp name="FULL_METHOD">greeting.Greeter/SayHello</stringProp>
          <stringProp name="PROTO_FOLDER">/test_cases/proto</stringProp>
          <stringProp name="REQUEST_FILE"/>
          <stringProp name="REQUEST_JSON">{&quot;name&quot;: &quot;World&quot;}</stringProp>
          <boolProp name="TLS">false</boolProp>
          <longProp name="DEADLINE">1000</longProp>
        </vn.zalopay.benchmark.testbean.GrpcRequest>
        <hashTree/>
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>`

describe('#JMX Builder:: ', () => {
    it('should return "SUCCESS" when "BUILDJMX" returns success', async () => {
        const xml = await jmx.buildJMX(gRPCConfig);
        expect(xml).to.equal(expectedJMX);
    });
});