import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Collapse } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import '../css/Home.css';
import API from '../API.mjs';
import CustomSelect from './CustomSelect';
import CustomAlert from './CustomAlert';


const levelOptions = [
    { value: '1', label: 'Easy' },
    { value: '2', label: 'Medium' },
    { value: '3', label: 'Hard' },
];

const Home = ({ isVisible }) => {

    const [isPanelVisible, setIsPanelVisible] = useState(false);
    const [jobRoles, setJobRoles] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedJobRole, setSelectedJobRole] = useState(null);
    const [questionCount, setQuestionCount] = useState('');
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const [alertVisibleM, setAlertVisibleM] = useState(false);
    const [alertMessageM, setAlertMessageM] = useState([]);

    const navigate = useNavigate();

    const togglePanel = () => {
        if (isPanelVisible) {
            setQuestionCount('');
            setSelectedLevel(null);
        }
        setIsPanelVisible(!isPanelVisible);
        setAlertVisible(false);
    };

    const handleStartInterview = () => {
        let msg = [];

        if (!selectedJobRole) {
            msg.push('Please select a job role before starting the interview.');
        }

        if (questionCount) {
            if (questionCount < 4 || questionCount > 8) {
                msg.push('Please enter a valid number of questions (greater than 4 and lower than 8)');
            }
        }

        if (msg.length > 0) {
            setAlertMessage(msg);
            setAlertVisible(true);
            return;
        }

        setAlertVisible(false);
        setShowModal(true);
    };

    const handleConfirm = async () => {
        try {
            const data = {
                job_role_id: selectedJobRole?.value,
                difficulty: selectedLevel ? selectedLevel.value : null,
                n_questions: questionCount || null,
            };

            const result = await API.getNewInterview(data);

            if (result?.interview_id && Array.isArray(result?.questions)) {
                navigate('/interview', {
                    state: {
                        'location': 'Home',
                        jobRole: selectedJobRole?.label,
                        difficulty: selectedLevel?.label,
                        questionCount,
                        interview_id: result?.interview_id,
                        questions: result?.questions
                    },
                });
            } else {
                setAlertMessageM([`Invalid response format from server`]);
                setAlertVisibleM(true);
            }
        } catch (error) {
            setAlertMessageM([`Failed to start interview: ${error.message}`]);
            setAlertVisibleM(true);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const getJobRoleData = async () => {
        try {
            const response = await API.getJobRoles();
            if (response && Array.isArray(response) && response.length > 0) {
                const options = response.map((item) => ({
                    value: item.id,
                    label: item.name,
                }));
                setJobRoles(options);
            } else {
                setJobRoles([]);
            }
        } catch (error) {
            setAlertMessage('Failed to fetch job roles.');
            setAlertVisible(true);
        }
    };

    useEffect(() => {
        getJobRoleData();
    }, []);

    return (
        <div>
            <h2 className="mb-4">Homepage</h2>

            <div className="d-flex justify-content-center align-items-center flex-column" style={{ transition: 'all 0.3s' }}>
                <Form style={{ width: isVisible ? '40%' : '45%', transition: 'width 0.3s' }}>

                    <Form.Group>
                        <Form.Label>* Job Role:</Form.Label>
                        <Select
                            id="jobRole"
                            placeholder="Select a job role"
                            options={jobRoles}
                            styles={CustomSelect}
                            isSearchable={true}
                            isClearable={true}
                            value={selectedJobRole}
                            onChange={(selectedOption) => {
                                setSelectedJobRole(selectedOption ? { value: selectedOption.value, label: selectedOption.label } : null);
                                setAlertVisible(false);
                            }}
                            onFocus={() => setAlertVisible(false)}
                        />
                    </Form.Group>

                    <Form.Group>
                      {/* <div id="panel" className="card p-4" style={{ backgroundColor: '#c7cbe7' }}> */}
                      <div style={{backgroundColor: '#c7cbe7', borderRadius: '15px', padding: '5px', marginTop: '20px', border: '1px solid #black'}}>
                        <Link
                            // style={{ marginTop: '24px', marginBottom: '10px' }}
                            title="Customize the number of questions and question complexity for your interview."
                            to="#"
                            id="panelTitle"
                            className={`list-group-item list-group-item-action`}
                            onClick={togglePanel}
                        >
                          {/* <div style={{backgroundColor: '#c7cbe7', borderRadius: '15px', padding: '5px', paddingLeft: '30px'}}> */}
                            {isPanelVisible ? <i className="bi bi-chevron-up me-2 bold"></i> : <i className="bi bi-chevron-down me-2 bold"></i>}
                            {isPanelVisible ? " Hide Personalization Settings" : "Show Personalization Settings"}
                          {/* </div> */}
                        </Link>

                        {/* {isPanelVisible && ( */}
                        <Collapse in={isPanelVisible}>
                        <div className='p-3 my-2'>
                                <Form.Group className="mb-3">
                                    <Form.Label>Number of Questions (4-8):</Form.Label>
                                    <Form.Control
                                        id="questions"
                                        onChange={(e) => setQuestionCount(e.target.value)}
                                        type="number"
                                        placeholder="Enter a number between 4-8"
                                        min={4}
                                        max={8}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-0">
                                    <Form.Label>Questions Difficulty:</Form.Label>
                                    <Select
                                        id="difficulty"
                                        placeholder="Select questions difficulty"
                                        options={levelOptions}
                                        styles={CustomSelect}
                                        isSearchable={true}
                                        isClearable={true}
                                        value={selectedLevel}
                                        onChange={(selectedOption) => {
                                            setSelectedLevel(selectedOption ? { value: selectedOption.value, label: selectedOption.label } : null);
                                        }}
                                    />
                                </Form.Group>
                                </div>
                        </Collapse>
                        {/* )} */}
                        </div>
                    </Form.Group>

                    <CustomAlert
                        alertVisible={alertVisible}
                        setAlertVisible={setAlertVisible}
                        alertMessage={alertMessage}
                        variant="danger"
                    />
                    
                    <div className='d-flex justify-content-center mt-3'>
                      <Button
                          title="Click here to begin your interview practice session based on the selected criteria."
                          onClick={handleStartInterview}
                          className='confirmationBtn'
                          id="start-interview"
                          aria-label="Click here to begin your interview practice session based on the selected criteria."
                          >
                          Start Interview
                      </Button>
                    </div>
                </Form>

                <Modal show={showModal} onHide={handleCloseModal} keyboard={false} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Interview Information</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p className="mb-4">
                            <strong>Are you ready to begin the interview session with the following details?</strong>
                        </p>
                        <div style={{ background: '#c7cbe7', borderRadius: '15px', padding: '15px' }}>
                            <div className="mb-2">
                                <p><strong>Job Role:</strong> {selectedJobRole ? selectedJobRole.label : 'Not selected'}</p>
                            </div>
                            <div className="mb-2">
                                <p ><strong>Number of Questions:</strong> {questionCount || '4 (Default)'}</p>
                            </div>
                            <div >
                                <p className='mb-0'><strong>Interview Difficulty:</strong> {selectedLevel ? selectedLevel.label : 'Mix (Default)'}</p>
                            </div>

                        </div>
                        {alertVisibleM && (
                            <CustomAlert
                                alertVisible={alertVisibleM}
                                setAlertVisible={setAlertVisibleM}
                                alertMessage={alertMessageM}
                                variant="danger"
                            />
                        )}
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="outline-danger" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button className="btn confirmationBtn" id="" onClick={handleConfirm}>
                            Start Interview
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
};

export default Home;
