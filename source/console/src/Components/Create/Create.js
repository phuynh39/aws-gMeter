import React from 'react';
import { API } from 'aws-amplify';
import AceEditor from 'react-ace';
import 'brace';
import 'brace/theme/github';
import 'brace/mode/json';
import 'brace/mode/protobuf';
import {
    Col,
    Row,
    Button,
    FormGroup,
    Label,
    Input,
    FormText,
    Spinner,
    InputGroup,
} from 'reactstrap';
import * as xmlescape from 'xml-escape';


class Create extends React.Component {

    constructor(props){
        super(props);
        if (this.props.location.state.data.testId) {
            this.state = {
                isLoading: false,
                runningTasks: false,
                testId: this.props.location.state.data.testId,
                formValues: {
                    testName: this.props.location.state.data.testName,
                    testDescription: this.props.location.state.data.testDescription,
                    taskCount: this.props.location.state.data.taskCount,
                    concurrency: this.props.location.state.data.concurrency,
                    holdFor: this.props.location.state.data.holdFor.slice(0, -1),
                    holdForUnits: this.props.location.state.data.holdFor.slice(-1),
                    rampUp: this.props.location.state.data.rampUp.slice(0, -1),
                    rampUpUnits: this.props.location.state.data.rampUp.slice(-1),
                    endpoint: this.props.location.state.data.endpoint,
                    tls: this.props.location.state.data.tls,
                    method: this.props.location.state.data.method,
                    protofile: this.props.location.state.data.protofile,
                    deadline: this.props.location.state.data.deadline,
                    body: JSON.stringify(this.props.location.state.data.body),
                    protobufContent: this.props.location.state.data.protobufContent
                }
            }
        } else {
            this.state = {
                isLoading: false,
                runningTasks:false,
                testId: null,
                formValues: {
                    testName:'',
                    testDescription: '',
                    taskCount: 0,
                    concurrency:0,
                    holdFor: 0,
                    holdForUnits:'m',
                    rampUp: 0,
                    rampUpUnits: 'm',
                    endpoint:'',
                    tls:false,
                    method:'',
                    protofile:'',
                    deadline:'',
                    body:'',
                    protobufContent:''
                }
            };
        }

        this.form = React.createRef();
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.setFormValue = this.setFormValue.bind(this);
        this.handleBodyPayloadChange = this.handleBodyPayloadChange.bind(this);
        this.handleFileChosenChange = this.handleFileChosenChange.bind(this);
        this.parseJson = this.parseJson.bind(this);
        this.listTasks = this.listTasks.bind(this);
    }

    parseJson(str) {
        try { 
            return JSON.parse(str) 
        } catch (err) {
             return false;
        } 
    }
    
    handleSubmit = async () => {

        const values = this.state.formValues;

        if (!this.form.current.reportValidity() ) {
            return false;
        }
        if (!values.body) {
            values.body = '{}';
        }
        if (!this.parseJson(values.body.trim())) {
            return alert('WARINING: body text is not valid JSON');
        }
        this.setState({ isLoading: true })

        try {

            let payload = {
                testName: values.testName,
                testDescription: values.testDescription,
                taskCount: values.taskCount,
                testScenario: {
                    execution: [{
                        concurrency: values.concurrency,
                        "ramp-up": String(values.rampUp).concat(values.rampUpUnits),
                        "hold-for": String(values.holdFor).concat(values.holdForUnits),
                        scenario: values.testName,
                    }],
                    scenarios: {
                        [values.testName]: {
                            properties: {
                                "server.rmi.ssl.disable": true
                            },
                            script: "grpc_test.jmx" 
                        }
                    }
                },
                testgRPCConfig: {
                    testName: values.testName,
                    testDescription: values.testDescription,
                    hostPort: values.endpoint,
                    fullMethod: values.method,
                    requestJson: xmlescape(JSON.stringify(this.parseJson(values.body.trim()))),
                    tls: values.tls,
                    deadline: values.deadline
                },
                testProtobufFile: values.protobufContent
            };

            if (this.state.testId) {
                payload.testId = this.state.testId; 
            }

            console.log("Payload: ", payload);
    
            const response = await API.post('dlts', '/scenarios', { body: payload });
            console.log('Scenario created successfully', response);
            this.props.history.push("/");
        } catch (err) {
            console.error('Failed to create scenario', err);
            this.setState({ isLoading: false });
        }
    }

    setFormValue(key, value) {
        const formValues = this.state.formValues;
        formValues[key] = value;
        this.setState({ formValues });
    }

    handleInputChange(event) {
        const value = event.target.value;
        const name = event.target.name;
        this.setFormValue(name, value);
    }

    handleBodyPayloadChange(value) {
        this.setFormValue('body', value);
    }

    handleFileChosenChange(event) {
        let reader = new FileReader();
        let file = event.target.files[0];

        reader.onloadend = () => {
            this.setFormValue('protobufContent', reader.result);
        };
        
        if (file instanceof Blob) {
            reader.readAsText(file);
        } else {
            this.setFormValue('protobufContent', '');
        }
    }

    listTasks = async () => {
        try {
            const data = await API.get('dlts', '/tasks');
            if (data.length !== 0 ) {
                this.setState({runningTasks:true});
            }
        } catch (err) {
            alert(err);
        }
    };

    componentDidMount() { 
        this.listTasks();
    };

    render() {

        const warning = (
            <div>
                <div className="box">
                    <h1>Create a Load Test</h1>
                </div>
                <p className="warning">Warning there is a test running, multiple concurrent tests is currently not supported to avoid hitting the AWS Fargate task limits. Please wait for the test to finish before submitting a new test!</p>
            </div>

        )

        const heading = (
            <div className="box">
                <h1>Create a gRPC Load Test</h1>
                
            </div>
        )
   
        const createTestForm = (
            <div>
                <Row>
                    <Col sm="6">
                        <div className="box create-box">
                            <h3>General Settings</h3>
                            <FormGroup>
                                <Label for="testName">Name</Label>
                                <Input
                                    value={this.state.formValues.testName}
                                    type="text"
                                    name="testName"
                                    id="testName"
                                    required
                                    onChange={this.handleInputChange}
                                />
                                <FormText color="muted">
                                    The name of your load test, doesn't have to be unique.
                                </FormText>
                            </FormGroup>
                            <FormGroup>
                                <Label for="testDescription">Description</Label>
                                <Input
                                    value={this.state.formValues.testDescription}
                                    type="textarea"
                                    name="testDescription"
                                    id="testDescription"
                                    required
                                    onChange={this.handleInputChange}
                                />
                                <FormText color="muted">
                                    Short description of the test scenario.
                                </FormText>
                            </FormGroup>
                            <FormGroup>
                                <Label for="taskCount">Task Count</Label>
                                <Input
                                    value={this.state.formValues.taskCount}
                                    className="form-short"
                                    type="number"
                                    name="taskCount"
                                    id="taskCount"
                                    max={50}
                                    min={1}
                                    step={1}
                                    required
                                    onChange={this.handleInputChange}
                                />
                                <FormText color="muted">
                                    Number of docker containers that will be launched in the Fargate cluster to run the
                                    test scenario, max value 50.
                                </FormText>
                            </FormGroup>

                            <FormGroup>
                                <Label for="concurrency">Concurrency (TPS)</Label>
                                <Input
                                    value={this.state.formValues.concurrency}
                                    className="form-short"
                                    type="number"
                                    max={200}
                                    min={1}
                                    step={1}
                                    name="concurrency"
                                    id="concurrency"
                                    required
                                    onChange={this.handleInputChange}
                                />
                                <FormText color="muted">
                                    The number of concurrent requests generated per task, max value 200.
                                </FormText>
                            </FormGroup>
                            <FormGroup>

                                <Label for="rampUp">Ramp Up</Label>
                                <InputGroup className="input-group-short">
                                    <Input
                                        value={this.state.formValues.rampUp}
                                        className="form-short"
                                        type="number"
                                        name="rampUp"
                                        id="rampUp"
                                        required
                                        onChange={this.handleInputChange}
                                    />
                                    &nbsp;
                                    <Input
                                        type="select"
                                        className="form-short"
                                        name="rampUpUnits"
                                        value={this.state.formValues.rampUpUnits}
                                        id="rampUpUnits"
                                        onChange={this.handleInputChange}
                                    >
                                        <option value="m">minutes</option>
                                        <option value="s">seconds</option>
                                    </Input>
                                </InputGroup>

                                <FormText color="muted">
                                    The time to reach target concurrency.
                                </FormText>
                            </FormGroup>
                            <FormGroup>
                                <Label for="holdFor">Hold For</Label>
                                <InputGroup className="input-group-short">
                                    <Input
                                        value={this.state.formValues.holdFor}
                                        className="form-short"
                                        type="number"
                                        min={1}
                                        name="holdFor"
                                        id="holdFor"
                                        required
                                        onChange={this.handleInputChange}
                                    />
                                    &nbsp;
                                    <Input
                                        type="select"
                                        value={this.state.formValues.holdForUnits}
                                        className="form-short"
                                        name="holdForUnits"
                                        id="holdForUnits"
                                        onChange={this.handleInputChange}
                                    >
                                        <option value="m">minutes</option>
                                        <option value="s">seconds</option>
                                    </Input>
                                </InputGroup>
                                <FormText color="muted">
                                    Time to hold target concurrency.
                                </FormText>
                            </FormGroup>
                        </div>
                    </Col>
                    
                    <Col sm="6">
                        <div className="box create-box">
                            <h3>Scenario</h3>
                            <FormGroup>
                                <Label for="endpoint">gRPC Endpoint</Label>
                                <Input
                                    value={this.state.formValues.endpoint}
                                    type="text"
                                    name="endpoint"
                                    id="endpoint"
                                    required
                                    onChange={this.handleInputChange}
                                />
                                <FormText color="muted">
                                    Target URL to run tests against. For example, 127.0.0.1:9090
                                </FormText>
                            </FormGroup>
                            <FormGroup>
                                <Label for="tls">TLS</Label>
                                <Input
                                    value={this.state.formValues.tls}
                                    type="select"
                                    name="tls"
                                    id="tls"
                                    required
                                    onChange={this.handleInputChange}
                                >   
                                    <option value="false">False</option>
                                    <option value="true">True</option>
                                </Input>
                                <FormText color="muted">
                                    Encrypted communication using TLS/SSL from the server.
                                </FormText>
                            </FormGroup>
                            <FormGroup>
                                <Label for="method">Full Method</Label>
                                <Input
                                    value={this.state.formValues.method}
                                    type="text"
                                    name="method"
                                    id="method"
                                    required
                                    onChange={this.handleInputChange}
                                />
                                <FormText color="muted">
                                    gRPC method needed to test in the syntax of $package.$service/$method". For example, greeting.Greeter/SayHello
                                </FormText>
                            </FormGroup>
                            <FormGroup>
                                <Label for="protofile">Protobuf File</Label>
                                <Input
                                    type="file"
                                    name="protofile"
                                    id="protofile"
                                    accept=".proto"
                                    required
                                    onChange={this.handleFileChosenChange}
                                />
                                <br />
                                <AceEditor
                                    mode="protobuf"
                                    theme="github"
                                    fontSize={12}
                                    readOnly={true}
                                    showPrintMargin={true}
                                    showGutter={true}
                                    highlightActiveLine={true}
                                    name="protobufContent"
                                    value={this.state.formValues.protobufContent}
                                    width="100%"
                                    height="190px"
                                    editorProps={{$blockScrolling: true}}
                                    setOptions={{
                                        showLineNumbers: true,
                                        tabSize: 2
                                    }}
                                />
                                <FormText color="muted">
                                    Import protobuf file
                                </FormText>
                            </FormGroup>
                            <FormGroup>
                                <Label for="deadline">Deadline</Label>
                                <Input
                                    value={this.state.formValues.deadline}
                                    type="number"
                                    name="deadline"
                                    id="deadline"
                                    required
                                    onChange={this.handleInputChange}
                                />
                                <FormText color="muted">
                                    Timeout for the requests in milliseconds
                                </FormText>
                            </FormGroup>
                            <FormGroup>
                                <Label>Request JSON</Label>
                                <AceEditor
                                    mode="json"
                                    theme="github"
                                    fontSize={12}
                                    showPrintMargin={true}
                                    showGutter={true}
                                    highlightActiveLine={true}
                                    onChange={this.handleBodyPayloadChange}
                                    name="bodyPayload"
                                    value={this.state.formValues.body}
                                    width="100%"
                                    height="190px"
                                    editorProps={{$blockScrolling: true}}
                                    setOptions={{
                                        showLineNumbers: true,
                                        tabSize: 2
                                    }}
                                />
                                <FormText color="muted">
                                    A valid JSON object containing any body text to include in the requests.
                                </FormText>
                            </FormGroup>
                            <Button
                                className="submit"
                                size="sm"
                                onClick={this.handleSubmit}
                                disabled={this.state.runningTasks}
                            >
                                Submit
                            </Button>
                        </div>
                    </Col>
                </Row>
            </div>
        );

        return (
            <div>
                <form ref={this.form} onSubmit={e => e.preventDefault()}>
                    
                    { this.state.runningTasks? warning : heading }

                    <div>
                        {this.state.isLoading? <div className="loading"><Spinner color="secondary" /></div> : createTestForm}
                    </div>
                </form>
            </div>
        )
    }
}

export default Create;
