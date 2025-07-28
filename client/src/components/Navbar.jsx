import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Modal, Form } from 'react-bootstrap';
import Select from 'react-select';
import CustomSelect from './CustomSelect';
import API from '../API.mjs';
import CustomAlert from './CustomAlert';
import { useVoice } from './VoiceContext';

const Voices = [
  { value: 0, label: 'Female' },
  { value: 1, label: 'Male' },
];

const Navbar = () => {
  const { voice, setVoice } = useVoice();
  const [showModal, setShowModal] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [variant, setVariant] = useState(null);
  const [alertMessage, setAlertMessage] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(
    Voices.find((a) => a.value === voice) || Voices[0]
  );
  const location = useLocation();



  useEffect(() => {
    setSelectedVoice(Voices.find((a) => a.value === voice) || Voices[0]);
    setAlertVisible(false);
  }, []);

  const confirmData = () => {
    API.updateUserInfo({ id: 2, voice: selectedVoice.value })
      .then(() => {
        setVoice(selectedVoice.value);
        setAlertVisible(true);
        setVariant('success');
        setAlertMessage(['Voice updated successfully']);
      })
      .catch((e) => {
        setAlertVisible(true);
        setVariant('danger');
        setAlertMessage([e.message || 'An error occurred']);
      });
  };

  const handleShowModal = () => {
    setShowModal(true);
    setAlertVisible(false);

    setSelectedVoice(Voices.find((a) => a.value === voice) || Voices[0]);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };



  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
        <div className="container-fluid">
          {location.pathname !== "/interview" ? (
            <>
              <Link to="/" className="navbar-brand">
                <img style={{ width: 40, marginRight: 5 }} src="/Logo edit.png" alt="Logo" />
                CommuniPrep
              </Link>
              <div className="d-flex ms-auto">

                <button className="btn btn-outline-secondary" onClick={handleShowModal} type="button">
                  <i className="bi bi-gear"></i>
                </button>
              </div>
            </>
          ) : (
              <div style={{ float: 'left' }}>

                <Link className="navbar-brand" onClick={(e) => {
                  e.preventDefault();
                  alert("You can't leave the page from here, use Pause button if you want to leave the interview.");
                }}
                >
                  <img style={{ width: 40, marginRight: 5 }} src="/Logo edit.png" alt="Logo" />
                  CommuniPrep
                </Link>
              </div>
          )}
        </div>
      </nav>



      <Modal show={showModal} onHide={handleCloseModal} keyboard={true} centered>
        <Modal.Header closeButton>
          <Modal.Title>Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ paddingBottom: alertVisible ? '0px' : '' }}>
          <div>
            <Form>
              <Form.Group>
                <Form.Label>Avatar Voice:</Form.Label>
                <Select
                  id="voice"
                  placeholder="Select avatar voice"
                  options={Voices}
                  styles={CustomSelect}
                  isSearchable={false}
                  isClearable={false}
                  value={selectedVoice}
                  onChange={(option) => {
                    setAlertVisible(false);
                    setSelectedVoice(option);
                  }}
                  onFocus={() => setAlertVisible(false)}
                />
              </Form.Group>

              {alertVisible && (
                <CustomAlert
                  alertVisible={alertVisible}
                  setAlertVisible={setAlertVisible}
                  alertMessage={alertMessage}
                  variant={variant}
                />
              )}
            </Form>
          </div>
        </Modal.Body>

        <Modal.Footer>
        <Button variant="outline-danger" onClick={handleCloseModal}>
            Close
          </Button>
          <Button  disabled={alertVisible}  variant="btn confirmationBtn" onClick={confirmData}>
            Save
          </Button>
         
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Navbar;
