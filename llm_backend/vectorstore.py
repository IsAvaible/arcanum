import os
import uuid

from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct, Filter, FieldCondition

from app import app
from azure import get_embeddings
from preprocess_files import process_attachment


class QdrantVectorstore:
    def __init__(self, colletion_name="main_collection"):
        """
        Initialize the QdrantVectorstore with a collection name and setup the Azure OpenAI embeddings client.
        
        Args:
            colletion_name (str): The name of the collection to use in Qdrant.
        """
        self.client = QdrantClient(path=os.path.join(app.root_path, "qdrantdb"))
        self.collection_name = colletion_name
        self.llm_embeddings = get_embeddings()
        self.setup_collection(1536)  # 1536 is the default vector size for text-embedding-ada-002 embeddings

    def __enter__(self):
        # Initialize or open resources
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        # Clean up or close resources
        self.client.close()

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
        response = self.llm_embeddings.embeddings.create(input=string_to_embed, model="text-embedding-ada-002")
        embedding = response.data[0].embedding

        return embedding

    def insert_embedding(self, embedding, text, id=None, metadata={}):
        vector_size = len(embedding)
        self.setup_collection(vector_size)

        if not id:
            id = str(uuid.uuid4())

        self.client.upsert(
            collection_name=self.collection_name,
            points=[
                PointStruct(
                    id=id,
                    vector=embedding,
                    payload={
                        "text": text,
                        "metadata": {**metadata},
                    }
                )
            ]
        )

    def insert_case(self, case, id=None):
        """
        Insert a case into the Qdrant collection.
        
        Args:
            case (dict): The case dictionary to insert.
        """
        case_string = self.case_to_string(case)

        # Generate Embedding
        case_embedding = self.llm_embeddings.embeddings.create(input=case_string, model="text-embedding-ada-002")
        case_embedding = case_embedding.data[0].embedding

        metadata = {"case_id": id,
                    "inserttype": "case", }

        self.insert_embedding(embedding=case_embedding, id=id, text=case_string, metadata=metadata)
        print("Case added to Qdrant collection.")

    def insert_attachment(self, attachment):
        """
        Insert an attachment into the Qdrant collection.
        
        Args:
            attachment (dict): The attachment dictionary to insert.
        """
        if self.search_by_metadata("file_id", attachment["id"]):
            return

        file_dict = process_attachment(attachment)

        metadata = {
            "file_id": attachment["id"],
            "filename": attachment["filename"],
            "filepath": attachment["filepath"],
            "size": attachment["size"],
            "filehash": attachment["filehash"],
            "mimetype": attachment["mimetype"],
            "inserttype": "attachment-chunk"
        }

        for chunk_index, chunk in enumerate(file_dict["chunks"]):
            attachment_string = chunk

            response = self.llm_embeddings.embeddings.create(input=attachment_string, model="text-embedding-ada-002")
            attachment_embedding = response.data[0].embedding

            metadata["chunk_number"] = chunk_index + 1

            self.insert_embedding(embedding=attachment_embedding, text=attachment_string, metadata=metadata)

        print("Attachment added to Qdrant collection.")

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

    def search_from_query(self, query, limit=5, filter_condition=None):
        embedding = self.create_embedding(query)

        return self.search_vectors(embedding, limit, filter_condition)

    def search_by_metadata(self, key, value, limit=1):
        """
        Search for an entry in the collection with a specific key-value pair in the metadata.
        
        Args:
            key (str): The metadata key to search for.
            value (str): The value of the metadata key to search for.
            limit (int): The maximum number of results to return.
        
        Returns:
            list: The search results.
        """
        filter_condition = FieldCondition(
            key=f"metadata.{key}",
            match={"value": value}
        )
        # Get the vector size from the collection configuration
        collection_info = self.client.get_collection(self.collection_name)
        vector_size = collection_info.config.params.vectors.size
        default_query_vector = [0.0] * vector_size
        return self.search_vectors(query_vector=default_query_vector, limit=limit, filter_condition=filter_condition)

    def case_to_string(self, case_dict):
        """
        Convert a case dictionary to a string representation.
        
        Args:
            case_dict (dict): The case dictionary to convert.
        
        Returns:
            str: The string representation of the case.
        """
        case_string = ""

        ordered_keys = ['title', 'description', 'solution', 'assignee', 'status',
                        'attachments']  # Order to save the keys in

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

    def delete_all_entries_in_collection(self):
        entries = self.show_all_entries()
        point_ids = [entry.id for entry in entries]
        self.delete_entries(point_ids)



def vector_db_save_cases(request, vectorstore):
    case = request.get_json(force=True)
    attachments = case["attachments"]
    case["attachments"] = [attachment["id"] for attachment in attachments]

    vectorstore.insert_case(case, id=case["id"])

    for attachment in attachments:
        vectorstore.insert_attachment(attachment)

    return "Case and Attachments Saved Successfully", 200
