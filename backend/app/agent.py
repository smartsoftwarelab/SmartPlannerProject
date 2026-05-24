# backend/app/agent.py

import os
import json
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel
from typing import List

os.environ["NO_PROXY"] = "*"
os.environ["no_proxy"] = "*"

# Load env
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
base_url = os.getenv("LLM_BASE_URL")
model_name = os.getenv("LLM_MODEL_NAME")

if not api_key:
    raise ValueError("OPENAI_API_KEY is missing")

llm = ChatOpenAI(
    temperature=0.5,
    api_key=api_key,
    base_url=base_url,
    model=model_name
)


class TaskSlot(BaseModel):
    name: str
    start_time: str  # "HH:MM"
    end_time: str    # "HH:MM"

class DaySchedule(BaseModel):
    date: str
    tasks: List[TaskSlot]

class StudyPlan(BaseModel):
    plan_overview: str
    daily_hours: str
    schedule: List[DaySchedule]

parser = PydanticOutputParser(pydantic_object=StudyPlan)
FORMAT_INSTRUCTIONS = parser.get_format_instructions()


CORE_TEMPLATE = """
You are a smart scheduling agent.

USER INPUTS:
Tasks: {tasks}
Timeframe: {timeframe}
Daily Hours: {daily_hours}
Preferences: {preferences}

General rules:
1. Use the exact task names provided. Do NOT rename, merge, invent, or split tasks. planning must be Persian.
2. Infer each task’s nature from its semantics. From the name alone, determine:
   - difficulty and cognitive load
   - whether it is deep work, regular work, or relaxing
   - whether it benefits from daily repetition, spaced repetition, or infrequent longer sessions
   - reasonable session lengths and weekly frequency
3. Tasks do NOT need equal time. Assign durations proportional to inferred complexity.
4. Tasks do NOT need to appear every day.  
   Examples:
   - Deep/complex tasks: longer but less frequent sessions.
   - Light, repetitive tasks: short daily or semi-daily sessions.
   - Relaxing tasks: short and typically scheduled in evening.
5. If user preferences contradict these rules, user preferences ALWAYS take priority.
And if Daily Hours equals to zero, you must suggest Daily Hours base on the tasks and plan every day with that Daily Hours.
Time-of-day rules (unless user preferences override):
- Morning: deep work, heavy focus.
- Afternoon: normal tasks.
- Evening: light or relaxing tasks.
- Never place heavy, stressful, or high-focus tasks late at night.

Daily schedule rules:
6. Every task must have explicit start_time and end_time formatted as HH:MM.
7. Leave reasonable breaks between tasks; tasks must not be tightly packed.
8. Daily_hours:
   - If provided: strictly enforce the daily maximum.
   - If missing: infer a reasonable default based on tasks and timeframe.
9. The ordering of tasks may vary across days and does NOT need to follow the same sequence.
10. Days do NOT need to be unique, but:
    - Days must NOT be copy-paste identical unless the task semantics justify a stable pattern.
    - Stability (similar days) is allowed only if the tasks require daily repetition with fixed sessions.
    - When days resemble each other, the model must implicitly justify this based on task types.
11. Some days may contain only one or two tasks, or even skip certain tasks entirely, if suitable for the task frequency.
12. Strictly respect the timeframe boundaries.
13. Output ONLY valid JSON matching the schema.

Additional instructions (may be empty):
{dynamic_instructions}

Required JSON output format:
{{
  "daily_hours": number,
  "schedule": [
    {{
      "date": "YYYY-MM-DD",
      "tasks": [
        {{
          "name": "task_name",
          "start_time": "HH:MM",
          "end_time": "HH:MM"
        }}
      ]
    }}
  ]
}}

Format instructions:
{format_instructions}
"""


base_prompt = PromptTemplate(
    input_variables=[
        "tasks",
        "start_date",
        "timeframe",
        "daily_hours",
        "preferences"
    ],
    template=CORE_TEMPLATE,
    partial_variables={"format_instructions": FORMAT_INSTRUCTIONS}
)

initial_prompt = base_prompt.partial(dynamic_instructions="")
plan_generation_chain = initial_prompt | llm | parser

REFINEMENT_NOTE_TEMPLATE = (
    "Refinement instructions:\n"
    "<refinement>\n{refinement_note}\n</refinement>"
)

def create_refine_chain(refinement_note: str):
    dynamic = REFINEMENT_NOTE_TEMPLATE.format(refinement_note=refinement_note)
    refine_prompt_partial = base_prompt.partial(dynamic_instructions=dynamic)
    return refine_prompt_partial | llm | parser



class ActionableStep(BaseModel):
    adjustment: str
    rationale: str

class BehavioralAnalysis(BaseModel):
    behavioral_snapshot: str
    strengths: List[str]
    risk_patterns: List[str]
    actionable_adjustments: List[ActionableStep]
    scope_notice: str

analysis_parser = PydanticOutputParser(pydantic_object=BehavioralAnalysis)

ANALYSIS_TEMPLATE = """
{role_and_rules}

USER HISTORY DATA:
{{history_data}}

OUTPUT STRUCTURE:
1. Behavioral Snapshot: Summarize patterns (Realism, Consistency, Overload response).
2. Evidence-Based Strengths: List strengths derived from data.
3. Risk Patterns: Describe behaviors that cause friction.
4. Actionable Adjustments: 2-4 concrete, low-effort changes.
5. Scope Notice: State limits of this analysis.
6. The final answer must be Persian.

{format_instructions}
"""

role_and_rules = """
You are a behavioral analysis engine...
"""

analysis_prompt = PromptTemplate(
    template=ANALYSIS_TEMPLATE.format(
        role_and_rules=role_and_rules,
        format_instructions="{format_instructions}"
    ),
    input_variables=["history_data"],
    partial_variables={"format_instructions": analysis_parser.get_format_instructions()}
)

behavior_analysis_chain = analysis_prompt | llm | analysis_parser