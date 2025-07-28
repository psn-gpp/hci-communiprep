import React, { useState, useEffect } from "react";
import { Table, Button, Form, Modal } from "react-bootstrap";
import { FaEdit, FaTrash, FaEye, FaGripLinesVertical } from "react-icons/fa";
import Select from 'react-select';
import '../css/contribution.css';
import API from '../API.mjs';
import CustomAlert from './CustomAlert';
import CustomSelect from "./CustomSelect";
import { Tooltip } from 'react-tooltip';


const levelOptions = [
  { value: '1', label: 'Easy' },
  { value: '2', label: 'Medium' },
  { value: '3', label: 'Hard' },
];

const levelOptionsWithAll = [
  { value: 'all', label: 'All' },
  ...levelOptions,
];



function Contribution() {
  const [jobRole, setJobRole] = useState(null);
  const [jobRolesOptions, setJobRolesOptions] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [question, setQuestion] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("");

  const [questionsList, setQuestionsList] = useState([]);
  const [userId, setUserId] = useState(2); //1=AI questions, 2=Other user questions


 
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessages, setAlertMessages] = useState([]);

  const [alertVisible2, setAlertVisible2] = useState(false);
  const [alertVisible3, setAlertVisible3] = useState(false);
  const [alertMessages2, setAlertMessages2] = useState([]);

  const [variant, setVariant] = useState(null);
  const [variant2, setVariant2] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredJobRole, setFilteredJobRole] = useState(null);
  const [filteredLevel, setFilteredLevel] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState("");

  const formatDuration = (minutes, seconds) => {
    const padNumber = (num) => num.toString().padStart(2, '0');
    return `${padNumber(minutes)}:${padNumber(seconds)}`;
  };



  const handleShow = (type, question) => {
    console.log(question);
    setModalType(type);
    setCurrentQuestion(question);
    setEditedQuestion(question);
    setShowModal(true);
    setAlertVisible(false);
    setAlertVisible2(false);
    setAlertVisible3(false);
  };

  const handleClose = () => {
    setShowModal(false);
    setModalType("");
    setCurrentQuestion(null);
  };


  const addQuestion = async () => {

    const errors = [];
    if (!jobRole) errors.push("Please select a job role.");
    if (!selectedLevel) errors.push("Please select the level of difficulty.");
    if (!question) errors.push("Please enter a question.");

    if (errors.length > 0) {
      setAlertMessages(errors);
      setVariant('danger')
      setAlertVisible(true);
      return;
    }

    const newQuestion = {
      job_role_id: jobRole.value,
      question_text: question,
      duration_minutes: durationMinutes || 1,
      duration_seconds: durationSeconds || 0,
      difficulty: selectedLevel.value,
    };
    try {
      const response = await API.addQuestion(newQuestion);
      const updatedQuestions = await API.getQuestionsByUserId(userId);
      setQuestionsList(updatedQuestions);
      setQuestion("");
      setDurationMinutes("");
      setDurationSeconds("");
      setSelectedLevel(null);
      setJobRole(null);
      setAlertVisible(true);
      setVariant('success');
      setAlertMessages(['Question added successfully']);
    } catch (error) {
      console.error("Error adding question:", error);
      setAlertMessages(["Failed to add the question. Please try again."]);
      setAlertVisible(true);
    }
  };


  const saveEditedQuestion = async () => {

    console.log(editedQuestion);

    const newErrors = [];
    if (!editedQuestion.job_role_id) {
      newErrors.push("Please select a job role.");
    }
    if (!editedQuestion.difficulty) {
      newErrors.push("Please select the level of difficulty.");
    }
    if (!editedQuestion.question_text.trim()) {
      newErrors.push("Please enter a question.");
    }
    if (newErrors.length > 0) {
      setVariant2('danger');
      setAlertMessages2(newErrors);
      setAlertVisible2(true);
      setAlertVisible3(false);
      return;
    }


    const updatedQuestion = {
      ...editedQuestion,
      question_text: editedQuestion.question_text,
      job_role_id: editedQuestion.job_role_id,
      difficulty: editedQuestion.difficulty,
      duration_minutes: editedQuestion.duration_minutes,
      duration_seconds: editedQuestion.duration_seconds,
    };
    try {
      await API.editQuestion(currentQuestion.id, updatedQuestion);
      const updatedQuestions = await API.getQuestionsByUserId(userId);
      setQuestionsList(updatedQuestions);
      setAlertVisible2(true);
      setVariant2('success');
      setAlertMessages2(['Question updated successfully']);
      setCurrentQuestion(updatedQuestion);
      // handleClose();
    } catch (error) {
      console.error("Error updating question:", error);
      setAlertVisible2(true);
      setVariant2('danger');
      setAlertMessages2(["Failed to add the question. Please try again."]);
    }
  };


  const deleteQuestion = async () => {
    try {
      await API.deleteQuestion(currentQuestion.id);
      const updatedQuestions = await API.getQuestionsByUserId(userId);
      setQuestionsList(updatedQuestions);
      handleClose();
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  };



  /*********************************** */
  //Fetch job roles

  useEffect(() => {
    const fetchJobRoles = async () => {
      try {
        const roles = await API.getJobRoles();
        const roleOptions = roles.map(role => ({
          value: role.id,
          label: role.name,
        }));
        setJobRolesOptions(roleOptions);
      } catch (error) {
        console.error("Error fetching job roles:", error);
      }
    };

    fetchJobRoles();
  }, []);

  const jobRolesOptionsWithAll = [
    { value: 'all', label: 'All' },
    ...jobRolesOptions,
  ];

  /********************************************************* */
  //Fetch Questions

  useEffect(() => {
    const fetchAllQuestions = async () => {
      try {
        const questions = await API.getQuestionsByUserId(userId);
        setQuestionsList(questions);

      } catch (error) {
        console.error("Error fetching all questions:", error);
      }
    };

    fetchAllQuestions();
  }, []);

  /********************************** */

  const filteredQuestions = questionsList.filter((q) => {
    return (
      (!filteredJobRole || filteredJobRole.label === "All" || q.job_role_id === filteredJobRole.value) &&
      (!filteredLevel || filteredLevel.label === "All" || q.difficulty === parseInt(filteredLevel.value)) &&
      q.question_text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const checkEqual = (question1, question2) => {
    return (
      question1.job_role_id === question2.job_role_id &&
      question1.difficulty === question2.difficulty &&
      question1.question_text === question2.question_text &&
      question1.duration_minutes === question2.duration_minutes &&
      question1.duration_seconds === question2.duration_seconds
    );
  }


  return (
    <>
      <h2 className="">
        Contributions
        <span 
          style={{ marginLeft: "10px", cursor: "pointer" }} 
          data-tooltip-id="contribution-tooltip"
          data-tooltip-place="right-start"
        >
          &#9432;
        </span>
        <Tooltip id="contribution-tooltip" style={{background: '#ffed7a', color:'black', fontSize:'small', borderRadius:'7px', width:'40vw', textAlign:'left'}}>
         Tell us about a recent job interview! We leverage your experience, and the questions will be designed for use during the interview simulations.
        </Tooltip>
      </h2>
      <div className="p-2">
    

        <div className="d-flex justify-content-start align-items-center flex-column">
          <Form.Group className="mb-3 w-50">
            <Form.Label className="form-label">* Job Role:</Form.Label>
            <Select
              placeholder="Select the job role"
              options={jobRolesOptions}
              styles={CustomSelect}
              isSearchable={true}
              isClearable={true}
              value={jobRole}
              onChange={(e) => setJobRole(e)}
              className="custom-select-control"
            />
            {/* {errors.jobRole && <div className="text-danger">Please select a job role</div>} */}
          </Form.Group>
          <Form.Group className="mb-3 w-50">
            <Form.Label className="form-label">* Difficulty:</Form.Label>
            <Select
              placeholder="Select the difficulty"
              options={levelOptions}
              styles={CustomSelect}
              isSearchable={true}
              isClearable={true}
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e)}
              className="custom-select-control"
            />
            {/* {errors.selectedLevel && <div className="text-danger">Please select the level of difficulty</div>} */}
          </Form.Group>
          <Form.Group className="mb-3 w-50">
            <Form.Label className="form-label">* Question:</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="What was one of the questions they asked you?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="form-control"
              style={{ borderRadius: "15px" }}
            />
            {/* {errors.question && <div className="text-danger">Please enter a question</div>} */}
          </Form.Group>
          <Form.Group className={alertVisible ? 'w-50' : 'mb-3 w-50'}>
            <Form.Label className="form-label">Duration: (minutes : seconds)</Form.Label>
            <div className="d-flex">
              <Form.Control
                type="number"
                value={durationMinutes || '01'}
                onInput={(e) => { if (e.target.value < 10) e.target.value = '0' + e.target.value }}
                onChange={(e) =>
                  setDurationMinutes(e.target.value)
                }
                min={1}
                max={20}
                style={{ width: "80px", marginRight: "5px" }}
              />
              :
              <Form.Control
                type="number"
                value={durationSeconds || '00'}
                onInput={(e) => { if (e.target.value < 10) e.target.value = '0' + e.target.value }}
                onChange={(e) =>
                  setDurationSeconds(e.target.value)
                }
                min={0}
                max={59}
                style={{ width: "80px", marginLeft: "5px" }}
              />
            </div>
          </Form.Group>

          <div className="w-50">
            <CustomAlert
              style={{ width: '100%' }}
              alertVisible={alertVisible}
              setAlertVisible={setAlertVisible}
              alertMessage={alertMessages}
              variant={variant}
            />
          </div>

          <div className="d-flex justify-content-start w-50">
            <Button className={alertVisible ? 'confirmationBtn mr-4 mb-2' : 'confirmationBtn mr-4 mb-2'} onClick={addQuestion}>
              Add question
            </Button>
          </div>

        </div>



        <h3 className="mt-4 d-flex h5">List of All Questions:</h3>
        <div className="filters d-flex justify-row mt-3 justify-content-center">

          <Form.Group className="filter mx-3 mb-2">
            <Form.Label className="form-label">Search Questions:</Form.Label>
            <Form.Control
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </Form.Group>


          <Form.Group className="filter mx-3 mb-2">
            <Form.Label className="form-label">Filter by Job Role:</Form.Label>
            <Select
              placeholder="Select job role"
              options={jobRolesOptionsWithAll}
              styles={CustomSelect}
              isSearchable={true}
              isClearable={true}
              value={filteredJobRole}
              onChange={(e) => setFilteredJobRole(e)}
              className="custom-select-control"
            />
          </Form.Group>

          <Form.Group className="filter mx-3 mb-2">
            <Form.Label className="form-label">Filter by Difficulty:</Form.Label>
            <Select
              placeholder="Select difficulty"
              options={levelOptionsWithAll}
              styles={CustomSelect}
              isSearchable={true}
              isClearable={true}
              value={filteredLevel}
              onChange={(e) => setFilteredLevel(e)}
              className="custom-select-control"
            />
          </Form.Group>

        </div>





        <div className="table-container mt-4 mb-5" >

          <div className="table-scroll-container" style={{ borderRadius: "15px" }}>
            <Table striped bordered hover responsive style={{ maxHeight: "400px", overflowY: "auto", overflowX: "auto" }}>
              <thead className="table-header">
                <tr className="text-center">
                  <th>Question</th>
                  <th>Job Role</th>
                  <th>Difficulty</th>
                  <th>Duration</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((q) => (
                  <tr key={q.id} className="table-row text-center">
                    <td className="col-5" onClick={() => handleShow("view", q)}>{q.question_text}</td>
                    <td>{jobRolesOptions.find((role) => parseInt(role.value) === q.job_role_id)?.label}</td>
                    <td>{levelOptions.find((diff) => parseInt(diff.value) === q.difficulty)?.label}</td>
                    <th className="align-middle fw-normal">{formatDuration(q.duration_minutes, q.duration_seconds)}</th>
                    <td>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="table-action-button table-action-button-secondary me-2"
                        onClick={() => handleShow("view", q)}
                        title="View Question Info"
                      >
                        <FaEye style={{ paddingBottom: "2px" }} />
                      </Button>
                      <Button
                        size="sm"
                        variant="warning"
                        className="table-action-button table-action-button-warning reviewBtn me-2"
                        onClick={() => handleShow("edit", q)}
                        title="Edit Question"
                      >
                        <FaEdit style={{ paddingBottom: "2px" }} />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        className="table-action-button table-action-button-danger"
                        onClick={() => handleShow("delete", q)}
                        title="Delete Question"
                      >
                        <FaTrash style={{ paddingBottom: "2px" }} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>


        </div>




        {/* Modal */}
        <Modal show={showModal} keyboard={true} onHide={handleClose} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              {modalType === "view" && "View Question"}
              {modalType === "edit" && "Edit Question"}
              {modalType === "delete" && "Confirm Deletion"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>

            {modalType === "view" && (
              <div>
                <p><strong>Job Role: </strong>{jobRolesOptions.find(role => role.value === currentQuestion?.job_role_id)?.label}</p>
                <p><strong>Difficulty Level: </strong>{levelOptions.find(diff => diff.value === currentQuestion?.difficulty?.toString())?.label}</p>
                <p><strong>Duration: </strong>{formatDuration(currentQuestion?.duration_minutes, currentQuestion?.duration_seconds)}</p>
                {/* <p><strong>Duration: </strong>{`${currentQuestion?.duration_minutes || "00"}:${currentQuestion?.duration_seconds || "00"}`}</p> */}
                <p><strong>Question: </strong>{currentQuestion?.question_text}</p>
              </div>
            )}

            {modalType === "edit" && (
              <div>
                <Form.Group>
                  <Form.Label>Job Role: </Form.Label>
                  <Select
                    options={jobRolesOptions}
                    styles={CustomSelect}
                    isSearchable={true}
                    isClearable={true}
                    value={jobRolesOptions.find((role) => role.value === editedQuestion?.job_role_id)}
                    onChange={(e) => setEditedQuestion((prev) => ({ ...prev, job_role_id: e?.value }))}
                    className="custom-select-control"
                  />
                </Form.Group>

                <Form.Group className="mt-3">
                  <Form.Label>Interview Difficulty: </Form.Label>
                  <Select
                    options={levelOptions}
                    styles={CustomSelect}
                    isSearchable={true}
                    isClearable={true}
                    value={(levelOptions.find((diff) => diff.value === editedQuestion?.difficulty?.toString()))}
                    onChange={(e) => setEditedQuestion((prev) => ({ ...prev, difficulty: parseInt(e?.value) }))}
                    className="custom-select-control"
                  />
                </Form.Group>

                <Form.Group className="mt-3">
                  <Form.Label>Question:</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={editedQuestion.question_text}
                    onChange={(e) => setEditedQuestion((prev) => ({...prev, question_text: e.target.value}))}
                    style={{ borderRadius: "15px" }}
                  />
                </Form.Group>

                <Form.Group className="mt-3">
                  <Form.Label>Duration: (minutes : seconds)</Form.Label>
                  <div className="d-flex">
                    <Form.Control
                      type="number"
                      placeholder="01"
                      value={editedQuestion?.duration_minutes || ""}
                      onChange={(e) =>
                        setEditedQuestion((prev) => ({
                          ...prev,
                          duration_minutes: parseInt(e.target.value) || 0,
                        }))
                      }
                      min={1}
                      max={20}
                      style={{ width: "80px", marginRight: "5px" }}
                    />
                    :
                    <Form.Control
                      type="number"
                      placeholder="00"
                      value={editedQuestion?.duration_seconds || ""}
                      onChange={(e) =>
                        setEditedQuestion((prev) => ({
                          ...prev,
                          duration_seconds: parseInt(e.target.value) || 0,
                        }))
                      }
                      min={0}
                      max={59}
                      style={{ width: "80px", marginLeft: "5px" }}
                    />
                  </div>
                </Form.Group>


                <div className="w-90">
                    <CustomAlert
                      style={{ width: '100%' }}
                      alertVisible={alertVisible2}
                      setAlertVisible={setAlertVisible2}
                      alertMessage={alertMessages2}
                      variant={variant2}
                    />
                </div>
              </div>
            )}

            {modalType === "delete" && (
              <p style={{fontWeight:500}}>Are you sure you want to delete this question?</p>
            )}

          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            {modalType === "edit" && (
              <Button disabled={checkEqual(currentQuestion, editedQuestion)} className='confirmationBtn' onClick={saveEditedQuestion}>
                Save
              </Button>
            )}
            {modalType === "delete" && (
              <Button variant="outline-danger" onClick={deleteQuestion}>
                Yes, Delete
              </Button>
            )}
          </Modal.Footer>

        </Modal>

      </div>
    </>
  );
}

export default Contribution;
