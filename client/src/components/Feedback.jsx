import { useEffect, useRef, useState } from 'react';
import {Placeholder, Alert, Badge, Button, Card} from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API from '../API.mjs';
import '../css/feedback.css';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { Tooltip } from 'react-tooltip';

function FeedbackPage () {
  const [interview_id, setInterview_id] = useState(useParams().interviewId);
  const [job_role, setJob_role] = useState("Web Developer");
  const [date, setDate] = useState("01/01/1970");
  const [duration, setDuration] = useState("20:09");
  const [difficulty, setDifficulty] = useState("Easy");

  const [videoURL, setVideoURL] = useState(null);
  const [your_answer, setYour_answer] = useState({is_answered: false, answer: ""});
  const [questions, setQuestions] = useState([]);
  const [q_number, setQ_number] = useState(1); 
  const [q_total, setQ_total] = useState(0);
  const [q_text, setQ_text] = useState("");
  const [verbalFeedbacks, setVerbalFeedbacks] = useState([]);
  const [nonVerbalFeedbacks, setNonVerbalFeedbacks] = useState([]);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const secs = time % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const setVideoTime = (seconds) => {
    videoRef.current.currentTime = seconds;
  };

  // useEffect(() => {
  //   const stopStream = async () => {
  //     const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  //     stream.getTracks().forEach((track) => track.stop());
  //   }
  //   stopStream();
  // }, []);

  
  const fetchAnswer = async () => {
    try {
        setVerbalFeedbacks([]);
        setNonVerbalFeedbacks([]);
        if(questions?.length > 0) {
          const response = await API.getAnswer(interview_id, questions[q_number-1]?.id);
          setYour_answer(response.answer);
          if(response.answer.is_answered) {
            setVerbalFeedbacks(JSON.parse(response.verbalFeedbacks));
            setNonVerbalFeedbacks(JSON.parse(response.nonVerbalFeedbacks));
            fetchVideo();
          } else {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            setVideoURL(null);
          }
        }
      } catch (error) {
        console.error('Error fetching answer:', error);
      }
    }
    const fetchVideo = async () => {
      try {
        // setVideoURL(null);
        if(questions?.length > 0) {
          const blob = await API.getVideo(interview_id, questions[q_number-1]?.id);
          
          const url = URL.createObjectURL(blob);
          setVideoURL(url);
        }
      } catch (error) {
        console.error('Error fetching video:', error);
        setVideoURL(null);
      }
    }

    useEffect(() => {
      const fetchInterviewInfo = async () => {
        try {
          const response = await API.getInterviewById(interview_id);
          setInterview_id(response.id);
          setDate(response.date);
          setDuration(response.duration ? formatTime(response.duration) : 'Not available');
          setDifficulty(response.difficulty || 'Mix');
          setQ_total(response.n_questions);
          const jobrole = await API.getJobRoleById(response.job_role_id);
          setJob_role(jobrole.name);
        } catch (error) {
          console.error('Error fetching interview:', error);
        }
      }
      const fetchQuestions = async () => {
        try {
          API.getQuestionsByInterviewId(interview_id)
          .then((response) => {
            setQuestions(response);
            setQ_text(response[0].question_text || "");
            fetchAnswer();
            fetchVideo();
          });
        } catch (error) {
          console.error('Error fetching questions:', error);
        }
      }
  
      fetchInterviewInfo();
      fetchQuestions();
    }, []);
    
  useEffect(() => {
    // fetchVideo();
    fetchAnswer();
    setQ_text(questions[q_number-1]?.question_text || "");
  }, [q_text, q_number]);
  

    return (
      <div className='m-3' style={{position:'relative'}}>
        <Button variant='warning' className='reviewBtn' id='backButton' onClick={() => navigate('/')}>
          <i className="bi bi-arrow-left"></i> Back to Homepage
        </Button>
        <h2 className="mb-4">Feedback</h2>
        <div className='row '>
          <div className='col-3 pe-0 '>

          <div className="card p-4 pb-3" style={{ backgroundColor: '#c7cbe7', fontSize:'small' }}>
              <p> <b>Date:</b> {date}</p>
              <p> <b>Job Role:</b> {job_role}</p>
              <p> <b>Duration:</b> {duration}</p>
              <p> <b>Difficulty level:</b> {difficulty}</p>
              <p > <b>Total Questions:</b> {q_total}</p>
            </div>
          </div>
          <div className='col-md-9 col-12 ps-0 d-flex'>

            <div className='col-6 d-flex align-items-end justify-content-center'>
              <div className='videoContainer'>
                <video
                  ref={videoRef}
                  src={videoURL}
                  controls
                  playsInline
                  className='videoPreview'
                  hidden={!your_answer.is_answered}
                  ></video>
                <p hidden={your_answer.is_answered} style={{color:'#aaaaaa', position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%'}}>
                  No video
                </p>
                {/* <iframe width="480" height="270" src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=yzZCKQKpNzg3FmXo" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe> */}
              </div>
            </div>
            <div className='col-md-6 col-12 d-flex flex-column'>
              <div className="d-flex justify-content-between">
                <strong className='d-flex align-items-center justify-content-between col-8'>
                  <span>Question {q_number}:

                  {questions[q_number-1]?.difficulty === 1 && <Placeholder xs={1} title='This question is quite easy' className=' text-center py-1 px-2 mx-2' bg='success' style={{width:'fit-content', borderRadius:'100px', cursor:'default', color:'white', fontSize:'x-small' }}>Easy</Placeholder>}
                  {questions[q_number-1]?.difficulty === 2 && <Placeholder xs={1} title='This question is on the average' className=' text-center py-1 px-2 mx-1' bg='warning' style={{width:'fit-content', borderRadius:'100px', cursor:'default', color:'white', fontSize:'x-small' }}>Medium</Placeholder>}
                  {questions[q_number-1]?.difficulty === 3 && <Placeholder xs={1} title='This question is a bit hard' className=' text-center py-1 px-2 mx-1' bg='danger' style={{width:'fit-content', borderRadius:'100px', cursor:'default', color:'white', fontSize:'x-small' }}>Hard</Placeholder>}
                  </span>
                  <br></br>
                  <span style={{fontSize:'small'}} className='text-center'>{!your_answer.is_answered && "(not answered)"}</span>  
                </strong>
                
                <span className="h5 col-4 text-end">
                  <button disabled={q_number === 1} onClick={() => setQ_number((n) => n-1)} style={{backgroundColor:'transparent', border: 'none'}}>
                    <i className="bi bi-caret-left-fill" style={{color: q_number === 1 ? 'lightgray':'black'}}></i>
                  </button> 
                  {q_number} / {q_total} 
                  <button 
                    disabled={q_number === q_total || !questions[q_number]?.is_answered} 
                    onClick={() => setQ_number((n) => n+1)} 
                    style={{backgroundColor:'transparent', border: 'none'}} 
                    data-tooltip-id='tooltip'
                    data-tooltip-content={"You are not allowed to read next question until you answer it from the interview simulation."}
                    data-tooltip-place='top-end'
                  >
                    <i className="bi bi-caret-right-fill" 
                      style={{color: q_number === q_total || !questions[q_number]?.is_answered ? 'lightgray':'black'}}
                    ></i>
                  </button>
                  <Tooltip  style={{background: '#ffed7a', color:'black', fontSize:'small', borderRadius:'7px', width:'15vw', textAlign:'center'}} className='py-1' id='tooltip' variant='light' hidden={q_number === q_total || questions[q_number]?.is_answered}/>
                </span>
              </div>
              <p><strong className="h6">{q_text}</strong></p>
              <Card id='answer-card' className='p-2' style={{border:'2px solid lightgrey'}}>
                <Card.Title as={'h6'} className='mx-2 mt-0'>Your Answer</Card.Title>
                <Card.Body className='py-0' style={{fontSize:'small', overflowY:'auto', maxHeight: '120px'}}>
                  <p>{your_answer.is_answered ? your_answer.answer : <span style={{color:'grey'}}>No Answer</span>}</p>
                </Card.Body>
              </Card>

            </div>
        </div>
      </div>
        <div className='mt-3'>

          <Card id='feedbackCard' className=' p-3'>
          <strong className='mx-2 mt-0'>AI Feedback</strong>
          <div  className="d-flex justify-content-between mt-2">
          <Card className='col me-2' style={{minHeight:'200px'}}>
              <Card.Title as={'h6'} className='px-3 pt-3'>Answer Tips</Card.Title>
              <Card.Body className='py-0'>
                <div style={{overflowY:'auto', maxHeight:'120px', fontSize:'small'}}>

                {/* VERBAL FEEDBACK */}
                {verbalFeedbacks?.length === 0 ? (
                  <div className='text-center' style={{color:'grey'}}>No feedback</div>
                ) : (
                  verbalFeedbacks.map((feedback, index) => {
                    return (
                      <div className='d-flex' key={index}>
                        <p className='col-10' style={{color: feedback.is_positive ? 'green' : 'orangered'}}>
                          {feedback.is_positive ? <FaCheck className="me-2"/> : <FaTimes className="me-2" />}
                          {feedback.text}
                        </p>
                        <div>
                          <p className='link ms-2' onClick={() => setVideoTime(feedback.seconds)} title={`set video cursor to ${formatTime(feedback.seconds)}`}> {formatTime(feedback.seconds)} </p>
                        </div>
                      </div>
                      )
                    })
                  )
                }
                </div>

              </Card.Body>
            </Card>
            <Card className='col ms-2' style={{minHeight:'200px'}}>
              <Card.Title as={'h6'} className='px-3 pt-3'>Body Language</Card.Title>
              <Card.Body className='pt-2'>
                <div style={{overflowY:'auto', maxHeight:'120px', fontSize:'small'}}>

                {/* VERBAL FEEDBACK */}
                {nonVerbalFeedbacks?.length === 0 ? (
                  <div className='text-center' style={{color:'grey'}}>No feedback</div>
                ) : (
                  nonVerbalFeedbacks.map((feedback, index) => {
                    return (
                      <div className='d-flex' key={index}>
                        <p  className='col-10' style={{color: feedback.is_positive ? 'green' : 'orangered'}}>
                          {feedback.is_positive ? <FaCheck className="me-2"/> : <FaTimes className="me-2" />}
                          {feedback.text}
                        </p>
                        <div>
                          <p className='link ms-2' onClick={() => setVideoTime(feedback.seconds)} title={`set video cursor to ${formatTime(feedback.seconds)}`}> {formatTime(feedback.seconds)} </p>
                        </div>
                      </div>
                      )
                    })
                  )
                }
                </div>
              </Card.Body>
            </Card>
          </div>
        </Card>
        
        
        </div>

      </div>
    )
}

export default FeedbackPage;