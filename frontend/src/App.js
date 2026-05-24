import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import StepOne from './components/StepOne';
import StepTwo from './components/StepTwo';
import StepThree from './components/StepThree';
import YourPlanScreen from './pages/YourPlanScreen';
import PlanDetailView from './pages/PlanDetailView';
import { planService } from './services/planService'; // حتماً این ایمپورت را چک کنید
import './App.css';
import PersonalityPage from './pages/PersonalityPage';

const STAGE = {
    HOME: 'home',
    STEP_1: 'step1',
    STEP_2: 'step2',
    STEP_3: 'step3',
    YOUR_PLAN: 'your_plan',
    VIEW_DETAILS: 'view_details',
    PERSONALITY: 'personality'
};

function App() {
    const [currentStage, setCurrentStage] = useState(STAGE.HOME);
    const [planData, setPlanData] = useState({});
    const [llmPlanOutput, setLlmPlanOutput] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);

    const updatePlanData = (newData) => {
        setPlanData(prev => ({ ...prev, ...newData }));
    };

    const handleSelectPlan = async (planSummary) => {
    try {
        setSelectedPlan(null); 
        
        console.log("Fetching plan ID:", planSummary.id);
        
        const fullPlanData = await planService.fetchPlanDetails(planSummary.id);
        
        setSelectedPlan(fullPlanData);
        setCurrentStage(STAGE.VIEW_DETAILS);
    } catch (error) {
        console.error("Failed to fetch plan details:", error);
        alert("خطا در دریافت اطلاعات برنامه.");
    }
};

    const renderStage = () => {
        switch (currentStage) {
            case STAGE.HOME:
                return (
                    <HomePage 
                        onStartNewPlan={() => setCurrentStage(STAGE.STEP_1)} 
                        onSelectPlan={handleSelectPlan} 
                        onGoToPersonality={() => setCurrentStage(STAGE.PERSONALITY)}
                    />
                );

            case STAGE.VIEW_DETAILS:
                return (
                    <PlanDetailView 
                        plan={selectedPlan} 
                        onBack={() => {
                            setSelectedPlan(null);
                            setCurrentStage(STAGE.HOME);
                        }} 
                    />
                );

            case STAGE.STEP_1:
                return (
                    <StepOne 
                        planData={planData} 
                        updateData={updatePlanData}
                        onNext={() => setCurrentStage(STAGE.STEP_2)}
                        onBack={() => setCurrentStage(STAGE.HOME)}
                    />
                );

            case STAGE.STEP_2:
                return (
                    <StepTwo 
                        planData={planData} 
                        updateData={updatePlanData}
                        onNext={() => setCurrentStage(STAGE.STEP_3)}
                        onBack={() => setCurrentStage(STAGE.STEP_1)}
                    />
                );

            case STAGE.STEP_3:
                 return (
                    <StepThree
                        planData={planData}
                        updateData={updatePlanData}
                        onNext={() => setCurrentStage(STAGE.YOUR_PLAN)}
                        onBack={() => setCurrentStage(STAGE.STEP_2)}
                        setLlmPlanOutput={setLlmPlanOutput}
                    />
                );

            case STAGE.YOUR_PLAN:
                return (
                    <YourPlanScreen
                        planData={planData}
                        llmPlanOutput={llmPlanOutput}
                        onConfirm={() => {
                            setLlmPlanOutput(null);
                            setCurrentStage(STAGE.HOME);
                        }}
                        onBackToForm={() => setCurrentStage(STAGE.STEP_3)}
                        setLlmPlanOutput={setLlmPlanOutput}
                        updatePlanData={updatePlanData}
                    />
                    );

            case STAGE.PERSONALITY:
                return <PersonalityPage onBack={() => setCurrentStage(STAGE.HOME)} />;
            
            default:
                return <HomePage onStartNewPlan={() => setCurrentStage(STAGE.STEP_1)} />;
        }
    };

    return (
        <div className="App-container">
            {renderStage()}
        </div>
    );
}

export default App;