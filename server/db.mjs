import sqlite from 'sqlite3';

export const db = new sqlite.Database('CommuniPrep.db', (err) => {
  if (err) throw err;
});

//db.serialize(() => {
 // db.all("SELECT name FROM sqlite_master WHERE type='table';", [], (err, tables) => {
   // if (err) {
      //console.error(err.message);
  //  } else {
      //console.log('Tables:', tables);
  //  }
  //});
//});


/*const db1 = new sqlite.Database('CommuniPrep.sqlite');

db.serialize(() => {
  db.run(`
INSERT INTO job_roles (name) VALUES
('Software Engineer'),
('Data Scientist'),
('Project Manager'),
('Product Manager'),
('UX Designer'),
('UI Designer'),
('Full Stack Developer'),
('Frontend Developer'),
('Backend Developer'),
('DevOps Engineer'),
('Cloud Engineer'),
('Database Administrator'),
('System Administrator'),
('IT Support Specialist'),
('Cybersecurity Analyst'),
('AI/ML Engineer'),
('Business Analyst'),
('Digital Marketing Specialist'),
('SEO Specialist'),
('Content Writer'),
('Technical Writer'),
('QA Engineer'),
('QA Automation Engineer'),
('Network Engineer'),
('Mobile App Developer'),
('iOS Developer'),
('Android Developer'),
('Game Developer'),
('Game Designer'),
('Blockchain Developer'),
('Embedded Systems Engineer'),
('Hardware Engineer'),
('Electrical Engineer'),
('Electronics Engineer'),
('Mechanical Engineer'),
('Civil Engineer'),
('Architect'),
('Data Engineer'),
('Data Architect'),
('Data Analyst'),
('Big Data Engineer'),
('Machine Learning Researcher'),
('Operations Manager'),
('Finance Manager'),
('Accountant'),
('HR Manager'),
('Recruiter'),
('Customer Support Specialist'),
('Sales Manager'),
('Sales Representative'),
('Marketing Manager'),
('Social Media Manager'),
('Video Editor'),
('Graphic Designer'),
('Animator'),
('3D Artist'),
('Interior Designer'),
('Fashion Designer'),
('Supply Chain Manager'),
('Logistics Coordinator'),
('Procurement Specialist'),
('Warehouse Manager'),
('Quality Control Inspector'),
('Production Manager'),
('Legal Advisor'),
('Paralegal'),
('Research Scientist'),
('Lab Technician'),
('Clinical Research Associate'),
('Pharmacist'),
('Nurse'),
('Doctor'),
('Surgeon'),
('Dentist'),
('Physiotherapist'),
('Fitness Trainer'),
('Dietitian'),
('Nutritionist'),
('Psychologist'),
('Counselor'),
('Teacher'),
('Professor'),
('Librarian'),
('Principal'),
('Event Manager'),
('Public Relations Specialist'),
('Translator'),
('Interpreter'),
('Tour Guide'),
('Chef'),
('Sous Chef'),
('Baker'),
('Bartender'),
('Waiter'),
('Housekeeper'),
('Driver'),
('Pilot'),
('Cabin Crew Member'),
('Mechanic'),
('Electrician'),
('Plumber'),
('Carpenter'),
('Welder'),
('Painter'),
('Construction Worker');

  `, (err) => {
    if (err) {
      console.error("Error creating table:", err.message);
    } else {
      console.log("Table 'Job_Roles' created or already exists.");
    }
  });
});*/