import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { check, validationResult } from 'express-validator';
import morgan from 'morgan';
import cors from 'cors';
import { getJobRoles, addInterviewAndQuestions, getJobRoleById, setCompletedInterview, addAnswer, addVerbalFeedback, addNonVerbalFeedback, getInterviewQuestionId, getInterviewById, getQuestionsByInterviewId, deleteInterview, getAllInterviews,getAnswer, getInterviewQuestionNonVerbalFeedbacks, getInterviewQuestionVerbalFeedbacks, getInterviewQuestions, getNonVerbalFeedback, getVerbalFeedback, getUserInfo, updateUser, getAllQuestions, getQuestionsByUserId, addQuestion, deleteQuestion, editQuestion } from './dao.mjs';
import { customError } from './model.mjs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Recreate __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3001;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const interviewId = req.params.interviewId;
    if (!interviewId) {
      return cb(new Error("Interview ID is missing"));
    }

    // Define the directory path based on the interview ID
    const dirPath = path.join(__dirname, "videos", interviewId);

    try {
      // Check if the directory exists, if not, create it
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      // Use the newly created directory as the destination
      cb(null, dirPath);
    } catch (err) {
      console.error("Error creating directory:", err);
      cb(new Error("Failed to create upload directory"));
    }
  },
  filename: (req, file, cb) => {
    // I want to print req but it is an object
    
    const newFilename = `${req.params.questionId}.mp4`;
    cb(null, newFilename);
  },
});

const upload = multer({
  storage,
});


app.use(express.json());
app.use(morgan('dev'));
const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200,
  credentials: true
};
app.use(cors(corsOptions));

app.listen(port, () => {
  console.log(`API server started at http://localhost:${port}`);
});


/** JOB ROLES APIs*/

app.get('/api/jobs', async (req, res) => {
  try {
    const roles = await getJobRoles();
    res.json(roles);
  } catch (e) {
    if (e instanceof customError) {
      res.status(e.code).json({ error: e.message });
    } else {
      res.status(503).json({ error: e.message });
    }
  }
});

app.get('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const role = await getJobRoleById(id);
    res.json(role);
  } catch (e) {
    if (e instanceof customError) {
      res.status(e.code).json({ error: e.message });
    } else {
      res.status(503).json({ error: e.message });
    }
  }
}
);


/** USERS */

/** INTERVIEW SESSION APIs */

app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getUserInfo(id);
    res.json(result);
  } catch (e) {
    if (e instanceof customError) {
      res.status(e.code).json({ error: e.message });
    } else {
      res.status(503).json({ error: e.message });
    }
  }
});

app.put('/api/updateUserInfo/:id', async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const newUser = req.body;

  try {
    const id = await updateUser(req.params.id, newUser.voice);
    res.status(201).location(id).end();
  } catch (e) {
    if (e instanceof customError) {
      res.status(e.code).json({ error: e.message });
    } else {
      res.status(503).json({ error: e.message });
    }
  }
});



/** INTERVIEWS */
app.post('/api/interview/', async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { job_role_id, difficulty, n_questions } = req.body;

    const result = await addInterviewAndQuestions(job_role_id, difficulty, n_questions);
    res.status(200).json(result); // Ensure valid JSON response

  } catch (e) {
    if (e instanceof customError) {
      res.status(e.code).json({ error: e.message });
    } else {
      res.status(503).json({ error: e.message });
    }
  }

});

/**
 * Add an answer to a question in an interview
 * param: 
 * - id : The ID of the interview
 * - questionId : The ID of the question
 * body:
 * - answer: The text transcription of the answer
 * - video: The video file of the answer
 * - verbalFeedback (array): The verbal feedback for the answer (feedback + seconds to appear on the screen)
 * - nonVerbalFeedback (array): The non-verbal feedback for the answer (feedback + seconds to appear on the screen)
 * - status (optional): 1 if the interview is completed
 * - questionDuration: The duration of the question
 * - interviewDuration: The duration of the interview (if status is 1)
 */
app.post(
  '/api/interview/:interviewId/question/:questionId/answer',
  upload.single('video'),
  async (req, res) => {
    try {
      const {interviewId, questionId} = req.params;
      //const {answer, verbalFeedback, nonVerbalFeedback, status } = req.body;
      // console.log("req.body");
      // console.log(req.body.verbalFeedback);
      // console.log(req.body.nonVerbalFeedback);


      const answer = req.body.answer;
      const verbalFeedback = req.body.verbalFeedback ? JSON.parse(req.body.verbalFeedback) : null;
      const nonVerbalFeedback = req.body.nonVerbalFeedback ? JSON.parse(req.body.nonVerbalFeedback) : null;
      const status = parseInt(req.body.status);
      const questionDuration = parseInt(req.body.questionDuration); 
      

      // answer
      // if(!answer)
      //   return res.status(400).json({ error: "Answer is required" });
      // else {
        const result = await addAnswer(interviewId, questionId, answer, questionDuration);
        //console.log(result);
      // }

      // status
      if(status === 1) {
        const interviewDuration = parseInt(req.body.interviewDuration);
        const result = await setCompletedInterview(interviewId, interviewDuration);
        //console.log(result);
      }

      const interviewQuestionId = await getInterviewQuestionId(interviewId, questionId);

      // console.log(verbalFeedback);
      if(verbalFeedback && Array.isArray(verbalFeedback)) {
        // console.log("verbal feedback array");
        verbalFeedback.forEach(async (feedback) => {
          // console.log(feedback);
          const result = await addVerbalFeedback(interviewQuestionId, feedback.text, feedback.is_positive, feedback.seconds);
          //console.log(result);
        }); 
      } 
      // else {
      //   console.log("verbal feedback", verbalFeedback);
      //   const result = await addVerbalFeedback(interviewQuestionId, verbalFeedback.text, verbalFeedback.is_positive, verbalFeedback.seconds);
      //   //console.log(result);
      // }
      
      // console.log(nonVerbalFeedback);
      // if(nonVerbalFeedback.lenght > 0) {
      //   console.log("sono dentro non verbal feedback");
      //   nonVerbalFeedback.forEach(async (feedback) => {
      //     console.log(feedback);
      //     const result = await addNonVerbalFeedback(interviewId, questionId, feedback);
      //     //console.log(result);
      //   }); 
      // }

      // console.log(nonVerbalFeedback);
      if(Array.isArray(nonVerbalFeedback)) {
        nonVerbalFeedback.forEach(async (feedback) => {
          // console.log(feedback);
          const result = await addNonVerbalFeedback(interviewQuestionId, feedback.text, feedback.is_positive, feedback.seconds);
          //console.log(result);
        }); 
      } 
      // else {
      //   console.log("non verbal feedback");

      //   const result = await addNonVerbalFeedback(interviewQuestionId, nonVerbalFeedback.text, nonVerbalFeedback.is_positive, nonVerbalFeedback.seconds);
      //   //console.log(result);
      // }

      res.status(200).json({ message: "Answer added successfully" });
      
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  }
);


/** INTERVIEWS */

app.get('/api/interviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await getInterviewById(id);
    res.json(interview);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


app.get('/api/interviews', async (req, res) => {
  try {
    getAllInterviews().then(async (interviews) => {
      const interviewsWithRoles = await Promise.all(interviews.map(async (interview) => {
        const role = await getJobRoleById(interview.job_role_id);
        return { ...interview, role: role.name };
      }));

      res.json(interviewsWithRoles);
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/interviews/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await deleteInterview(id);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ***************** GET QUESTIONS FOR FEEDBACK PAGE ***************************

app.get('/api/interviews/:id/questions', async (req, res) => {
  try {
    const { id } = req.params;
    const questions = await getQuestionsByInterviewId(id);
    res.json(questions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// app.get('/api/feedbacks/:interviewId/question/:questionId/verbal', async (req, res) => {
//   try {
//     const interview_question_id = await getInterviewQuestionId(req.params.interviewId, req.params.questionId);
//     const feedbacks = await getVerbalFeedback(interview_question_id);
//     res.json(feedbacks);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });

// app.get('/api/feedbacks/:interviewId/question/:questionId/nonVerbal', async (req, res) => {
//   try {
//     const interview_question_id = await getInterviewQuestionId(req.params.interviewId, req.params.questionId);
//     const feedbacks = await getNonVerbalFeedback(interview_question_id);
//     res.json(feedbacks);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });


// ********************** ANSWER APIS *****************************

// get answer for a specific question in an interview
app.get('/api/interviews/:interviewId/questions/:questionId/answer', async (req, res) => {
  try {
    // const { interviewId, questionId } = req.params;
    const interviewId = parseInt(req.params.interviewId);
    const questionId = parseInt(req.params.questionId);
    
    const answer = await getAnswer(interviewId, questionId);

    const verbalFeedbacks = JSON.stringify(await getInterviewQuestionVerbalFeedbacks(answer.id));

    const nonVerbalFeedbacks = JSON.stringify(await getInterviewQuestionNonVerbalFeedbacks(answer.id));

    res.json({ answer, verbalFeedbacks, nonVerbalFeedbacks });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// get video for a specific question in an interview
app.get('/api/interviews/:interviewId/questions/:questionId/video', async (req, res) => {
  try {
    // const { interviewId, questionId } = req.params;
    const interviewId = String(req.params.interviewId);
    const questionId = String(req.params.questionId);
    const dirPath = path.join(__dirname, "videos/", interviewId);
    
    if(!fs.existsSync(dirPath)) {
      return res.status(404).json({ error: "No video found" });
    }

    const videos = fs.readdirSync(dirPath);
    const videoname = videos.find((file) => file.startsWith(`${questionId}.`));

    const videoURL = path.join(dirPath, videoname);

    res.sendFile(videoURL, (err) => {
      if (err) {
        console.error("Errore nel servire il file:", err);
        res.status(404).send("Video non trovato");
      }
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ********************** FEEDBACK APIS *****************************

app.get('/api/feedbackVerbal', (req, res) => {
  // I want to pick one random feedback from the list
  //const randomIndex = Math.floor(Math.random() * feedbackListVerbal.length);
  res.json(feedbackListVerbal);
});

app.get('/api/feedbackNonVerbal', (req, res) => {
 // const randomIndex = Math.floor(Math.random() * feedbackListNonVerbal.length);
  res.json(feedbackListNonVerbal);
});


/* ***************Contribution********************** */

app.get('/api/questions', async (req, res) => {
  try {
    const questions = await getAllQuestions();
    res.json(questions); 
  } catch (e) {
    res.status(500).json({ error: e.message }); 
  }
});


app.get('/api/questions/:userId', async (req, res) => {
  try {
    const { userId } = req.params; 
    const questions = await getQuestionsByUserId(userId); 
    res.json(questions); 
  } catch (e) {
    res.status(500).json({ error: e.message }); 
  }
});



app.post('/api/questions', async (req, res) => {
  try {
    const question = req.body; 
    const result = await addQuestion(question);
    res.status(201).json(result); 
  } catch (e) {
    res.status(500).json({ error: e.message }); 
  }
});



app.delete('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params; 
    const result = await deleteQuestion(id);
    res.json(result); 
  } catch (e) {
    res.status(500).json({ error: e.message }); 
  }
});



app.put('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params; 
    const updatedQuestion = req.body; 
    const result = await editQuestion(id, updatedQuestion);
    res.json(result); 
  } catch (e) {
    res.status(500).json({ error: e.message }); 
  }
});

/************************************************ */

let feedbackListVerbal = [
  { "id": 1, "word": "stuff", "text": "Be specific; mention key projects and their impact.", "type": 0, "is_positive": 0 },
  { "id": 2, "word": "basically", "text": "Get straight to the point; avoid overusing 'basically.'", "type": 0, "is_positive": 0 },
  { "id": 3, "word": "like", "text": "Limit filler words; pausing is more confident.", "type": 0, "is_positive": 0 },
  { "id": 4, "word": "passionate", "text": "Show passion with impactful examples.", "type": 0, "is_positive": 0 },
  { "id": 5, "word": "hardworking", "text": "Share specific examples of going above and beyond.", "type": 0, "is_positive": 0 },
  { "id": 6, "word": "team player", "text": "Provide examples of successful teamwork.", "type": 0, "is_positive": 0 },
  { "id": 7, "word": "detail-oriented", "text": "Prove it with examples like catching critical errors.", "type": 0, "is_positive": 0 },
  { "id": 8, "word": "probably", "text": "Avoid uncertainty; sound confident.", "type": 0, "is_positive": 0 },
  { "id": 9, "word": "try", "text": "Say 'I will' instead to project confidence.", "type": 0, "is_positive": 0 },
  { "id": 10, "word": "just", "text": "Don't downplay contributions; own your impact.", "type": 0, "is_positive": 0 },
  { "id": 11, "word": "I think", "text": "State strengths confidently; drop 'I think.'", "type": 0, "is_positive": 0 },
  { "id": 12, "word": "sorry", "text": "Avoid unnecessary apologies; focus on solutions.", "type": 0, "is_positive": 0 },
  { "id": 13, "word": "I don't have experience", "text": "Highlight transferable skills for the role.", "type": 0, "is_positive": 0 },
  { "id": 14, "word": "I know this isn’t a great answer", "text": "Deliver your answer confidently.", "type": 0, "is_positive": 0 },
  { "id": 15, "word": "I did this", "text": "Balance 'I' and 'we' to show teamwork.", "type": 0, "is_positive": 0 },
  { "id": 16, "word": "achieved", "text": "Demonstrate measurable results (e.g., increased sales by 20%).", "type": 0, "is_positive": 1 },
  { "id": 17, "word": "led", "text": "Show leadership (e.g., led a team of five).", "type": 0, "is_positive": 1 },
  { "id": 18, "word": "managed", "text": "Highlight responsibility (e.g., managed multiple projects).", "type": 0, "is_positive": 1 },
  { "id": 19, "word": "implemented", "text": "Show initiative (e.g., implemented a time-saving process).", "type": 0, "is_positive": 1 },
  { "id": 20, "word": "exceeded", "text": "Demonstrate going beyond expectations (e.g., surpassed sales targets).", "type": 0, "is_positive": 1 },
  { "id": 21, "word": "resolved", "text": "Highlight problem-solving (e.g., resolved customer complaints).", "type": 0, "is_positive": 1 },
  { "id": 22, "word": "optimized", "text": "Show efficiency improvements (e.g., reduced turnaround time).", "type": 0, "is_positive": 1 },
  { "id": 23, "word": "improved", "text": "Demonstrate growth (e.g., improved client retention by 15%).", "type": 0, "is_positive": 1 },
  { "id": 24, "word": "developed", "text": "Show creativity (e.g., developed a new system).", "type": 0, "is_positive": 1 },
  { "id": 25, "word": "enhanced", "text": "Show value addition (e.g., increased productivity).", "type": 0, "is_positive": 1 },
  { "id": 26, "word": "collaborated", "text": "Highlight teamwork (e.g., worked with cross-functional teams).", "type": 0, "is_positive": 1 },
  { "id": 27, "word": "supported", "text": "Show contributions (e.g., helped meet deadlines).", "type": 0, "is_positive": 1 },
  { "id": 28, "word": "partnered", "text": "Show strategic teamwork (e.g., partnered with marketing).", "type": 0, "is_positive": 1 },
  { "id": 29, "word": "mentored", "text": "Highlight leadership (e.g., guided new employees).", "type": 0, "is_positive": 1 },
  { "id": 30, "word": "engaged", "text": "Show active participation (e.g., engaged with clients).", "type": 0, "is_positive": 1 },
  { "id": 31, "word": "learned", "text": "Show adaptability (e.g., quickly learned new tools).", "type": 0, "is_positive": 1 },
  { "id": 32, "word": "adapted", "text": "Show flexibility (e.g., adjusted to new policies).", "type": 0, "is_positive": 1 },
  { "id": 33, "word": "overcame", "text": "Highlight resilience (e.g., met tight deadlines).", "type": 0, "is_positive": 1 },
  { "id": 34, "word": "transformed", "text": "Show innovation (e.g., revamped reporting systems).", "type": 0, "is_positive": 1 },
  { "id": 35, "word": "expanded", "text": "Show growth mindset (e.g., expanded skills to include data analysis).", "type": 0, "is_positive": 1 },
  { "id": 36, "word": "mmm", "text": "Replace filler sounds with a confident pause.", "type": 0, "is_positive": 0 },
  { "id": 37, "word": "uh", "text": "Minimize fillers; pause confidently instead.", "type": 0, "is_positive": 0 },
  { "id": 38, "word": "um", "text": "Avoid 'um'; use a thoughtful pause.", "type": 0, "is_positive": 0 },
  { "id": 39, "word": "like I said", "text": "Avoid redundancy; keep it concise.", "type": 0, "is_positive": 0 },
  { "id": 40, "word": "you know", "text": "Limit this phrase for polished answers.", "type": 0, "is_positive": 0 },
  { "id": 41, "word": "so", "text": "Avoid overusing as a transition; get to the point.", "type": 0, "is_positive": 0 },
  { "id": 42, "word": "actually", "text": "Drop 'actually' to strengthen your statements.", "type": 0, "is_positive": 0 },
  { "id": 43, "word": "well", "text": "Use sparingly; focus on key points.", "type": 0, "is_positive": 0 },
  { "id": 44, "word": "ehm", "text": "Minimize this filler; pause confidently.", "type": 0, "is_positive": 0 },
  { "id": 45, "word": "uhm", "text": "Replace with a confident pause.", "type": 0, "is_positive": 0 }
];



let feedbackListNonVerbal = [
  { "id": 1, "text": "You maintained good eye contact throughout the interview.", "type": 1, "is_positive": 1 },
  { "id": 2, "text": "You avoided eye contact frequently; try to maintain it more.", "type": 1, "is_positive": 0 },
  { "id": 3, "text": "Your posture was confident and upright.", "type": 1, "is_positive": 1 },
  { "id": 4, "text": "You slouched at times; try to sit up straight.", "type": 1, "is_positive": 0 },
  { "id": 5, "text": "You used hand gestures effectively to emphasize key points.", "type": 1, "is_positive": 1 },
  { "id": 6, "text": "Your hand gestures were distracting; try to minimize them.", "type": 1, "is_positive": 0 },
  { "id": 7, "text": "Your facial expressions were warm and engaging.", "type": 1, "is_positive": 1 },
  { "id": 8, "text": "Your facial expressions seemed stiff; try to relax more.", "type": 1, "is_positive": 0 },
  { "id": 9, "text": "You nodded appropriately to show active listening.", "type": 1, "is_positive": 1 },
  { "id": 10, "text": "You nodded excessively, which became distracting.", "type": 1, "is_positive": 0 },
  { "id": 11, "text": "Your smile created a positive impression.", "type": 1, "is_positive": 1 },
  { "id": 12, "text": "You rarely smiled; try to appear more approachable.", "type": 1, "is_positive": 0 },
  { "id": 13, "text": "You maintained an appropriate distance from the interviewer.", "type": 1, "is_positive": 1 },
  { "id": 14, "text": "You leaned too far back, which seemed disengaged.", "type": 1, "is_positive": 0 },
  { "id": 15, "text": "Your handshake was firm and professional.", "type": 1, "is_positive": 1 },
  { "id": 16, "text": "Your handshake was weak; try to make it firmer.", "type": 1, "is_positive": 0 },
  { "id": 17, "text": "You maintained a calm demeanor under pressure.", "type": 1, "is_positive": 1 },
  { "id": 18, "text": "You fidgeted a lot; try to stay more composed.", "type": 1, "is_positive": 0 },
  { "id": 19, "text": "You made appropriate use of space while seated.", "type": 1, "is_positive": 1 },
  { "id": 20, "text": "You crossed your arms, which might appear defensive.", "type": 1, "is_positive": 0 },
  { "id": 21, "text": "Your body language conveyed enthusiasm and interest.", "type": 1, "is_positive": 1 },
  { "id": 22, "text": "You seemed closed off due to your posture.", "type": 1, "is_positive": 0 },
  { "id": 23, "text": "You maintained consistent and confident gestures.", "type": 1, "is_positive": 1 },
  { "id": 24, "text": "Your movements seemed rushed or nervous.", "type": 1, "is_positive": 0 },
  { "id": 25, "text": "You leaned forward slightly, showing interest.", "type": 1, "is_positive": 1 },
  { "id": 26, "text": "You leaned back excessively, appearing disinterested.", "type": 1, "is_positive": 0 },
  { "id": 27, "text": "Your attire was professional and well-presented.", "type": 1, "is_positive": 1 },
  { "id": 28, "text": "Your attire could have been more polished.", "type": 1, "is_positive": 0 },
  { "id": 29, "text": "You avoided unnecessary physical distractions.", "type": 1, "is_positive": 1 },
  { "id": 30, "text": "You played with your hair or accessories frequently.", "type": 1, "is_positive": 0 },
  { "id": 31, "text": "Your gestures matched your verbal communication.", "type": 1, "is_positive": 1 },
  { "id": 32, "text": "Your gestures sometimes contradicted your words.", "type": 1, "is_positive": 0 },
  { "id": 33, "text": "Your facial expressions matched your responses well.", "type": 1, "is_positive": 1 },
  { "id": 34, "text": "Your expressions sometimes seemed out of sync with your tone.", "type": 1, "is_positive": 0 },
  { "id": 35, "text": "You maintained a steady and natural breathing pattern.", "type": 1, "is_positive": 1 },
  { "id": 36, "text": "You appeared visibly tense at times.", "type": 1, "is_positive": 0 },
  { "id": 37, "text": "Your hand movements were purposeful.", "type": 1, "is_positive": 1 },
  { "id": 38, "text": "Your hands were hidden under the table too often.", "type": 1, "is_positive": 0 },
  { "id": 39, "text": "You showed active listening through subtle nods and expressions.", "type": 1, "is_positive": 1 },
  { "id": 40, "text": "You seemed distracted or distant at moments.", "type": 1, "is_positive": 0 },
  { "id": 41, "text": "Your overall demeanor was approachable and friendly.", "type": 1, "is_positive": 1 },
  { "id": 42, "text": "You seemed overly serious; try to relax a bit.", "type": 1, "is_positive": 0 },
  { "id": 43, "text": "You maintained appropriate facial engagement.", "type": 1, "is_positive": 1 },
  { "id": 44, "text": "You seemed to avoid facial expressions.", "type": 1, "is_positive": 0 },
  { "id": 45, "text": "Your sitting posture conveyed confidence.", "type": 1, "is_positive": 1 },
  { "id": 46, "text": "Your posture suggested discomfort.", "type": 1, "is_positive": 0 },
  { "id": 47, "text": "You used open hand gestures effectively.", "type": 1, "is_positive": 1 },
  { "id": 48, "text": "You kept your arms tightly crossed frequently.", "type": 1, "is_positive": 0 },
  { "id": 49, "text": "Your eye contact was balanced and natural.", "type": 1, "is_positive": 1 },
  { "id": 50, "text": "You avoided eye contact when answering difficult questions.", "type": 1, "is_positive": 0 },
  { "id": 51, "text": "You maintained a relaxed but professional posture.", "type": 1, "is_positive": 1 },
  { "id": 52, "text": "You appeared stiff and rigid in your seating posture.", "type": 1, "is_positive": 0 },
  { "id": 53, "text": "Your smile helped create a friendly atmosphere.", "type": 1, "is_positive": 1 },
  { "id": 54, "text": "Your lack of facial expression made you seem disengaged.", "type": 1, "is_positive": 0 },
  { "id": 55, "text": "You had good control over nervous habits.", "type": 1, "is_positive": 1 },
  { "id": 56, "text": "You tapped your feet frequently, which was distracting.", "type": 1, "is_positive": 0 },
  { "id": 57, "text": "Your hand movements felt natural and expressive.", "type": 1, "is_positive": 1 },
  { "id": 58, "text": "Your hands remained in your lap for most of the interview.", "type": 1, "is_positive": 0 },
  { "id": 59, "text": "Your head nodding showed engagement and understanding.", "type": 1, "is_positive": 1 },
  { "id": 60, "text": "You tilted your head thoughtfully during key moments.", "type": 1, "is_positive": 1 },
  { "id": 61, "text": "You maintained a neutral but attentive facial expression.", "type": 1, "is_positive": 1 },
  { "id": 62, "text": "You avoided physical barriers, like crossing arms tightly.", "type": 1, "is_positive": 1 },
  { "id": 63, "text": "Your feet were firmly planted, showing confidence.", "type": 1, "is_positive": 1 },
  { "id": 64, "text": "You seemed fidgety with your fingers.", "type": 1, "is_positive": 0 },
  { "id": 65, "text": "Your gestures were confident and purposeful.", "type": 1, "is_positive": 1 },
  { "id": 66, "text": "You avoided leaning too far into the interviewer's space.", "type": 1, "is_positive": 1 },
  { "id": 67, "text": "You maintained a calm and steady breathing rhythm.", "type": 1, "is_positive": 1 },
  { "id": 68, "text": "You sighed audibly a few times, indicating stress.", "type": 1, "is_positive": 0 },
  { "id": 69, "text": "Your sitting posture demonstrated readiness and focus.", "type": 1, "is_positive": 1 },
  { "id": 70, "text": "You played with your pen or other items frequently.", "type": 1, "is_positive": 0 },
  { "id": 71, "text": "Your open palm gestures added credibility to your points.", "type": 1, "is_positive": 1 },
  { "id": 72, "text": "You avoided making large, exaggerated gestures.", "type": 1, "is_positive": 1 },
  { "id": 73, "text": "Your shoulders were relaxed and not tense.", "type": 1, "is_positive": 1 },
  { "id": 74, "text": "Your shoulders seemed hunched, suggesting low confidence.", "type": 1, "is_positive": 0 },
  { "id": 75, "text": "Your facial expressions conveyed active interest.", "type": 1, "is_positive": 1 },
  { "id": 76, "text": "You scratched your head or face frequently, which was distracting.", "type": 1, "is_positive": 0 },
  { "id": 77, "text": "You maintained consistent physical presence and focus.", "type": 1, "is_positive": 1 },
  { "id": 78, "text": "You occasionally seemed distracted by background elements.", "type": 1, "is_positive": 0 },
  { "id": 79, "text": "Your neutral expressions during pauses were professional.", "type": 1, "is_positive": 1 },
  { "id": 80, "text": "You avoided fidgeting with your chair or desk.", "type": 1, "is_positive": 1 },
  { "id": 81, "text": "Your body was aligned and facing the interviewer.", "type": 1, "is_positive": 1 },
  { "id": 82, "text": "You turned away slightly at times, reducing engagement.", "type": 1, "is_positive": 0 },
  { "id": 83, "text": "Your head was held high, projecting confidence.", "type": 1, "is_positive": 1 },
  { "id": 84, "text": "You looked down often, which could suggest nervousness.", "type": 1, "is_positive": 0 },
  { "id": 85, "text": "You leaned slightly forward when discussing key topics.", "type": 1, "is_positive": 1 },
  { "id": 86, "text": "You folded your arms when facing challenging questions.", "type": 1, "is_positive": 0 },
  { "id": 87, "text": "You showed engagement through subtle facial cues.", "type": 1, "is_positive": 1 },
  { "id": 88, "text": "You avoided crossing your legs frequently.", "type": 1, "is_positive": 1 },
  { "id": 89, "text": "Your physical energy matched your verbal enthusiasm.", "type": 1, "is_positive": 1 },
  { "id": 90, "text": "You avoided excessive leaning on the table.", "type": 1, "is_positive": 1 },
  { "id": 91, "text": "You maintained stillness without appearing rigid.", "type": 1, "is_positive": 1 },
  { "id": 92, "text": "You seemed physically comfortable in the space.", "type": 1, "is_positive": 1 },
  { "id": 93, "text": "Your facial expressions adapted well to different questions.", "type": 1, "is_positive": 1 },
  { "id": 94, "text": "You frequently adjusted your seating position.", "type": 1, "is_positive": 0 },
  { "id": 95, "text": "Your gestures added clarity to your verbal points.", "type": 1, "is_positive": 1 },
  { "id": 96, "text": "Your physical cues matched your confidence level.", "type": 1, "is_positive": 1 },
  { "id": 97, "text": "You avoided over-expressive hand gestures.", "type": 1, "is_positive": 1 },
  { "id": 98, "text": "Your posture remained consistent throughout the interview.", "type": 1, "is_positive": 1 },
  { "id": 99, "text": "You made good use of natural pauses and stillness.", "type": 1, "is_positive": 1 },
  { "id": 100, "text": "Your physical demeanor supported your overall confidence.", "type": 1, "is_positive": 1 }
]



