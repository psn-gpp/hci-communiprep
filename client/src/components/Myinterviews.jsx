import React, { useState, useEffect } from 'react';
import { Modal, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import '../css/myinterview.css';
import API from '../API.mjs';
import axios from 'axios';
import Select from 'react-select';
import CustomSelect from './CustomSelect';


const InterviewDashboard = () => {
  const [interviews, setInterviews] = useState([]);
  const [filteredInterviews, setFilteredInterviews] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [sortByDate, setSortByDate] = useState('desc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state

  const navigate = useNavigate();

  // Fetch interviews from the server

  const getAllInterviews = async () => {
    try {
      const response = await API.getInterviews();
      if (response && Array.isArray(response) && response.length > 0) {
        //const sortedInterviews = response.sort((a, b) => new Date(b.date) - new Date(a.date));
        setInterviews(response);
        setFilteredInterviews(response);
      } else {
        setInterviews([]);
        setFilteredInterviews([]);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
      setInterviews([]);
      setFilteredInterviews([]);
    }
    finally {
      setIsLoading(false); // Stop loading even on error
    }
  }

  useEffect(() => {
    if (interviews.length > 0) {
      let sortedInterviews = [...interviews];

      if (sortByDate === 'asc') {
        sortedInterviews.sort((a, b) => new Date(a.date) - new Date(b.date));
      } else {
        sortedInterviews.sort((a, b) => new Date(b.date) - new Date(a.date));
      }

      setFilteredInterviews(sortedInterviews);
    }
  }, [interviews, sortByDate]);

  useEffect(() => {
    getAllInterviews();
  }, []);

  // Helper function to map status values
  const mapStatus = (status) => {
    return status === 1 ? 'Complete' : 'Incomplete';
  };


  // Handle Filters
  const handleFilterChange = () => {
    let filtered = interviews;

    // Filter by status
    if (selectedStatus !== null) {
      filtered = filtered.filter((int) => int.status === selectedStatus);
    }

    // Filter by job role
    if (selectedRole) {
      filtered = filtered.filter((int) => int.role_name === selectedRole);
    }

    // Sort by date 
    if (sortByDate === 'desc') {
      filtered = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortByDate === 'asc') {
      filtered = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    setFilteredInterviews(filtered);
  };

  useEffect(() => {
    handleFilterChange();
  }, [selectedRole, selectedStatus, sortByDate]);


  // Reset Filters
  const resetFilters = () => {
    setSelectedStatus(null);
    setSelectedRole('');
    setSortByDate('desc');
    setFilteredInterviews(interviews);

    const sortedInterviews = [...interviews].sort((a, b) => new Date(b.date) - new Date(a.date));
    setFilteredInterviews(sortedInterviews);

  };

  // Handle Delete button click
  const handleDeleteClick = (interview) => {
    setSelectedInterview(interview);
    setShowDeleteModal(true); // Open confirmation dialog
  };

  // Confirm deletion and remove the interview
  const confirmDelete = () => {
    API.deleteInterview(selectedInterview.interview_id)
      .then(() => {
        setFilteredInterviews((prev) =>
          prev.filter((int) => int.interview_id !== selectedInterview.interview_id)
        );
        setShowDeleteModal(false);
        setSelectedInterview(null);
      })
      .catch((error) => {
        console.error('Error deleting interview:', error);
      });
  };

  // Cancel the delete action
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedInterview(null);
  };

  // Navigate to Review or Continue page
  const handleNavigate = (interview, status) => {

    if (status === 0) {
      navigate(`/interview`, {
        state: {
          'location': 'myInterview',
          jobRole: interview?.role_name,
          difficulty: interview?.difficulty,
          questionCount: interview?.n_questions,
          interview_id: interview?.interview_id,
          questions: interview?.questions
        },
      });
    } else if (status === 1) {
      navigate(`/feedback/${interview?.interview_id}`);
    } else {
      console.error('Invalid status for navigation:', status);
    }

  };

  return (
    <div>
      <h2 className="mb-4">My Interviews</h2>

      {/* Show loading spinner or no data message */}
      {isLoading ? (
        <div className="text-center">
          <p>Loading interviews...</p>
        </div>
      ) : interviews.length === 0 ? (
        <div className="text-center">
          <p>No interviews found. Please create a new interview.</p>
        </div>
      ) : (
        <>
          {/* Filter and Sorting Section */}
          <div className="mb-4">
            <div className="row">
              <div className="col-md-1 mb-2"></div>
              <div className="col-md-3 mb-2" >
                <label style={{ marginBottom: '5px', paddingLeft: '15px' }}>Filter By Job Role:</label>
                <Select
                  placeholder="Select a Job Role"
                  options={[...new Set(interviews.map((int) => int.role_name))].map((role) => ({
                    value: role,
                    label: role
                  }))}
                  styles={CustomSelect}
                  isSearchable={true}
                  isClearable={true}
                  value={selectedRole ? { value: selectedRole, label: selectedRole } : null}
                  onChange={(e) => setSelectedRole(e ? e.value : '')}
                />
              </div>

              <div className="col-md-3 mb-2">
                <label style={{ marginBottom: '5px', paddingLeft: '15px' }}>Filter By Status:</label>
                <Select
                  placeholder="Select a Status"
                  options={[{ value: 1, label: 'Complete' }, { value: 0, label: 'Incomplete' }]}
                  styles={CustomSelect}
                  isSearchable={true}
                  isClearable={true}
                  value={selectedStatus !== null ? { value: selectedStatus, label: selectedStatus === 1 ? 'Complete' : 'Incomplete' } : null}
                  onChange={(e) => setSelectedStatus(e ? e.value : null)}
                />
              </div>

              <div className="col-md-3 mb-2">
                <label style={{ marginBottom: '5px', paddingLeft: '15px' }}>Sort By Date:</label>
                <Select
                  placeholder="Sort by Date"
                  options={[
                    { value: 'asc', label: 'Oldest to Newest' },
                    { value: 'desc', label: 'Newest to Oldest' }
                  ]}
                  styles={CustomSelect}
                  isSearchable={true}
                  isClearable={false}
                  value={sortByDate ? { value: sortByDate, label: sortByDate === 'asc' ? 'Oldest to Newest' : 'Newest to Oldest' } : null}
                  onChange={(e) => setSortByDate(e ? e.value : '')}
                />
              </div>
              <div className="col-md-1 mb-2" style={{ display: 'flex', alignItems: 'end' }}>
                <Button variant="outline-danger" className='me-2' onClick={resetFilters}>
                  Reset
                </Button>
              </div>
              <div className="col-md-1 mb-2"></div>
            </div>



          </div>

          {/* Records Section */}
          <div id="interviewContainer" className="row">

            {filteredInterviews.length === 0 ? (
              <p>No interviews match the current filters.</p>
            ) : (
              filteredInterviews.map((int) => {
                return (
                  <div key={int.interview_id} className="col-md-6">
                    <Card className="mb-3 shadow">

                      <Card.Header><strong>{int.role_name}</strong></Card.Header>
                      <Card.Body>
                        <Card.Text><strong>Date:</strong> {int.date}</Card.Text>
                        <Card.Text><strong>Status:</strong> {int.status === 0 ? 'Incomplete' : 'Complete'}</Card.Text>
                        {/* <ul>
                          {int.questions.map((question) => (
                            <li key={question.id}>
                              {question.question_text} (Difficulty: {question.difficulty}, Duration: {question.duration} mins)
                            </li>
                          ))}
                        </ul>*/}
                      </Card.Body>
                      <Card.Footer className="d-flex flex-column flex-sm-row justify-content-end">
                        <Button
                          variant="outline-danger"
                          className="me-2"
                          onClick={() => handleDeleteClick(int)}
                        >
                          Delete
                        </Button>
                        {int.status === 0 &&
                          <Button
                            className='reviewBtn me-2'
                            onClick={() => handleNavigate(int, 1)}
                          >Review
                          </Button>
                        }
                        <Button
                          className={int.status === 1 ? 'reviewBtn' : 'continueBtn'}
                          onClick={() => handleNavigate(int, int.status)}
                        >
                          {int.status === 1 ? 'Review' : 'Continue'}
                        </Button>

                      </Card.Footer>

                    </Card>
                  </div>
                )
              }))
            }
          </div>
        </>
      )
      }

      {/* Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={cancelDelete}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedInterview && (
            <div>

              <p className="mb-4">
                <strong>Are you sure you want to delete the interview with the details below?</strong>
              </p>
              <div style={{ background: '#c7cbe7', borderRadius: '15px', padding: '15px' }}>
                <div className="mb-2">
                  <p><strong>Job Role:</strong> {selectedInterview.role_name} </p>
                </div>
                <div>
                  <p className='mb-0'><strong>Date:</strong> {selectedInterview.date}</p>
                </div>

              </div>

            </div>



          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDelete}>
            Cancel
          </Button>
          <Button variant="outline-danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div >
  );
};



export default InterviewDashboard;
