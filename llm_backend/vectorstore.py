import os
import uuid
from dotenv import load_dotenv

from qdrant_client.models import VectorParams, Distance, PointStruct, Filter, FieldCondition, Range
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance
import numpy as np
from qdrant_client.models import PointStruct
from openai import AzureOpenAI

load_dotenv()

AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT_GPT = os.getenv("AZURE_DEPLOYMENT_GPT")
AZURE_DEPLOYMENT_EMBEDDING = os.getenv("AZURE_DEPLOYMENT_EMBEDDING")
OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION")

class QdrantVectorstore:
    def __init__(self, colletion_name="main_collection"):
        """
        Initialize the QdrantVectorstore with a collection name and setup the Azure OpenAI embeddings client.
        
        Args:
            colletion_name (str): The name of the collection to use in Qdrant.
        """
        self.client = QdrantClient(path="./.qdrantdb")
        self.collection_name = colletion_name
        self.llm_embeddings = AzureOpenAI(
            azure_endpoint=AZURE_ENDPOINT,
            azure_deployment=AZURE_DEPLOYMENT_EMBEDDING,
            api_version=OPENAI_API_VERSION,
        )
    
    def setup_collection(self, vector_size):
        """
        Setup a collection in Qdrant with the specified vector size if it does not already exist.
        
        Args:
            vector_size (int): The size of the vectors to store in the collection.
        """
        if not self.client.collection_exists(self.collection_name):
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
            )

    def create_embedding(self, string_to_embed):
        """
        Create an embedding for a given string using Azure OpenAI embeddings.
        
        Args:
            string_to_embed (str): The string to create an embedding for.
        
        Returns:
            list: The embedding vector for the input string.
        """
        response = self.llm_embeddings.embeddings.create(input=string_to_embed,model="text-embedding-ada-002")
        embedding = response.data[0].embedding

        return embedding
    
    def insert_embedding(self, embedding, text, metadata={}):
        vector_size = len(embedding)
        self.setup_collection(vector_size)

        unique_id = str(uuid.uuid4())

        self.client.upsert(
            collection_name=self.collection_name,
            points=[
                PointStruct(
                    id=unique_id,
                    vector=embedding,
                    payload={
                        "text": text,
                        "metadata": {**metadata},
                    }
                )
            ]
        )

    def insert_case(self, case):
        """
        Insert a case into the Qdrant collection.
        
        Args:
            case (dict): The case dictionary to insert.
        """
        case_string = self.case_to_string(case)
        
        # Generate Embedding
        case_embedding = self.llm_embeddings.embeddings.create(input=case_string,model="text-embedding-ada-002")
        case_embedding = case_embedding.data[0].embedding

        self.insert_embedding(embedding=case_embedding, text=case_string)
        print("Case added to Qdrant collection.")

    def search_vectors(self, query_vector, limit, filter_condition):
        """
        Search for vectors in the collection that match the query vector and filter condition.
        
        Args:
            query_vector (list): The query vector to search for.
            limit (int): The maximum number of results to return.
            filter_condition (FieldCondition): The filter condition to apply to the search.
        
        Returns:
            list: The search results.
        """
        query_filter = Filter(must=[filter_condition]) if filter_condition else None
        hits = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            query_filter=query_filter,
            limit=limit
        )
        return hits
    
    def search_similar_cases(self, case, limit=5, filter_condition=None):
        case_string = self.case_to_string(case)
        case_embedding = self.create_embedding(case_string)

        return self.search_vectors(case_embedding, limit, filter_condition)
    
    def search_case_from_query(self, query, limit=5, filter_condition=None):
        embedding = self.create_embedding(query)

        return self.search_vectors(embedding, limit, filter_condition)
    
    def case_to_string(self, case_dict):
        """
        Convert a case dictionary to a string representation.
        
        Args:
            case_dict (dict): The case dictionary to convert.
        
        Returns:
            str: The string representation of the case.
        """
        case_string = ""
        
        ordered_keys = ['title', 'description', 'solution', 'assignee', 'status', 'attachments']  # Order to save the keys in
        
        # Add the ordered keys first
        for key in ordered_keys:
            if key in case_dict:
                value = str(case_dict[key])
                case_string += str(key.upper()) + ":\n" + str(value) + "\n\n"
        
        # Add the rest of the keys (that are not in ordered_keys) at the end
        for key in case_dict:
            if key not in ordered_keys:
                value = str(case_dict[key])
                case_string += str(key.upper()) + ":\n" + str(value) + "\n\n"
        
        return case_string

    def show_all_entries(self):
        return self.client.scroll(collection_name=self.collection_name, scroll_filter=None)[0]

    def show_all_collections(self):
        return self.client.list_collections()

    def delete_entry(self, point_id):
        self.client.delete(collection_name=self.collection_name, points_selector=[point_id])

    def delete_entries(self, point_ids):
        self.client.delete(collection_name=self.collection_name, points_selector=point_ids)


