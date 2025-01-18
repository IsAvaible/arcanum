from enum import Enum

from pydantic import Field, BaseModel, ValidationError

class CaseStatus(str, Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    SOLVED = "Solved"
    CLOSED = "Closed"

class CaseType(str, Enum):
    PROBLEM = "Problem"
    INCIDENT = "Incident"
    CHANGE = "Change"
    FAQ = "FAQ"


class CasePriority(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


# maybe for future use
class CaseAttachment(BaseModel):
    id: int = Field(
        ...,
        description="A unique numeric identifier for the file within the system."
    )


# defining the desired output of the llm
class Case(BaseModel):
    title: str = Field(
        ...,
        description="A short, clear summary of the case. This should provide a concise idea of the issue at hand.",
    )
    description: str = Field(
        ...,
        description="A detailed explanation of the case, including relevant background information, context necessary for understanding the problem but no solution. Include granular Timestamps from Audio transcriptions ONLY!",
    )
    solution: str = Field(
        ...,
        description="A proposed or implemented solution to address the case. Include all possible solutions you can find! If not yet resolved, this can include potential steps or approaches to consider. Include granular Timestamps from Audio transcriptions ONLY!",
    )
    status: CaseStatus = Field(
        ...,
        description="The current state of the case, such as 'Open', 'In Progress', 'Solved' or 'Closed' to track its progression.",
    )
    case_type: CaseType = Field(
        ...,
        description="The Type of a case, such as 'Problem', 'Incident', 'Change', 'FAQ'.",
    )
    priority: CasePriority = Field(
        ...,
        description="The Priority of the case, such as 'High', 'Medium', 'Low'.",
    )
    attachments: list[CaseAttachment] = Field(
        ...,
        description="All the Attachments that were used to generate this Case.",
    )


class CaseArray(BaseModel):
    cases: list[Case] = Field(..., description="A list of only one case.", min_length=1, max_length=1)

def check_if_output_is_valid(chain_output):
    try:
        # This will validate the output and raise an error if any required field is missing
        CaseArray.model_validate(chain_output)

        return True
    except ValidationError as e:
        print("Validation error", e.json())

        return False