import { customError } from "../../server/model.mjs";

const SERVER_URL = 'http://localhost:3001';

/** JOB ROLES */

const getJobRoles = async () => {
  const response = await fetch(SERVER_URL + '/api/jobs', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });

  if (response.ok) {
    const result = await response.json();
    return result;
  }
  else {
    const errMessage = await response.json();
    throw new customError(response.status, errMessage);
  }
}

const getJobRoleById = async (id) => {
  const response = await fetch(SERVER_URL + `/api/jobs/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });

  if (response.ok) {
    const result = await response.json();
    return result;
  }
  else {
    const errMessage = await response.json();
    throw new customError(response.status, errMessage);
  }
}

/** USERS */
const getUserInfo = async (id) => {
  const response = await fetch(SERVER_URL + `/api/users/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });

  if (response.ok) {
    const result = await response.json();
    return result;
  }
  else {
    const errMessage = await response.json();
    throw new customError(response.status, errMessage);
  }
}
const updateUserInfo = async (user) => {
  const response = await fetch(SERVER_URL + `/api/updateUserInfo/` + user.id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: user.id, voice: user.voice }),
    credentials: 'include'
  });

  if (!response.ok) {
    const errMessage = await response.json();
    throw new customError(response.status, errMessage);
  }
  else return null;
}


/** INTERVIEW SESSION APIs */
const getInterviewById = async (interviewId) => {
  const response = await fetch(`${SERVER_URL}/api/interviews/${interviewId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });

  if (response.ok) {
    const result = await response.json();
    return result;
  }
  else {
    const errMessage = await response.json();
    throw new customError(response.status, errMessage);
  }
}

const getNewInterview = async (data) => {
  const response = await fetch(`${SERVER_URL}/api/interview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_role_id: data.job_role_id,
      difficulty: data?.difficulty,
      n_questions: data?.n_questions
    }),
    credentials: 'include'
  });


  const isJSON = response.headers.get('content-type')?.includes('application/json');
  const responseBody = isJSON ? await response.json() : null;

  if (!response.ok) {
    throw new customError(response.status, responseBody || 'Unknown error');
  }

  if (!responseBody?.interview_id || !Array.isArray(responseBody.questions)) {
    throw new customError(500, 'Invalid response format from server');
  }

  return responseBody;
};

const getVerbal = async () => {
  const response = await fetch(`${SERVER_URL}/api/feedbackVerbal`);
  return await response.json();
};

const getNonVerbal = async () => {
  const response = await fetch(`${SERVER_URL}/api/feedbackNonVerbal`);
  return await response.json();
};

// send answer to server 
const addAnswer = async (interviewId, questionId, answer, video, verbalFeedback, nonVerbalFeedback, status, questionDuration, interviewDuration) => {
  return new Promise((resolve, reject) => {
    console.log(video);
    console.log(verbalFeedback);
    console.log(nonVerbalFeedback);
    
    const formData = new FormData();
    formData.append('video', video);
    formData.append('answer', answer);

    if (verbalFeedback && verbalFeedback.length > 0) {
      // Array.from(verbalFeedback).forEach((feedback) => {
      //   formData.append('verbalFeedback', JSON.stringify(feedback)); // Append each file individually
      // });
      formData.append('verbalFeedback', JSON.stringify(verbalFeedback)); // Append each file individually
    }
    
    if (nonVerbalFeedback && nonVerbalFeedback.length > 0) {
      // Array.from(nonVerbalFeedback).forEach((feedback) => {
      //   formData.append('nonVerbalFeedback', JSON.stringify(feedback)); // Append each file individually
      // });
        formData.append('nonVerbalFeedback', JSON.stringify(nonVerbalFeedback)); // Append each file individually
    }

    formData.append('questionDuration', questionDuration);

    formData.append('status', status);
    
    if(status === 1 && interviewDuration) 
      formData.append('interviewDuration', interviewDuration);
    
    fetch(`${SERVER_URL}/api/interview/${interviewId}/question/${questionId}/answer`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
    .then(response => {
      if (!response.ok) {
        throw new customError(response.status, 'Failed to submit answer');
      } else {
        return response.json();
      }
    })
    .then(data => {
      resolve(data);
    })
    .catch(err => {
      console.error("Error uploading video:", err);
      reject(err);
    });
});
}

// get answer from server

const getAnswer = async (interviewId, questionId) => {
  return new Promise((resolve, reject) => {
    fetch(`${SERVER_URL}/api/interviews/${interviewId}/questions/${questionId}/answer`, {
      method: 'GET',
      credentials: 'include',
    })
    .then(response => {
      if (!response.ok) {
        throw new customError(response.status, response.text());
      } else {
        return response.json();
      }
    })
    .then(data => {
      resolve(data);
    })
    .catch(err => {
      console.error("Error getting answer:", err);
      reject(err);
    });
  });
}

// get video from server

const getVideo = async (interviewId, questionId) => {
  return new Promise((resolve, reject) => {
    fetch(`${SERVER_URL}/api/interviews/${interviewId}/questions/${questionId}/video`, {
      method: 'GET',
      credentials: 'include',
    })
    .then(response => {
      if (!response.ok) {
        throw new customError(response.status, response.text());
      } else {
        return response.blob();
      }
    })
    .then(data => {
      resolve(data);
    })
    .catch(err => {
      console.error("Error getting answer:", err);
      reject(err);
    });
  });
}


/** MY INTERVIEWS **/
const getInterviews = async () => {
  const response = await fetch(SERVER_URL + '/api/interviews', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });

  if (response.ok) {
    const result = await response.json();
    return result;
  }
  else {
    const errMessage = await response.json();
    throw new customError(response.status, errMessage);
  }
}

const deleteInterview = async (interviewId) => {
  const response = await fetch(SERVER_URL + `/api/interviews/${interviewId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });

  if (!response.ok) {
    const errMessage = await response.json();
    throw new customError(response.status, errMessage);
  }
  else console.log('Interview #' + interviewId + ' deleted successfully');
}



/*** Cntribution************************************* */
const getAllQuestions = async () => {
  const response = await fetch(SERVER_URL + '/api/questions', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (response.ok) {
    const result = await response.json();
    return result;
  } else {
    const errMessage = await response.json();
    throw new customError(response.status, errMessage);
  }
};


const getQuestionsByUserId = async (userId) => {
  const response = await fetch(SERVER_URL + `/api/questions/${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (response.ok) {
    const result = await response.json();
    return result;
  } else {
    const errMessage = await response.json();
    throw new customError(response.status, errMessage);
  }
};

const addQuestion = async (question) => {
  const response = await fetch(SERVER_URL + '/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(question),
  });

  if (response.ok) {
    const result = await response.json();
    return result;
  } else {
    const errMessage = await response.json();
    throw new customError(response.status, errMessage);
  }
};


const deleteQuestion = async (id) => {
  const response = await fetch(SERVER_URL + `/api/questions/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (response.ok) {
    const result = await response.json();
    return result;
  } else {
    const errMessage = await response.json();
    throw new customError(response.status, errMessage);
  }
};


const editQuestion = async (id, updatedQuestion) => {
  const response = await fetch(SERVER_URL + `/api/questions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updatedQuestion),
  });

  if (response.ok) {
    const result = await response.json();
    return result;
  } else {
    const errMessage = await response.json();
    throw new customError(response.status, errMessage);
  }
};


// QUESTIONS

const getQuestionsByInterviewId = async (interviewId) => {
  const response = await fetch(SERVER_URL + `/api/interviews/${interviewId}/questions`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });

  if (response.ok) {
    const result = await response.json();
    return result;
  }
  else {
    const errMessage = await response.json();
    throw new customError(response.status, errMessage);
  }
}



const API = { getJobRoles, getInterviewById, getNewInterview, getJobRoleById, getVerbal, getNonVerbal, getInterviews, addAnswer, getAnswer, getVideo, getQuestionsByInterviewId, getAllQuestions, getQuestionsByUserId, addQuestion, deleteQuestion, editQuestion, getUserInfo, updateUserInfo, deleteInterview };
export default API;