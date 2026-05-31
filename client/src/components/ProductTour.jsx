import React, { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useLocation } from 'react-router-dom';
import API from '../api/axios';

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
};

export default function ProductTour() {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);
  const location = useLocation();

  useEffect(() => {
    const checkTourState = async () => {
      // 1. Landing Page Pre-Login Tour
      if (location.pathname === "/") {
        const hasSeenLandingTour = localStorage.getItem('sora_has_seen_landing_tour');
        if (!hasSeenLandingTour) {
          setSteps([
            {
              target: 'body',
              placement: 'center',
              content: 'Welcome to Sora! Let\'s give you a quick tour of what we\'ve built.',
              title: 'Welcome to Sora',
              disableBeacon: true,
            },
            {
              target: '#tour-login-btn',
              content: 'Start your journey here by creating a profile or logging in.',
              title: 'Get Started',
              placement: 'bottom',
            }
          ]);
          // Short delay to ensure DOM is ready
          setTimeout(() => setRun(true), 500);
        }
      } 
      // 2. Candidate Dashboard Post-Login Tour
      else if (location.pathname === "/candidate-dashboard") {
        try {
          const res = await API.get('/profile/me', getAuthHeaders());
          if (res.data && res.data.hasSeenTour === false) {
            setSteps([
              {
                target: '#tour-adaptive-practice',
                content: 'Warm up your skills with our story-driven, interactive AI practice environment. Get instant FAANG-calibrated feedback.',
                title: 'Adaptive Problem Solver',
                placement: 'bottom',
                disableBeacon: true,
              },
              {
                target: '#tour-schedule',
                content: 'Ready for the real thing? Book a live 1-on-1 interview with verified FAANG engineers here.',
                title: 'Schedule Sessions',
                placement: 'right',
              },
              {
                target: '#tour-feedback',
                content: 'Review your past recordings and detailed performance reports to track your growth over time.',
                title: 'Performance & Feedback',
                placement: 'top',
              },
              {
                target: '#tour-profile',
                content: 'Complete your profile to get matched with the best interviewers for your specific domain.',
                title: 'Your Profile',
                placement: 'left',
              }
            ]);
            setTimeout(() => setRun(true), 500);
          }
        } catch (err) {
          console.error("Could not fetch profile for tour", err);
        }
      }
    };

    checkTourState();
  }, [location.pathname]);

  const handleJoyrideCallback = async (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      
      if (location.pathname === "/") {
        localStorage.setItem('sora_has_seen_landing_tour', 'true');
      } else if (location.pathname === "/candidate-dashboard") {
        try {
          await API.patch('/profile/tour', {}, getAuthHeaders());
        } catch (err) {
          console.error("Failed to mark tour as completed in DB", err);
        }
      }
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#10b981', // emerald-500
          backgroundColor: '#09090b',
          textColor: '#ffffff',
          arrowColor: '#09090b',
        },
        buttonClose: {
          display: 'none',
        },
        buttonNext: {
          backgroundColor: '#10b981',
          color: '#ffffff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#a1a1aa',
          marginRight: '8px',
        },
        buttonSkip: {
          color: '#a1a1aa',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '8px',
        }
      }}
    />
  );
}
