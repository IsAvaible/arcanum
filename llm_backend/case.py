from pydantic import Field, BaseModel, ValidationError

#maybe for future use
class CaseAttachment(BaseModel):
    id: int = Field(
        ...,
        description="A unique numeric identifier for the file within the system."
    )
    glossary: list[str] = Field(
        ...,
        description="A list of all the glossary terms in this attachment."
    )
"""  filename: str = Field(
        ...,
        description="The name of the file, including its extension (e.g., 'document.pdf'), as stored in the system."
    )
    filepath: str = Field(
        ...,
        description="The full path to the file's location on the system, specifying where the file is stored."
    )
    filehash: str = Field(
        ...,
        description="A unique hash generated for the file to verify its integrity and identify its contents."
    )
"""
# defining the desired output of the llm
class Case(BaseModel):
    title: str = Field(
        ...,
        description="A short, clear summary of the case. This should provide a concise idea of the issue at hand.",
    )
    description: str = Field(
        ...,
        description="A detailed explanation of the case, including relevant background information, context necessary for understanding the problem but no solution. Include granular Timestamps from Audio files!",
    )
    solution: str = Field(
        ...,
        description="A proposed or implemented solution to address the case. Include all possible solutions you can find! If not yet resolved, this can include potential steps or approaches to consider. Include granular Timestamps from Audio files!",
    )
    """assignee: list[str] = Field(
        ...,
        description="The name or identifier of the person responsible for handling or resolving the case.",
    )"""
    status: str = Field(
        ...,
        description="The current state of the case, such as 'Open', 'In Progress', 'Solved' or 'Closed' to track its progression.",
    )
    attachments: list[CaseAttachment] = Field(
        ...,
        description="All the Attachments that were used to generate this Case.",
    )
    glossary: list[str] = Field(
        ...,
        description="All the Glossary terms used for generating this case",
    )


class CaseArray(BaseModel):
    cases: list[Case] = Field(..., description="A list of one or multiple cases.")

def check_if_output_is_valid(chain_output):
    try:
        # This will validate the output and raise an error if any required field is missing
        CaseArray.model_validate(chain_output)

        return True
    except ValidationError as e:
        print("Validation error", e.json())

        return False