import React, { useEffect, useRef } from 'react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Placeholder, Container, Row, Col, Button, Card, Alert, Badge, Modal, Spinner } from 'react-bootstrap';
import { FaTimes, FaCheck, FaSmile, FaFrown } from 'react-icons/fa';
import UserWebcam from "./UserWebcam";
import API from '../API.mjs';
import '../css/interview.css';
import TextToSpeech from './TextToSpeach';
import { useVoice } from './VoiceContext';
import SpeechToText from './SpeechToText';

const NonVerbalPositive = JSON.parse(`[
  { "id": 1, "text": "You maintained a calm and composed demeanor, which made you appear confident.", "type": 1, "is_positive": 1 },
  { "id": 2, "text": "Your breathing was steady, helping you control nervousness effectively.", "type": 1, "is_positive": 1 },
  { "id": 3, "text": "You handled stressful moments well, taking pauses when needed instead of rushing.", "type": 1, "is_positive": 1 },
  { "id": 4, "text": "Your facial expressions remained natural and relaxed, conveying confidence.", "type": 1, "is_positive": 1 },
  { "id": 5, "text": "You spoke at a steady pace, showing control over your nerves.", "type": 1, "is_positive": 1 },
  { "id": 6, "text": "You managed to keep your gestures smooth and natural, avoiding nervous fidgeting.", "type": 1, "is_positive": 1 },
  { "id": 7, "text": "Your tone of voice was clear and controlled, reinforcing your confidence.", "type": 1, "is_positive": 1 },
  { "id": 8, "text": "You smiled naturally at appropriate moments, making you seem more at ease.", "type": 1, "is_positive": 1 },
  { "id": 9, "text": "You maintained consistent eye contact, showing engagement without appearing anxious.", "type": 1, "is_positive": 1 },
  { "id": 10, "text": "You handled unexpected questions smoothly without showing signs of panic.", "type": 1, "is_positive": 1 },
  { "id": 11, "text": "You used controlled hand gestures to emphasize points, which added to your confidence.", "type": 1, "is_positive": 1 },
  { "id": 12, "text": "Your posture was upright and relaxed, projecting confidence and professionalism.", "type": 1, "is_positive": 1 },
  { "id": 13, "text": "You maintained a steady gaze and smile, creating a positive and engaging presence.", "type": 1, "is_positive": 1 },
  { "id": 14, "text": "You used pauses effectively, allowing time for thoughtful responses and avoiding rushed answers.", "type": 1, "is_positive": 1 },
  { "id": 15, "text": "Your body language was open and relaxed, reflecting confidence and ease.", "type": 1, "is_positive": 1 }
]`);
const NonVerbalNegative = JSON.parse(`[
  { "id": 1, "text": "You appeared nervous, as indicated by your fidgeting and restless movements.", "type": 1, "is_positive": 0 },
  { "id": 2, "text": "Your breathing was uneven, which may have affected your ability to stay calm under pressure.", "type": 1, "is_positive": 0 },
  { "id": 3, "text": "You seemed stressed during challenging questions, as shown by your tense facial expressions.", "type": 1, "is_positive": 0 },
  { "id": 4, "text": "Your speech pace was inconsistent, which may have affected clarity and confidence.", "type": 1, "is_positive": 0 },
  { "id": 5, "text": "You fidgeted frequently, indicating nervousness and discomfort.", "type": 1, "is_positive": 0 },
  { "id": 6, "text": "Your voice wavered at times, suggesting anxiety or uncertainty.", "type": 1, "is_positive": 0 },
  { "id": 7, "text": "You avoided eye contact during challenging questions, which may have conveyed insecurity.", "type": 1, "is_positive": 0 },
  { "id": 8, "text": "Your facial expressions appeared strained, indicating discomfort or stress.", "type": 1, "is_positive": 0 },
  { "id": 11, "text": "You appeared tense at times—try taking a deep breath before answering to stay relaxed.", "type": 1, "is_positive": 0 },
  { "id": 13, "text": "You fidgeted a bit when nervous. Keeping your hands still or using controlled gestures may help.", "type": 1, "is_positive": 0 },
  { "id": 14, "text": "Your breathing was uneven during some responses, which may indicate nervousness.", "type": 1, "is_positive": 0 },
  { "id": 15, "text": "You avoided eye contact when answering difficult questions. Try to maintain steady engagement.", "type": 1, "is_positive": 0 },
  { "id": 16, "text": "Your voice wavered slightly during some answers. Speaking more slowly can help with control.", "type": 1, "is_positive": 0 },
  { "id": 18, "text": "You hesitated frequently while speaking. Practicing structured answers can boost your confidence.", "type": 1, "is_positive": 0 },
  { "id": 19, "text": "Your facial expressions sometimes showed stress. Relaxing your face can help project confidence.", "type": 1, "is_positive": 0 }
]`);


const Interview = () => {
  const {
    transcription,
    sentences,
    isListening,
    isSpeaking,
    isPaused,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    setSentences,
    setTranscription } = SpeechToText();

  const { voice } = useVoice();
  const location = useLocation();
  const navigate = useNavigate();

  const ttsRef = useRef();
  const [isHRSpeaking, setIsHRSpeaking] = useState(true);

  const handleSpeak = () => {
    if (ttsRef.current) {
      ttsRef.current.startSpeaking();
    }
  };


  const [jobRole, setJobRole] = useState(location.state?.jobRole || 'Undefined');
  const [difficulty, setDifficulty] = useState(location.state?.difficulty || 'Mix');
  const [interview_id, setInterview_id] = useState(location.state?.interview_id || 'Undefined');
  const [questions, setQuestions] = useState(location.state?.questions || []);
  const [questionCount, setQuestionCount] = useState(questions.length || 0);
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  useEffect(() => {
    const initialQuestion = location.state?.location === 'Home'
      ? questions[0]
      : location.state?.questions.filter((a) => a.is_answered === 0)[0] || { question_text: "question text" };

    setCurrentQuestion(initialQuestion);

    handleSpeak();
  }, [location, location.state?.questions]);

  const [questionIndex, setQuestionIndex] = useState(location.state?.location == 'Home' ? 0 :
    location.state?.questions.filter((a) => a.is_answered == 1).length);

  const [blob, setBlob] = useState(null); // Recorded video as blob
  const [seconds, setSeconds] = useState(0);
  const [questionSeconds, setQuestionSeconds] = useState(0);
  const [answer, setAnswer] = useState(''); // to substitute with speech-to-text 
  const [verbalFeedback, setVerbalFeedback] = useState([]);
  const [verbalList, setVerbalList] = useState([]);
  const [nonVerbalFeedback, setNonVerbalFeedback] = useState([]);
  const [stream, setStream] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);

  const [notStreaming, setNotStreaming] = useState(true);
  const Q_secondsRef = useRef(questionSeconds);
  const [mediaRecorder, setMediaRecorder] = useState(null); // MediaRecorder Object
    /* ------------------show feedback --------------------*/
  const [displayedVerbalFeedbackIndex, setDisplayedVerbalFeedbackIndex] = useState(0);
  const [selectedVerbalFeedback, setSelectedVerbalFeedback] = useState([]);

  const [displayedNonVerbalFeedbackIndex, setDisplayedNonVerbalFeedbackIndex] = useState(0);
  const [selectedNonVerbalFeedback, setSelectedNonVerbalFeedback] = useState([]);
  


  let interval, verbalFeedbackInterval, nonVerbalFeedbackInterval;

  const stopEverything = () => {
    stream.getTracks().forEach((track) => track.stop());
    clearInterval(interval);
    clearInterval(verbalFeedbackInterval);
    clearInterval(nonVerbalFeedbackInterval);
  }

  const stopStreamAndNavigate = async (newLocation) => {
    try {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    } catch (e) {
    }
    navigate(newLocation);
  }

  const deleteInterview = async () => {
    try {
      return API.deleteInterview(interview_id);
    } catch (error) {
      console.error('Error deleting interview:', error);
    }
  }


  const saveInterview = () => {
    try {
      mediaRecorder.stop();
      // return API.addAnswer(interview_id, currentQuestion.id, answer, blob, verbalFeedback, nonVerbalFeedback, 0, questionSeconds, seconds);

    } catch (error) {
      console.error('Error adding answer:', error);
    }
  }


  useEffect(() => {
    Q_secondsRef.current = questionSeconds;
  }, [questionSeconds]);

  /* -----------------------------*/
  const [verbalApi, setVerbalApi] = useState([]);
  const [nonVerbalApi, setNonVerbalApi] = useState([]);

  const getFeedbacks = async () => {
    try {
      const VerbalResponse = await API.getVerbal();
      const NonVerbalResponse = await API.getNonVerbal();


      setVerbalApi(VerbalResponse);
      setNonVerbalApi(NonVerbalResponse);

    } catch (error) {
      console.error('Error getting verbal feedback:', error);
      // stopEverything();
    }
  };

  useEffect(() => {
    const fetchFeedback = async () => {
      await getFeedbacks();
    };
    fetchFeedback();
  }, []);

  /*------------------------------*/

  // Timer counters
  useEffect(() => {

    if (stream && !notStreaming && !showPauseModal && !showExitModal) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
        setQuestionSeconds((prev) => prev + 1);
      }, 1000);

    }

    return () => {
      clearInterval(interval);
    };
  }, [notStreaming, stream, showPauseModal, showExitModal]);

  // Prevent page reload
  useEffect(() => {
    const preventReload = (event) => {
      if ((event.ctrlKey && event.key === 'r') || event.key === 'F5') {
        event.preventDefault(); // Prevent browser reload
      }
    };

    const handleBeforeUnload = (event) => {
      event.preventDefault(); // Necessary for the event to work in modern browsers
    };

    window.addEventListener('keydown', preventReload);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', stopEverything);


    return () => {
      window.removeEventListener('keydown', preventReload);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const secs = time % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };


  const toggleFeedback = () => {
    setIsFeedbackVisible(!isFeedbackVisible);
  };

  useEffect(() => {

    const addAnswer = async (status) => {
      //const newAnswer = (answer === "") ? sentences[sentences.length - 1] : ((answer + " " + (sentences[sentences.length - 1] === undefined) ? "" : sentences[sentences.length - 1]));
      let newAnswer = "";

      console.log(sentences[sentences.length - 1]);
      console.log(answer);

      if (sentences[sentences.length - 1] === "" || sentences == [] || sentences[sentences.length - 1] === undefined || sentences[sentences.length - 1] === "")
        newAnswer = answer;
      else {
        newAnswer = answer + " " + (sentences[sentences.length - 1] === undefined ? "" : sentences[sentences.length - 1]);
      }

      try {
        API.addAnswer(interview_id, currentQuestion.id, newAnswer, blob, verbalList, selectedNonVerbalFeedback, status, questionSeconds, status === 1 ? seconds : null)
          .then((response) => { console.log(response) });
      } catch (error) {
        console.error('Error adding answer:', error);
        // stopEverything();
      }
    }


    if (!blob || blob.size === 0) {
      //do nothing
      console.log("blob is empty");
    } else if (showPauseModal || showExitModal) {
      if (questionIndex < questions.length)
        addAnswer(0);
      else
        addAnswer(1);
    } else {
      setQuestionSeconds(0);

      if (questionIndex < questions.length) {
        setCurrentQuestion(questions[questionIndex]);
        addAnswer(0);
        setVerbalFeedback([]);
        setNonVerbalFeedback([]);
      } else {
        addAnswer(1);
        stopStreamAndNavigate(`/feedback/${interview_id}`);

      }
    }

    // return () => {
    //   setBlob(null);
    // };

    stopListening();
    setDisplayedVerbalFeedbackIndex(0);
    setSelectedVerbalFeedback([]);
    setSelectedNonVerbalFeedback([]);

  }, [blob]);

  /* ------------- SCROLL TO BOTTOM OF FEEDBACK ------------------- */

  const nonVerbalListEndRef = useRef(null); // Reference to the last element
  const verbalListEndRef = useRef(null); // Reference to the last element
  // Function to scroll to the last element
  const scrollToBottom = () => {
    nonVerbalListEndRef.current?.scrollIntoView({ behavior: "smooth" });
    verbalListEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom(); // Scroll to bottom whenever items are updated
  }, [verbalList, selectedNonVerbalFeedback]);


  // Helper function to select a random item from verbalApi
  const selectRandomFeedback = () => {
    const randomIndex = Math.floor(Math.random() * verbalApi.length);
    return verbalApi[randomIndex];
  };

  const selectRandomNonVerbalFeedback = () => {
    const randomIndex = Math.floor(Math.random() * nonVerbalApi.length);
    return nonVerbalApi[randomIndex];
  };

  const addToVerbalFeedback = (id) => {
    const feedback = verbalApi.find((feedback) => feedback.id === id);
    setSelectedVerbalFeedback((prev) => [...prev, feedback]);
  }


  /** VERBAL FEEDBACKS **/
  useEffect(() => {
    if (!showPauseModal && isSpeaking && verbalApi.length > 0 && displayedVerbalFeedbackIndex < verbalApi.length) {

      verbalFeedbackInterval = setInterval(() => {
        const randomFeedback = selectRandomFeedback();

        setSelectedVerbalFeedback((prev) => [...prev, { id: randomFeedback.id, text: randomFeedback.text, type: randomFeedback.type, is_positive: randomFeedback.is_positive, seconds: Q_secondsRef.current - 5 >= 0 ? Q_secondsRef.current - 5 : 0 }]);

        setDisplayedVerbalFeedbackIndex((prevIndex) => prevIndex + 1);

      }, 4000);

      return () => clearInterval(verbalFeedbackInterval);
    }

  }, [!showPauseModal, isSpeaking, verbalApi, displayedVerbalFeedbackIndex]);

  useEffect(() => {
    
    if (!showPauseModal && !notStreaming && nonVerbalApi.length > 0 && displayedNonVerbalFeedbackIndex < nonVerbalApi.length && !isHRSpeaking) {
      if(questionIndex+1 !== 2) {

        nonVerbalFeedbackInterval = setInterval(() => {
          const randomFeedback = selectRandomNonVerbalFeedback();
          
          setSelectedNonVerbalFeedback((prev) => [...prev, { id: randomFeedback.id, text: randomFeedback.text, type: randomFeedback.type, is_positive: randomFeedback.is_positive, seconds: Q_secondsRef.current - 5 >= 0 ? Q_secondsRef.current - 5 : 0 }]);
          
          
          setDisplayedNonVerbalFeedbackIndex((prevIndex) => prevIndex + 1);
          
        }, 5000);
      } else {
        clearInterval(nonVerbalFeedbackInterval);
      }
        
      return () => clearInterval(nonVerbalFeedbackInterval);
    }
  }, [!showPauseModal, !notStreaming, nonVerbalApi, displayedNonVerbalFeedbackIndex, isHRSpeaking]);

  useEffect(() => {
    console.log("questionIndex", questionIndex);
    console.log("verbalList", verbalList);
    console.log("displayedVerbalFeedbackIndex", displayedVerbalFeedbackIndex);
    console.log("isHRSpeaking", isHRSpeaking);

    let nonVerbalInterval;

    if(questionIndex+1 === 2) {
      if(verbalList.length > 0) {
        console.log(nonVerbalInterval);
        nonVerbalInterval = setInterval(() => {
          const currentList = verbalList[verbalList.length -1]?.is_positive === 1 ? NonVerbalPositive : NonVerbalNegative;
          console.log(nonVerbalInterval);
          const randomFeedback = currentList[Math.floor(Math.random() * currentList.length)];
          setSelectedNonVerbalFeedback((prev) => [...prev, { id: randomFeedback.id, text: randomFeedback.text, type: randomFeedback.type, is_positive: randomFeedback.is_positive, seconds: Q_secondsRef.current - 5 >= 0 ? Q_secondsRef.current - 5 : 0 }]);
        }, 5000);
      }
      
      return () => clearInterval(nonVerbalInterval);
    }
  }, [questionIndex, verbalList, isHRSpeaking, selectedNonVerbalFeedback]);
  
  useEffect(() => {
    if(questionIndex === 2 && verbalList.length === 0 && selectedNonVerbalFeedback.length > 0) {
      setSelectedNonVerbalFeedback([]);
    }
  }, [selectedNonVerbalFeedback]);
  
  /* -------------------TextToSpeech --------------------*/
  useEffect(() => {
    if (!notStreaming)
      handleSpeak();
  }, [currentQuestion?.question_text, notStreaming]);

  useEffect(() => {

    if (!isHRSpeaking && !notStreaming)
      startListening();
    else
      stopListening();
  }, [!isHRSpeaking, !notStreaming]);

  /*---------------------pause -----------------------*/
  useEffect(() => {
    if (showPauseModal)
      pauseListening();
    else
      resumeListening();
  }, [showPauseModal])

  useEffect(() => {
    if (showPauseModal) {
      if (sentences[sentences.length - 1] !== undefined && sentences[sentences.length - 1] != "")
        setAnswer((prev) => prev + " " + sentences[sentences.length - 1]);
      setSentences([]);
      setTranscription('');
    }
  }, [showPauseModal]);

  useEffect(() => {
    getVerbalFeedBacks();
    //setAnswer((prev) => prev + " " + sentences[sentences.length - 1]);
  }, [sentences[sentences.length - 1]]);

  function getVerbalFeedBacks() {
    let data = sentences[sentences.length - 1];
    let lastWord = "";
    let secondToLastWord = "";

    const list = [];
    if (data !== undefined) {
      const words = data.split(" ");
      if (words == undefined)
        return
      lastWord = (words[words.length - 1]).trim().toLowerCase();

      //if (words.length > 1) {
      //  secondToLastWord = (words[words.length - 2]).trim().toLowerCase();
      //  if (secondToLastWord === "")
      //     secondToLastWord = lastWord;
      // }


      //if (lastWord != secondToLastWord) {

      const seconds = Q_secondsRef.current - 5 >= 0 ? Q_secondsRef.current - 5 : 0;
      console.log("verbalApi", verbalApi);
      const row = verbalApi.find(item => item.word.toLowerCase() === lastWord);
      if (row) {
        list.push({ id: row.id, text: row.text, type: row.type, is_positive: row.is_positive, seconds });
      }

      //if (lastWord === "uhm")
      //  list.push({ id: 1, text: "home", type: 0, is_positive: 1, seconds });
      //if (lastWord === "ehm")
      //  list.push({ id: 2, text: "apple", type: 0, is_positive: 1, seconds });
      //if (lastWord === "uh-huh ")
      //  list.push({ id: 3, text: "uh-huh ", type: 0, is_positive: 1, seconds });
      //if (lastWord === "hello")
      //   list.push({ id: 4, text: "hello", type: 0, is_positive: 1, seconds });
      // if (lastWord.startsWith("mmm"))
      // list.push({ id: 5, text: "uh-huh ", type: 0, is_positive: 1, seconds });
      //}
    }

    console.log(sentences[sentences.length - 1], "2-" + secondToLastWord, "1-" + lastWord, list);
    setVerbalList((prev) => [...prev, ...list]);
  }

  useEffect(() => {
    setAnswer("");
    setVerbalList([]);
    setSentences([]);
    setTranscription("");
  }, [currentQuestion?.question_text])



  return (
    // isLoading ? (
    //   <div className='d-flex justify-content-center align-items-center' style={{ height: '60vh' }}>
    //     <Spinner animation="border" role="status" />
    //   </div>
    // ) : (
    <Container className='mw-100 mh-100' style={{ margin: 0, padding: 0 }}>
      <div className='mx-2'>
        <Row className='d-flex justify-content-around'>
          <Col md={3} className='pe-0'>
            <div className="mb-3 video-container" style={{ border: '1px solid #ccc', borderRadius: '15px', height: '25vh', textAlign: 'center', backgroundColor: 'white', minHeight: '30vh' }}>
              <video
                src={isHRSpeaking ? `/speaking-${voice === 0 ? 'female' : 'male'}.mp4` : `/listening-${voice === 0 ? 'female' : 'male'}.mp4`}
                autoPlay
                playsInline
                // muted={!isHRSpeaking || showPauseModal}
                muted
                className="avatar-container"
                loop={!isHRSpeaking}
                hidden={isLoading || showPauseModal || showExitModal}
              ></video>
              <span style={{ position: 'absolute', left: '3%', top: '3%', color: 'white', zIndex: '100', backgroundColor: '#5965a5', borderRadius: '15px', padding: '0px 5px', fontSize: 'small' }}>HR</span>
              <strong hidden={showExitModal || showPauseModal} style={{ position: 'absolute', right: '3%', bottom: '3%', color: 'white', zIndex: '100', backgroundColor: 'transparent', borderRadius: '10px', padding: '0px 10px', textShadow: '10px 0px 10px grey' }}>HR is {isHRSpeaking ? 'talking...' : 'listening...'}</strong>
            </div>
            <div className="mb-1" >
              <UserWebcam blob={blob} setBlob={setBlob} questionIndex={questionIndex} questionCount={questions.length} stream={stream} setStream={setStream} isLoading={isLoading} setIsLoading={setIsLoading} isSpeaking={isSpeaking} isListening={isListening} isHRSpeaking={isHRSpeaking} notStreaming={notStreaming} setNotStreaming={setNotStreaming} isPaused={showPauseModal || showExitModal} mediaRecorder={mediaRecorder} setMediaRecorder={setMediaRecorder} />
            </div>
            <div className=' d-flex flex-column text-center justify-content-center px-2'>
              <Card text={questionSeconds > currentQuestion?.duration && questionSeconds % 2 != 0 ? "light" : "dark"} className=' py-1 px-0 mx-4' style={{ fontSize: 'small', border: 'none', backgroundColor: questionSeconds > currentQuestion?.duration && questionSeconds % 2 != 0 ? "#ff9f43" : "rgba(238, 238, 238, 0.5)" }} >
                <Card.Body className='d-flex align-items-center justify-content-evenly py-1' >
                  <strong className='me-3'>Question Duration:</strong>
                  <Card pill bg={questionSeconds > currentQuestion?.duration ? "danger" : "dark"} text="light" className='py-1 px-3' style={{ fontSize: 'small', border: 'none' }} >
                    <span>{formatTime(questionSeconds)}</span>
                  </Card>
                </Card.Body>
              </Card>
              <span style={{ fontSize: 'x-small', color: questionSeconds > currentQuestion?.duration ? 'orangered' : 'grey' }} className='mt-2 ms-2'>Average time needed to answer this question: <b>{formatTime(currentQuestion?.duration)}</b> </span>
            </div>
          </Col>
          <Col md={8} className='ps-0'>
            <div className='mb-2'>
              <Card bg='light' text='dark' style={{ fontFamily: "inherit", border: 'none', backgroundColor: '' }} >
                {/* <p className='mb-1'><strong>Interview ID:</strong> {interview_id || 'Not provided'}</p> */}
                <Card.Body className='d-flex align-items-center justify-content-between py-0 px-4' style={{ fontSize: 'small' }}>
                  <p className='mb-1'><strong>Job Role:</strong> {jobRole || 'Not provided'}</p>
                  <p className='mb-1'><strong>Question Complexity:</strong> {difficulty || 'Mix'}</p>
                  <p className='mb-1'><strong>Number of questions:</strong> {questions.length || 0}</p>
                </Card.Body>
                {/* <pre>{JSON.stringify(questions)}</pre> */}
              </Card>
            </div>
            <Card className="" style={{ backgroundColor: "#C7CBE7" }}>
              <Card.Title as='span' style={{ fontSize: 'small' }} className='d-flex align-items-start pt-2 px-3 mb-0'>
                <span className='me-2'> Question {questionIndex < questions.length ? questionIndex + 1 : questionIndex} / {questionCount} : </span>
                {currentQuestion?.difficulty === 1 && <Placeholder xs={1} title='This question is quite easy' className=' text-center py-1 px-2' bg='success' style={{ width: 'fit-content', borderRadius: '100px', cursor: 'default', color: 'white', fontSize: 'x-small' }}>Easy</Placeholder>}
                {currentQuestion?.difficulty === 2 && <Placeholder xs={1} title='This question is on the average' className=' text-center py-1 px-2' bg='warning' style={{ width: 'fit-content', borderRadius: '100px', cursor: 'default', color: 'white', fontSize: 'x-small' }}>Medium</Placeholder>}
                {currentQuestion?.difficulty === 3 && <Placeholder xs={1} title='This question is a bit hard' className=' text-center py-1 px-2' bg='danger' style={{ width: 'fit-content', borderRadius: '100px', cursor: 'default', color: 'white', fontSize: 'x-small' }}>Hard</Placeholder>}
                <div>
                  {/* <button disabled={isHRSpeaking} onClick={handleSpeak} title='Listen to the question' id='btn-question'><i class="bi bi-volume-up-fill"></i></button>*/}
                  <TextToSpeech
                    ref={ttsRef}
                    voice={voice}
                    text={currentQuestion?.question_text}
                    setIsHRSpeaking={setIsHRSpeaking}
                  />
                  {/* <button onClick={startListening} disabled={isListening || isHRSpeaking}>
                    {isListening ? "Listening..." : "Start Listening"} {/* Start */}
                  {/*</button>
                  <button onClick={stopListening} disabled={!isListening}>
                    Stop Listening {/* Stop */}
                  {/*</button>*/}
                </div>
              </Card.Title>
              <Card.Body className='pb-3 pt-1'>
                <strong>{currentQuestion?.question_text}</strong>

                {/*  
                {!isSpeaking && isListening && (
                  <div className="text-center mt-3">silent...</div>
                )}
                {isSpeaking && (
                  <div className="text-center mt-3">Speaking...</div>
                )}
                {isPaused && (
                  <div className="text-center mt-3">pause...</div>
                )}*/}



                {/*sentences.length > 0 && <p>{sentences[sentences.length - 1]}</p>
                  <p>{answer}</p>
                  <p>all</p>
                  {sentences[sentences.length - 1]}*/}

              </Card.Body>
            </Card>
            <div className='feedback-toggle mt-3 mb-1'>
              <Button className='toggle-button' id='toggle-btn' size='sm' onClick={toggleFeedback}>
                {isFeedbackVisible ? 'Hide Feedback' : 'Show Feedback'}
              </Button>
            </div>
            {isFeedbackVisible && (
              <Card className='feedback-card p-0'>
                <Card.Body className='d-flex justify-content-evenly px-2 py-3'>
                  <Card className="inner-card ms-2 me-2">
                    <Card.Header>Verbal Feedback</Card.Header>
                    <Card.Body className='ps-3 pe-2 py-2 inner-card-body'>
                      <div style={{ overflowY: 'auto', maxHeight: '30vh' }} className='px-1'>

                        {(verbalList.length === 0) ? (
                          <div className='text-center'>No feedback yet</div>
                        ) : (
                          <>
                            {verbalList.map((feedback, index) => {
                              return (
                                <Alert key={index} variant={feedback.is_positive ? "success" : "danger"} id="alert-feedback" className="py-1 my-1">
                                  {feedback.is_positive ? <FaCheck className="me-2" /> : <FaTimes className="me-2" />}
                                  {feedback.text}
                                </Alert>
                              );
                            })}
                          </>
                        )}

                        {/* Dummy div for scrolling */}
                        <div ref={verbalListEndRef}></div>
                        {/* <Alert variant="danger" id='alert-feedback' className='py-1 my-1 ' >
                          <FaTimes className="me-2" />Watch for fillers like "um". Pause briefly instead!
                        </Alert>
                        <Alert variant="success" id='alert-feedback' className='py-1 my-1'>
                          <FaCheck className="me-2" />You did a great job of linking your experience to the role.
                        </Alert>
                        <Alert variant="danger" id='alert-feedback' className='py-1 my-0 ' >
                          <FaTimes className="me-2" />Watch for fillers like "um". Pause briefly instead!
                        </Alert> */}
                      </div>
                    </Card.Body>
                  </Card>
                  <Card className="inner-card ms-2 me-2">
                    <Card.Header>Body Language Feedback</Card.Header>
                    <Card.Body className='ps-3 pe-2 py-2 inner-card-body'>
                      <div style={{ overflowY: 'auto', maxHeight: '30vh' }} className='px-1'>
                        {selectedNonVerbalFeedback.length === 0 ? (
                          <div className='text-center'>No feedback yet</div>
                        ) : (
                          <>
                            {selectedNonVerbalFeedback.map((feedback, index) => {
                              return (
                                <Alert key={index} variant={feedback.is_positive ? "success" : "danger"} id="alert-feedback" className="py-1 my-1">
                                  {feedback.is_positive ? <FaCheck className="me-2" /> : <FaTimes className="me-2" />}
                                  {feedback.text}
                                </Alert>
                              );
                            })}
                          </>
                        )}
                        {/* Dummy div for scrolling */}
                        <div ref={nonVerbalListEndRef}></div>
                      </div>
                    </Card.Body>
                  </Card>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
        <Row style={{ position: 'fixed', bottom: 0, left: '0px', right: '0px', backgroundColor: '#f8f9fa', padding: '1% 5% 1% 0%' }} className='d-flex align-items-center'>
          <Col>
            <div className='d-flex justify-content-center align-items-center'>
              <span><b className=''>Interview Duration:</b> {formatTime(seconds)}</span>
              {/* <Badge  pill bg="light" text='dark' className='py-2 px-3' >
                    <span style={{fontSize:'medium'}}>{formatTime(seconds)}</span>
                  </Badge> */}
            </div>

          </Col>
          <Col className="d-flex justify-content-center">
            <Button variant="warning" className='reviewBtn mx-2' onClick={() => setShowPauseModal(true)}>Pause Interview</Button>
            {/* <Button variant="danger" className='mx-2' onClick={() => setShowExitModal(true)}>Exit</Button> */}
          </Col>
          <Col>
            <div className='d-flex justify-content-end'>
              <Button variant="secondary" disabled={isHRSpeaking} className={(questionIndex + 1 < questions.length) ? 'continueBtn' : 'confirmationBtn'} onClick={() => { setQuestionIndex(questionIndex + 1) }}>{(questionIndex + 1 < questions.length) ? 'Next Question' : 'End Interview'}</Button>
            </div>
          </Col>
        </Row>
      </div>



      {/* --------------------- Pause Confirmation Modal ------------------------------ */}
      {!deleteConfirmationModal && !showExitModal && <Modal show={showPauseModal} onHide={() => setShowPauseModal(false)} centered size='md' animation={false}>
        <Modal.Header closeButton>
          <Modal.Title>Pause</Modal.Title>
        </Modal.Header>
        <Modal.Body className='mx-1'>
          <b className='text-start'>If you choose to save, you can resume the interview by going to "My Interviews" and clicking on "Continue".</b>
          <div style={{ display: 'grid', rowGap: '5px', margin: '20px 100px' }}>
            <Button variant="success" className='continueBtn' onClick={() => setShowExitModal(true)}>Save and Exit</Button>
            <Button variant="outline-danger" onClick={() => setDeleteConfirmationModal(true)}>Delete this Interview</Button>
            <Button variant="secondary" onClick={() => setShowPauseModal(false)} className='mx-5 mt-4'>Resume</Button>
            {/* <Button variant="primary" className='confirmationBtn' onClick={() => { saveInterview(); stopStreamAndNavigate(`/feedback/${interview_id}`); }}>Save and Go to <span style={{ color: '' }}>Feedback</span></Button>
            <Button variant="primary" className='continueBtn' onClick={() => { saveInterview(); stopStreamAndNavigate(`/`); }}>Save and Go to <span style={{ color: '' }}>Home</span></Button> */}

          </div>
        </Modal.Body>
      </Modal>}

      <Modal show={deleteConfirmationModal} onHide={() => setDeleteConfirmationModal(false)} centered size='sm' animation={false}>
        <Modal.Header>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <b>Are you sure you want to delete this whole interview?</b>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteConfirmationModal(false)}>No</Button>
          <Button variant="outline-danger" onClick={() => { deleteInterview(); stopStreamAndNavigate(`/`) }}>Yes</Button>
        </Modal.Footer>
      </Modal>


      <Modal show={showExitModal} onHide={() => setShowExitModal(false)} centered size='md' animation={false}>
        <Modal.Header closeButton>
          <Modal.Title>Save and Exit</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <b>Do you want to save the answer to this last question?</b>
          <div style={{ display: 'grid', rowGap: '5px', margin: '20px 100px' }}>

            <Button variant="primary" className='confirmationBtn' onClick={() => { saveInterview(); stopStreamAndNavigate(`/feedback/${interview_id}`); }}>Save and <span style={{ color: '' }}>See Feedback</span></Button>
            <Button variant="primary" className='continueBtn' onClick={() => { saveInterview(); stopStreamAndNavigate(`/`); }}>Save and <span style={{ color: '' }}>Exit</span></Button>
            <Button variant="danger" className='mt-4' onClick={() => stopStreamAndNavigate(`/`)}>Exit without Saving</Button>
          </div>
        </Modal.Body>
      </Modal>


    </Container>
  );
  // );
};


export default Interview;
