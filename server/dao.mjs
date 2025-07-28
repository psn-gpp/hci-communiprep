import { customError } from '../server/model.mjs';
import { db } from '../server/db.mjs';
import dayjs from 'dayjs';
import { get } from 'http';

/**
 * 
 * @returns 
 */

/** JOB ROLES */

export const getJobRoles = () => {
    return new Promise((resolve, reject) => {
        const sql = 'select * from job_roles where id != 3';
        db.all(sql, [], (err, row) => {
            if (err)
                reject(new customError(500, err))
            else if (row === undefined) {
                resolve([]);
            }
            else {

                resolve(row);
            }
        });
    });
}

export const getJobRoleById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = 'select * from job_roles where id = ?';
        db.get(sql, [id], (err, row) => {
            if (err)
                reject(new customError(500, err))
            else if (row === undefined) {
                resolve([]);
            }
            else {
                resolve(row);
            }
        });
    });
}

/** USERS */
export const getUserInfo = (id) => {
    return new Promise((resolve, reject) => {
        const sql = 'select * from users where id = ?';
        db.get(sql, [id], (err, row) => {
            if (err)
                reject(new customError(500, err))
            else if (row === undefined) {
                resolve([]);
            }
            else {
                resolve(row);
            }
        });
    });
}

export const updateUser = (id, voice) => {
    return new Promise((resolve, reject) => {
        const sql = 'update users set avatar_voice = ? where id = ?';
        db.run(sql, [voice, id], function (err) {
            if (err) {
                reject(new customError(500, err));
            } else {
                resolve(this.changes);
            }
        });

    });
}

/** INTERVIEWS */

export const getInterviewById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM interviews WHERE id = ?";
        db.get(sql, [id], (err, row) => {
            if (err) {
                return reject(new customError(500, err.message));
            }
            resolve(row);
        });
    });
};

export const addInterviewAndQuestions = (job_role_id, difficulty, n_questions) => {
    const today = dayjs().format("YYYY-MM-DD HH:mm:ss");

    const defaultDifficulty = null;
    const defaultNQuestions = 4;

    const finalDifficulty = difficulty ?? defaultDifficulty;
    const finalNQuestions = n_questions ?? defaultNQuestions;

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            const sqlInsertInterview = `
                INSERT INTO INTERVIEWS(user_id, job_role_id, difficulty, n_questions, status, date)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            db.run(sqlInsertInterview, [2, job_role_id, finalDifficulty, finalNQuestions, 0, today], function (err) {
                if (err) {
                    console.error('Error inserting interview:', err.message);
                    db.run('ROLLBACK');
                    return reject(new customError(500, err.message));
                }

                const interview_id = this.lastID;

                const questions = [];

                const sqlSelectJobRole3 = `
                    SELECT id, question_text, difficulty, duration_minutes, duration_seconds 
                    FROM questions
                    WHERE job_role_id = 3
                `;

                const sqlSelectOtherJobRole = `
                    SELECT id, question_text, difficulty, duration_minutes, duration_seconds
                    FROM questions
                    WHERE job_role_id = :jobRoleId AND job_role_id != 3
                    AND (:difficulty IS NULL OR difficulty = :difficulty)
                    ORDER BY RANDOM()
                    LIMIT :n
                `;

                // job_role_id = 3
                db.all(sqlSelectJobRole3, (err, rows1) => {
                    if (err) {
                        console.error('Error fetching questions for job_role_id 3:', err.message);
                        db.run('ROLLBACK');
                        return reject(new customError(500, err.message));
                    }

                    questions.push(...rows1);

                    // job role questions
                    const params = {
                        ':jobRoleId': job_role_id,
                        ':difficulty': finalDifficulty,
                        ':n': finalNQuestions - 2,
                    };

                    db.all(sqlSelectOtherJobRole, params, (err, rows2) => {
                        if (err) {
                            console.error('Error fetching other job role questions:', err.message);
                            db.run('ROLLBACK');
                            return reject(new customError(500, err.message));
                        }

                        questions.push(...rows2);

                        if (questions.length === 0) {
                            console.warn('No questions found for the given criteria.');
                            db.run('COMMIT');
                            return resolve({ interview_id, questions: [] });
                        }

                        const questionPromises = questions.map((q) => {
                            return new Promise((resolveInsert, rejectInsert) => {
                                const sqlInsertQuestions = `
                                    INSERT INTO interview_questions(interview_id, question_id, is_answered, answer)
                                    VALUES (?, ?, ?, ?)
                                `;
                                db.run(sqlInsertQuestions, [interview_id, q.id, false, null], function (err) {
                                    if (err) {
                                        console.error('Error inserting interview question:', err.message);
                                        return rejectInsert(new customError(500, err.message));
                                    }
                                    resolveInsert();
                                });
                            });
                        });

                        Promise.all(questionPromises)
                            .then(() => {
                                db.run('COMMIT');
                                resolve({
                                    interview_id,
                                    questions: questions.map((q) => ({
                                        id: q.id,
                                        question_text: q.question_text,
                                        difficulty: q.difficulty,
                                        duration: q.duration_minutes * 60 + q.duration_seconds,
                                    })),
                                });
                            })
                            .catch((err) => {
                                console.error('Transaction Error:', err.message);
                                db.run('ROLLBACK');
                                reject(new customError(500, err.message));
                            });
                    });
                });
            });
        });
    });
};


export const getAllInterviews = () => {
    return new Promise((resolve, reject) => {
        const sql = `
                SELECT 
                    w.id AS interview_id, 
                    w.difficulty AS interview_difficulty,
                    w.date,
                    w.status,
                    w.n_questions,
                    jr.name AS role_name,
                    q.id AS question_id,
                    q.question_text,
                    q.difficulty AS question_difficulty,
                    (q.duration_minutes * 60 + q.duration_seconds) AS total_duration_seconds,
                    wq.is_answered
                FROM Interviews w
                JOIN interview_questions wq ON w.id = wq.interview_id
                JOIN Job_Roles jr ON w.job_role_id = jr.id
                JOIN Questions q ON wq.question_id = q.id
				
            `;

        db.all(sql, [], (err, rows) => {
            if (err) {
                return reject(new customError(500, err.message));
            }

            const interviews = {};

            rows.forEach(row => {
                if (!interviews[row.interview_id]) {
                    interviews[row.interview_id] = {
                        interview_id: row.interview_id,
                        role_name: row.role_name,
                        interview_difficulty: row.interview_difficulty,
                        date: row.date,
                        status: row.status,
                        n_questions: row.n_questions,
                        questions: []
                    };
                }

                interviews[row.interview_id].questions.push({
                    id: row.question_id,
                    question_text: row.question_text,
                    difficulty: row.question_difficulty,
                    duration: row.total_duration_seconds,
                    is_answered: row.is_answered,
                });
            });

            const interviewList = Object.values(interviews);

            resolve(interviewList);
        });
    });
};

export const deleteInterview = (id) => {
    return new Promise((resolve, reject) => {
        const sql = "DELETE FROM Interviews WHERE id = ?";
        db.run(sql, [id], function (err) {
            if (err) {
                return reject(new customError(500, err.message));
            }
            resolve({ message: "Interview deleted successfully" });
        });
    });
};



// AFTER-ANSWER FUNCTIONS (WHEN CLICK ON 'NEXT QUESTION')

export const setCompletedInterview = (id, duration) => {
    return new Promise((resolve, reject) => {
        const sql = "UPDATE Interviews SET status = 1, duration = ? WHERE id = ?";
        db.run(sql, [duration, id], function (err) {
            if (err) {
                return reject(new customError(500, err.message));
            }
            resolve({ message: "Interview completed successfully" });
        });
    });
};

export const addAnswer = (interview_id, question_id, answer, duration) => {
    return new Promise((resolve, reject) => {
        const sql = "UPDATE interview_questions SET is_answered = 1, answer = ?, duration = ? WHERE interview_id = ? AND question_id = ?";
        db.run(sql, [answer, duration, interview_id, question_id], function (err) {
            if (err) {
                return reject(new customError(500, err.message));
            }
            resolve({ id: this.lastID, message: "Answer added successfully" });
        });
    });
}

export const getInterviewQuestionId = (interview_id, question_id) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT id FROM interview_questions WHERE interview_id = ? AND question_id = ?";
        db.get(sql, [interview_id, question_id], (err, row) => {
            if (err) {
                return reject(new customError(500, err.message));
            }
            resolve(row.id);
        });
    });
}

export const addVerbalFeedback = (interview_question_id, feedback, is_positive, seconds) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO Interview_Feedbacks(interview_question_id, text, type, is_positive, seconds) VALUES (?, ?, 0, ?, ?)";
        db.run(sql, [interview_question_id, feedback, is_positive, seconds], function (err) {
            if (err) {
                return reject(new customError(500, err.message));
            }
            resolve({ message: "Verbal feedback added successfully" });
        });
    });
}

export const addNonVerbalFeedback = (interview_question_id, feedback, is_positive, seconds) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO Interview_Feedbacks(interview_question_id, text, type, is_positive, seconds) VALUES (?, ?, 1, ?, ?)";
        db.run(sql, [interview_question_id, feedback, is_positive, seconds], function (err) {
            if (err) {
                return reject(new customError(500, err.message));
            }
            resolve({ message: "Verbal feedback added successfully" });
        });
    });
}

export const getInterviewQuestions = (interview_id) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM interview_questions WHERE interview_id = ?";
        db.all(sql, [interview_id], (err, rows) => {
            if (err) {
                return reject(new customError(500, err.message));
            }
            resolve(rows);
        });
    });
}

export const getInterviewQuestionVerbalFeedbacks = (interview_question_id) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM Interview_Feedbacks WHERE interview_question_id = ? AND type = 0";
        db.all(sql, [interview_question_id], (err, rows) => {
            if (err) {
                return reject(new customError(500, err.message));
            }
            resolve(rows);
        });
    });
}

export const getInterviewQuestionNonVerbalFeedbacks = (interview_question_id) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM Interview_Feedbacks WHERE interview_question_id = ? AND type = 1";
        db.all(sql, [interview_question_id], (err, rows) => {
            if (err) {
                return reject(new customError(500, err.message));
            }
            resolve(rows);
        });
    });
}


// QUESTIONS

export const getQuestionsByInterviewId = (interview_id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT q.id, q.question_text, q.difficulty, iq.is_answered
            FROM interview_questions iq
            JOIN questions q ON iq.question_id = q.id
            WHERE iq.interview_id = ?
        `;
        db.all(sql, [interview_id], (err, rows) => {
            if (err) {
                return reject(new customError(500, err.message));
            }
            resolve(rows);
        });
    });
}

// ANSWERS

export const getAnswer = (interview_id, question_id) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT id, is_answered, answer FROM interview_questions WHERE interview_id = ? AND question_id = ?";
        db.get(sql, [interview_id, question_id], (err, row) => {
            if (err) {
                return reject(new customError(500, err.message));
            }
            resolve(row);
        });
    });
}

export const getVerbalFeedback = (interview_question_id) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT text, seconds, is_positive FROM Interview_Feedbacks WHERE interview_question_id = ? AND type = 0";
        db.all(sql, [interview_question_id], (err, rows) => {
            if (err) {
                return reject(new customError(500, err.message));
            }
            resolve(rows);
        });
    });
}

export const getNonVerbalFeedback = (interview_question_id) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT text, seconds, is_positive FROM Interview_Feedbacks WHERE interview_question_id = ? AND type = 1";
        db.all(sql, [interview_question_id], (err, rows) => {
            if (err) {
                return reject(new customError(500, err.message));
            }
            resolve(rows);
        });
    });
}


// Contribution *******************************
export const getAllQuestions = () => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM Questions";
        db.all(sql, [], (err, rows) => {
            if (err) {
                return reject(new customError(500, err.message));
            }
            resolve(rows);
        });
    });
};

export const getQuestionsByUserId = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM Questions WHERE user_id = ?';
        db.all(sql, [userId], (err, rows) => {
            if (err) {
                reject(new customError(500, err));
            } else {
                resolve(rows);
                console.log(rows);
            }
        });
    });
};

export const addQuestion = (question) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO Questions (user_id, job_role_id, question_text, duration_minutes, duration_seconds, difficulty) VALUES (?, ?, ?, ?, ?, ?)";
        const params = [2, question.job_role_id, question.question_text, question.duration_minutes, question.duration_seconds, question.difficulty];
        db.run(sql, params, function (err) {
            if (err) {
                return reject(new customError(500, err.message));
            }
            resolve({ message: "Question added successfully", id: this.lastID });
        });
    });
};

export const deleteQuestion = (id) => {
    return new Promise((resolve, reject) => {
        const sql = "DELETE FROM Questions WHERE id = ?";
        db.run(sql, [id], function (err) {
            if (err) {
                return reject(new customError(500, err.message));
            }
            if (this.changes === 0) {
                return reject(new customError(404, "Question not found"));
            }
            resolve({ message: "Question deleted successfully" });
        });
    });
};

export const editQuestion = (id, updatedQuestion) => {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE Questions 
                   SET job_role_id = ?, question_text = ?, duration_minutes = ?, duration_seconds = ?, difficulty = ? 
                   WHERE id = ?`;
        const params = [updatedQuestion.job_role_id, updatedQuestion.question_text, updatedQuestion.duration_minutes, updatedQuestion.duration_seconds, updatedQuestion.difficulty, id];
        db.run(sql, params, function (err) {
            if (err) {
                return reject(new customError(500, err.message));
            }
            if (this.changes === 0) {
                return reject(new customError(404, "Question not found"));
            }
            resolve({ message: "Question updated successfully" });
        });
    });
};

// *******************************************************