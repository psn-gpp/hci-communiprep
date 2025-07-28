import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
import AppLayout from "./components/Layout.jsx";
import Home from "./components/Home.jsx";
import MyInterviews from "./components/Myinterviews.jsx";
import FeedbackPage from "./components/Feedback.jsx";
import Contributions from "./components/Contribution.jsx";
import Interview from "./components/Interview.jsx";
import TextToSpeech from "./components/TextToSpeach.jsx";
import { VoiceProvider } from "./components/VoiceContext.jsx";


function App() {

  return (
    <VoiceProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <AppLayout />
          }>
            <Route index element={
              <Home />
            } />
            <Route path="my-interviews" element={
              <MyInterviews />
            } />
            <Route path="contribution" element={
              <Contributions />
            } />
            <Route path="/feedback/:interviewId" element={
              <FeedbackPage />
            } />
            <Route path="/interview" element={
              <Interview />
            } />
            <Route path="/text" element={
              <TextToSpeech />
            } />
          </Route>
        </Routes>
      </Router>
    </VoiceProvider>
  );
}

export default App;
