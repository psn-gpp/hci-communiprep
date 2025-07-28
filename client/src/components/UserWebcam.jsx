import { useEffect, useRef, useState } from "react";
import '../css/userwebcam.css';
import { Modal } from "react-bootstrap";
import { BiError, BiSolidMessageError } from "react-icons/bi";

function WebcamRecording({ blob, setBlob, questionIndex, questionCount, stream, setStream, isLoading, setIsLoading, isHRSpeaking, notStreaming, setNotStreaming, isPaused, mediaRecorder, setMediaRecorder, isSpeaking, isListening }) {
  const videoRef = useRef(null);
  // const [mediaRecorder, setMediaRecorder] = useState(null); // MediaRecorder Object
  const [isRecording, setIsRecording] = useState(false); // Recording state
  const [showCamera, setShowCamera] = useState(true);



  const startStream = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream); // Save the stream to the state
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream; // Connect the media stream to the video element
      }
    } catch (error) {
      console.error('Error on accessing the camera:', error);
      // alert('Impossible to access the camera. Check permissions and try again.');
      setNotStreaming(true);
    }
  };


  const stopStream = async () => {
    if (stream) {
      await stream.getTracks().forEach((track) => track.stop()); // Stops all tracks
      setStream(null); // Reset the stream state
    }
  };

  const startRecording = async () => {
    if (stream) {
      const recorder = new MediaRecorder(stream, { mimeType: 'video/mp4' });
      const chunks = []; // Local variable to store recorded chunks

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data); // Add chunk to local array
        }
      };

      recorder.onstart = () => console.log('Recording started');

      recorder.onstop = () => saveRecording(chunks); // Pass chunks to saveRecording

      // recorder.onpause = () => saveRecording(chunks);

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    }
  };

  // Stops the recording
  const stopRecording = () => {
    console.log("I'm inside stopRecording");
    if (mediaRecorder) {
      console.log('Stopping recording...');
      mediaRecorder.stop();
    }
    setIsRecording(false);
  };

  // Save the recording as a file
  const saveRecording = (chunks) => {
    if(!isPaused) {
      console.log('Saving recording...');
      setBlob(null);
      const blob = new Blob(chunks, { type: 'video/mp4' });
      setBlob(blob);
      console.log('Recording saved');
    }
  };

  // USE EFFECTS

  useEffect(() => {
    return () => {
      stopStream();
    }
  }, []);

  useEffect(() => {
    if (questionIndex + 1 > questionCount)
      stopStream();
  }, [stream, questionIndex]);

  useEffect(() => {
    if (!stream && questionIndex <= questionCount && showCamera) {
      startStream();
    }
  }, [showCamera]);

  useEffect(() => {
    if (stream && !isRecording) {
      startRecording();
    }
    if (!stream && isRecording) {
      stopRecording();
    }
  }, [stream]);

  useEffect(() => {
    const checkPermissions = async () => {
      const camera = await navigator.permissions.query({ name: 'camera' });
      const microphone = await navigator.permissions.query({ name: 'microphone' });

      setNotStreaming(camera.state === 'granted' && microphone.state === 'granted' ? false : true);
      setIsLoading(camera.state === 'granted' && microphone.state === 'granted' ? false : true);


    }

    checkPermissions();
  });


  useEffect(() => {
    console.log('Question index:', questionIndex);
    //stopRecording();
    mediaRecorder?.stop();
    if (questionIndex + 1 <= questionCount) {
      setTimeout(() => {
        startRecording();
      }, 500);
    }
    // if(questionIndex+1 === questionCount) {
    //   setShowCamera(false);
    //   stopStream();
    // }
  }, [questionIndex]);

  useEffect(() => {

    if (isPaused) {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
        setIsRecording(false);
      }
    } else {
      if (mediaRecorder && mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
        setIsRecording(true);
      }
    }

  }, [isPaused]);

  useEffect(() => {

    if (mediaRecorder?.state === 'recording') {
      setIsRecording(true);
    } else if (mediaRecorder?.state === 'paused') {
      setIsRecording(false);
    }

  }, [mediaRecorder?.state]);

  return (
    <>
      <div className="d-flex flex-column align-items-center">
        <div className='video-container' style={{ maxWidth: '15vw' }}>
          <i className="bi bi-record-fill h4 blinking-icon" hidden={!isRecording}></i>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            hidden={!showCamera || isPaused}
            className="video-preview"
          ></video>
          <span style={{position:'absolute', left:'3%', top:'3%', color:'white', zIndex:'100', backgroundColor: '#5965a5', borderRadius:'15px', padding:'0px 5px', fontSize:'small'}}>You</span>
          <p hidden={showCamera} style={{color:'#aaaaaa', position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%'}}>
            Camera is hidden, <br></br> but recording is still going
          </p>
        </div>
        <div className="d-flex justify-content-between align-items-center">

          <div className="d-flex justify-content-between col-7">
            <div className="mt-1">
              <button onClick={() => setShowCamera(!showCamera)} className="btn btn-dark" style={{ padding: '0 10px' }} title={showCamera ? "Click to hide camera" : "Click to show camera"}>
                {showCamera ?
                  <i className="bi bi-camera-video"></i>
                  : <i className="bi bi-camera-video-off"></i>}
              </button>
            </div>
            {/* <div className="d-flex justify-content-around align-items-center"> */}
            {/* <i className="bi bi-soundwave h1"></i> */}
            <div className="mx-2 me-3">
              <SoundWaveIcon isSpeaking={isSpeaking} isHRSpeaking={isHRSpeaking} isPaused={isPaused} />
            </div>
            <div className="mt-1">{isSpeaking ? 'speaking' : isListening ? 'silent' : ''}</div>
            {/* </div> */}
          </div>
          {/* <div className="col-5 text-end">
          {isHRSpeaking && <strong>HR is talking...</strong>}
        </div>   */}
        </div>
      </div>
      {/* {blob && ( // debugging
      <div>
        <p>Video registrato:</p>
        <video
          src={URL.createObjectURL(blob)}
          controls
          autoPlay
          playsInline
          style={{ width: '100%', border: '1px solid black', transform: 'scaleX(-1)' }}
          ></video>
      </div>
    )} */}
      <Modal
        show={notStreaming}
        backdrop="static"
        keyboard={false}
        animation={false}
        size="md"
        className="mt-2"
        centered
      >
        <Modal.Header>
          <Modal.Title><BiSolidMessageError /> Camera not accessible</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><BiError /> <b>Impossible to access the camera. Check permissions and reload the page.</b></p>
        </Modal.Body>
      </Modal>
    </>
  )
}

/********************** Other component *************************/

const SoundWaveIcon = ({isHRSpeaking, isPaused, isSpeaking }) => {
  const [percentage, setPercentage] = useState('50%');

  useEffect(() => {
    let audioContext;
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 256; // Determines data resolution
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateGradient = () => {
          analyser.getByteTimeDomainData(dataArray);

          // Calculate the average amplitude
          const sum = dataArray.reduce((acc, value) => acc + Math.abs(value - 128), 0);
          const average = sum / dataArray.length;

          // Map the average amplitude to a percentage (0 to 100)
          const perc = Math.min((average / 128) * 100, 100);

          // Update gradient with dynamic split based on percentage
          setPercentage(perc * 50);

          requestAnimationFrame(updateGradient);
        };

        updateGradient();
      } catch (err) {
        console.error("Error accessing microphone: ", err);
      }
    };

    initAudio();

    return () => {
      // Clean up audio context
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  useEffect(() => {
    if (isHRSpeaking || isPaused) {
      setPercentage(0);
    }
  });

  return (
    <i
      className="icon bi bi-soundwave h2"
      style={{
        "--icon-gradient-percentage": `${percentage}%`,
      }}
      title="User speaking"
    ></i>
  );
};

export default WebcamRecording;