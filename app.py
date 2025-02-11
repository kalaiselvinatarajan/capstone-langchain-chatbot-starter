import os
from flask import Flask, render_template
from flask import request, jsonify, abort
from dotenv import load_dotenv

from langchain.llms import Cohere
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain
from langchain.prompts import PromptTemplate

from langchain.chains import RetrievalQA
from langchain.embeddings import CohereEmbeddings
from langchain.vectorstores import Chroma

app = Flask(__name__)

# Load environment variables
load_dotenv()

# Conversation memory to store past interactions
memory = ConversationBufferMemory()

# chat prompt template defination
chat_prompt = PromptTemplate(
    input_variables=["history", "input"],
    template="""
You are a helpful AI assistant. You remember previous interactions with the user.

Chat History:
{history}

User: {input}
Assistant:"""
)
cohere_model = Cohere(cohere_api_key=os.getenv("COHERE_API_KEY"))

# Create a conversation chain with memory
conversation = ConversationChain(
    llm=cohere_model,
    prompt=chat_prompt,
    memory=memory
)

def load_db():
    try:
        embeddings = CohereEmbeddings(cohere_api_key=os.getenv("COHERE_API_KEY"))
        vectordb = Chroma(persist_directory='db', embedding_function=embeddings)
        qa = RetrievalQA.from_chain_type(
            llm=Cohere(),
            chain_type="refine",
            retriever=vectordb.as_retriever(),
            return_source_documents=True
        )
        return qa
    except Exception as e:
        print("Error:", e)

qa = load_db()

def answer_from_knowledgebase(message):
    res = qa({"query": message})
    return res['result']

def search_knowledgebase(message):
    res = qa({"query": message})
    sources = ""
    for count, source in enumerate(res['source_documents'],1):
        sources += "Source " + str(count) + "\n"
        sources += source.page_content + "\n"
    return sources

def answer_as_chatbot(message):
    response = conversation.predict(input=message)
    return response.strip()

@app.route('/kbanswer', methods=['POST'])
def kbanswer():
    
    #API endpoint to fetch an answer from the knowledge base.
    
    data = request.json
    message = data.get("message", "")

    if not message:
        return jsonify({"error": "Message is required"}), 400

    response = answer_from_knowledgebase(message)

    return jsonify({"message": response}), 200
     

@app.route('/search', methods=['POST'])
def search():    
    # Search the knowledgebase and generate a response
    data = request.json
    message = data.get("message", "")

    if not message:
        return jsonify({"error": "Message is required"}), 400

    response = search_knowledgebase(message)

    return jsonify({"message": response}), 200

@app.route('/answer', methods=['POST'])
def answer():
    message = request.json['message']
    
    # Generate a response
    response_message = answer_as_chatbot(message)
    
    # Return the response as JSON
    return jsonify({'message': response_message}), 200

@app.route("/")
def index():
    return render_template("index.html", title="")

if __name__ == "__main__":
    app.run()