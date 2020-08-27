import React from 'react';
import { Link } from "react-router-dom";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Row, Col, Spinner } from 'reactstrap';
import { API } from 'aws-amplify';
import AceEditor from 'react-ace';
import 'brace';
import 'brace/theme/github';
import 'brace/mode/json';
import 'brace/mode/protobuf';
import * as unescape from 'unescape';

import Results from '../Results/Results.js';
import Running from '../Running/Running.js';
import History from '../History/History.js';

class Details extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            deleteModal: false,
            cancelModal: false,
            testId: props.location.state,
            data:{
                results:{},
                history:[],
                concurrency:null,
                rampUp:null,
                holdFor: null,
                taskArns:[],
                testScenario:{
                    execution:[],
                    reporting:[],
                    scenarios:{}
                },
                testgRPCConfig:{
                    hostPort:null,
                    tls:null,
                    fullMethod:null,
                    deadline:null,
                    requestJson:null,
                },
                testProtobufFile:null
            }
        }
        this.deleteToggle = this.deleteToggle.bind(this);
        this.deleteTest = this.deleteTest.bind(this);
        this.cancelToggle = this.cancelToggle.bind(this);
        this.cancelTest = this.cancelTest.bind(this);
    };

    deleteToggle() {
        this.setState(prevState => ({
            deleteModal: !prevState.deleteModal
        }));
    }

    cancelToggle() {
        this.setState(prevState => ({
            cancelModal: !prevState.cancelModal
        }));
    }

    deleteTest= async () => {
        const { testId } = this.state.testId;
        try {
            await API.del('dlts', `/scenarios/${testId}`);
        } catch (err) {
            alert(err);
        }
        this.props.history.push("dashboard");
    }

    cancelTest = async () => {
        const { testId } = this.state.testId;
        try {
            const resp = await API.post('dlts', `/scenarios/${testId}`);
            console.log("Cancel resp: ", resp);
        } catch (err) {
            alert(err);
        }
        
        this.props.history.push("dashboard");
    }

    reloadData = async () => { 
        this.setState({
            isLoading: true,
            data:{
                results:{},
                history:[],
                concurrency:null,
                rampUp:null,
                holdFor: null,
                taskArns:[],
                testScenario:{
                    execution:[],
                    reporting:[],
                    scenarios:{}
                },
                testgRPCConfig:{
                    hostPort:null,
                    tls:null,
                    fullMethod:null,
                    deadline:null,
                    requestJson:null,
                },
                testProtobufFile:null
            }
        });
        await this.getTest();
    }

    getTest = async () => {
        const { testId } = this.state.testId;
        try {
            const data = await API.get('dlts', `/scenarios/${testId}`);
            console.log("Resp data: ", data);

            data.concurrency = data.testScenario.execution[0].concurrency;
            data.rampUp = data.testScenario.execution[0]['ramp-up'];
            data.holdFor = data.testScenario.execution[0]['hold-for'];
            
            this.setState({
                isLoading:false,
                data:data
            });
        } catch (err) {
            console.log(err);
            alert(err);
        }
    }
  
    componentDidMount= async () => {
        await this.getTest();
      }
   
    render() {

        const { data } = this.state;
        
        const cancelled = (
            <div className="box">
                <h2>Test Results</h2>
                <p>No results available as the test was cancelled.</p>
                </div>
        )

        const details = (
            <div>
                {(() => {
                    switch (data.status) {
                    case 'running':
                        return (
                            <div className="box">
                            <h1>Load Test Details</h1>
                            <Button color="danger" onClick={this.cancelToggle} size="sm">Cancel</Button>
                            <Button onClick={ this.reloadData } size="sm">Refresh</Button>
                        </div>
                        );
                    default:
                        return (
                            <div className="box">
                            <h1>Load Test Details</h1> 
                            <Button color="danger" onClick={this.deleteToggle} size="sm">Delete</Button>
                            <Link to= {{
                                    pathname:"/create",
                                    state:{ data }
                                }}>
                            <Button size="sm">Update</Button>
                            </Link>
                        </div>
                        );
                    }
                })()}

                <div className="box">
                    <Row>
                        <Col sm="7">
                            <Row className="detail">
                                <Col sm="3"><b>ID</b></Col>
                                <Col sm="9">{data.testId}</Col>
                            </Row>
                            <Row className="detail">
                                <Col sm="3"><b>NAME</b></Col>
                                <Col sm="9">{data.testName}</Col>
                            </Row>
                            <Row className="detail">
                                <Col sm="3"><b>DESCRIPTION</b></Col>
                                <Col  sm="9">{data.testDescription}</Col>
                            </Row>
                            <Row className="detail">
                                <Col sm="3"><b>ENDPOINT</b></Col>
                                <Col sm="9">{ data.testgRPCConfig.hostPort }</Col>
                            </Row>
                            <Row className="detail">
                                <Col sm="3"><b>TLS</b></Col>
                                <Col sm="9">{ String(data.testgRPCConfig.tls) }</Col>
                            </Row>
                            <Row className="detail">
                                <Col sm="3"><b>METHOD</b></Col>
                                <Col sm="9">{ data.testgRPCConfig.fullMethod }</Col>
                            </Row>
                            <Row className="detail">
                                <Col sm="3"><b>DEADLINE</b></Col>
                                <Col sm="9">{ data.testgRPCConfig.deadline }</Col>
                            </Row>
                        </Col>
                        <Col sm="5">
                            <Row className="detail">
                                <Col sm="4"><b>STATUS</b></Col>
                                <Col className={data.status} sm="8">{data.status}</Col>
                            </Row>
                            <Row className="detail">
                                <Col sm="4"><b>LAST RAN</b></Col> 
                                <Col  sm="8">{data.startTime}</Col>
                            </Row>
                            <Row className="detail">
                                <Col sm="4"><b>TASK COUNT</b></Col>
                                <Col  sm="8">{data.taskCount}</Col>
                            </Row>
                            <Row className="detail">
                                <Col sm="4"><b>CONCURRENCY</b></Col>
                                <Col  sm="8">{ data.concurrency }</Col>
                            </Row>
                            <Row className="detail"> 
                                <Col sm="4"><b>RAMP UP</b></Col>
                                <Col  sm="8">{ data.rampUp }</Col>
                            </Row>
                            <Row className="detail">
                                <Col sm="4"><b>HOLD FOR</b></Col>
                                <Col  sm="8">{ data.holdFor }</Col>
                            </Row>
                        </Col>
                    </Row>
                    <Row className="detail">
                        <Col sm="2"><b>JSON REQUEST</b></Col>
                        <Col sm="10">
                            <AceEditor
                                mode="json"
                                theme="github"
                                fontSize={12}
                                readOnly={true}
                                showPrintMargin={true}
                                showGutter={true}
                                highlightActiveLine={true}
                                name="protobufContent"
                                value={ unescape(data.testgRPCConfig.requestJson) }
                                width="100%"
                                height="150px"
                                editorProps={{$blockScrolling: true}}
                                setOptions={{
                                    showLineNumbers: true,
                                    tabSize: 2
                                }}
                            />
                        </Col>
                    </Row>
                    <Row className="detail">
                        <Col sm="2"><b>PROTOBUF FILE</b></Col>
                        <Col sm="10">
                            <AceEditor
                                mode="protobuf"
                                theme="github"
                                fontSize={12}
                                readOnly={true}
                                showPrintMargin={true}
                                showGutter={true}
                                highlightActiveLine={true}
                                name="protobufContent"
                                value={ data.testProtobufFile }
                                width="100%"
                                height="150px"
                                editorProps={{$blockScrolling: true}}
                                setOptions={{
                                    showLineNumbers: true,
                                    tabSize: 2
                                }}
                            />
                        </Col>
                    </Row>
                </div>
              
                {(() => {
                    switch (data.status) {
                    case 'complete':
                        return <Results data={data} />;
                    case 'cancelled':
                        return <div>{cancelled}</div>;
                    default:
                        return <Running data={data} />;
                    }
                })()}
                
                {data.status ==='running'? <div></div> :  <History data={data} /> }

            </div>
        )

        return (
            <div>

                { this.state.isLoading?  <div className="loading"><Spinner color="secondary" /></div> : details }

                <Modal isOpen={this.state.deleteModal} toggle={this.deleteToggle}>
                    <ModalHeader>Warning</ModalHeader>
                    <ModalBody>
                        This will delete the test scenario and all of of the results
                </ModalBody>
                    <ModalFooter>
                        <Button color="link" size="sm" onClick={this.deleteToggle}>Cancel</Button>
                        <Button color="danger" size="sm" onClick={this.deleteTest}>Delete</Button>
                    </ModalFooter>
                </Modal>

                <Modal isOpen={this.state.cancelModal} toggle={this.cancelToggle}>
                    <ModalHeader>Warning</ModalHeader>
                    <ModalBody>
                        This will stop all running tasks amd end the test.
                </ModalBody>
                    <ModalFooter>
                        <Button color="link" size="sm" onClick={this.cancelToggle}>Cancel</Button>
                        <Button color="danger" size="sm" onClick={this.cancelTest}>Cancel Test</Button>
                    </ModalFooter>
                </Modal>
            
            </div>
        )
    }

}

export default Details;
