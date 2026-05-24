// frontend/src/services/planService.js
import axios from 'axios';

const API_URL = 'http://localhost:8000'; 

export const planService = {
    generatePlan: async (planInputData) => {
        const response = await axios.post(`${API_URL}/generate_plan/`, planInputData);
        return response.data;
    },

    refinePlan: async (planInputData, refinementNote) => {
        const payload = {
            plan_input: planInputData,
            refinement_note: refinementNote
        };

        const response = await axios.post(`${API_URL}/refine_plan/`, payload);
        return response.data;
    },
    
    savePlan: async (planInput, studyPlan) => {
        const payload = {
            plan_input: planInput,
            llm_plan: studyPlan
        };
        const response = await axios.post(`${API_URL}/save_plan/`, payload);
        return response.data;
    },

    fetchPlans: async () => {
        const response = await axios.get(`${API_URL}/plans/`);
        return response.data;
    },

    fetchPlanDetails: async (planId) => {
        const response = await axios.get(`${API_URL}/plans/${planId}`);
        return response.data;
    },

    toggleTaskCompletion: async (taskId) => {
        const response = await axios.put(`${API_URL}/tasks/${taskId}/complete`);
        return response.data;
    },

    deletePlan: async (planId) => {
        const response = await axios.delete(`${API_URL}/plans/${planId}`);
        return response.data;
    },

    updateTaskStatus: async (taskId) => {
        const response = await fetch(`http://localhost:8000/tasks/${taskId}/complete`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to update task status');
        }

        return response.json();
    }
};