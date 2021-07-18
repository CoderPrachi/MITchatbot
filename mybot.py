# things we need for NLP
import nltk
nltk.download('punkt')
from nltk.stem.lancaster import LancasterStemmer
stemmer = LancasterStemmer()

# things we need for Tensorflow
import numpy as np
import tflearn
import tensorflow as tf
import random

print("******************************************test*********************")

debug = False

# import our chat-bot intents file
import json
with open('intents.json') as json_data:
    intents = json.load(json_data)
    
#Each conversational intent contains
#a tag (a unique name)
#patterns (sentence patterns for our neural network text classifier)
#responses (one will be used as a response)

words = []
classes = [] #each document is associated with an intent (or class)
documents = [] #a list of sentences
ignore_words = ['?']

# loop through each sentence in our intents patterns and build a bag of words
for intent in intents['intents']:
    for pattern in intent['patterns']:
        
        # tokenize each word in the sentence
        w = nltk.word_tokenize(pattern)
        # add to our words list
        words.extend(w)
        # add to documents in our corpus
        documents.append((w, intent['tag']))
        # add to our classes list
        if intent['tag'] not in classes:
            classes.append(intent['tag'])

# stem and lower each word and remove duplicates
words = [stemmer.stem(w.lower()) for w in words if w not in ignore_words]
words = sorted(list(set(words)))

# remove duplicates
classes = sorted(list(set(classes)))

if debug == True: 
    print (len(documents), "documents", documents)
    print (len(classes), "classes", classes)
    print (len(words), "unique stemmed words", words)

training = []
output = []
# create an empty array for our output
output_empty = [0] * len(classes)

# training set, bag of words for each sentence
for doc in documents:
    # initialize our bag of words
    bag = []
    # list of tokenized words for the pattern
    pattern_words = doc[0]
    # stem each word
    pattern_words = [stemmer.stem(word.lower()) for word in pattern_words]
    
    # create our bag of words array (this will be the input x)
    if debug == True: print("pattern words", pattern_words)
    
    for w in words:
        bag.append(1) if w in pattern_words else bag.append(0)
    
    if debug == True: print("bag",bag)
    
    # identify the class for the current (this will be the output y)
    # output is a '0' for each tag and '1' for current tag
    output_row = list(output_empty)
    output_row[classes.index(doc[1])] = 1
    
    training.append([bag, output_row])

random.shuffle(training)
training = np.array(training)

train_x = list(training[:,0])
train_y = list(training[:,1])

# reset underlying graph data
from tensorflow.python.framework import ops
ops.reset_default_graph()

# Build neural network
net = tflearn.input_data(shape=[None, len(train_x[0])])
net = tflearn.fully_connected(net, 8)
net = tflearn.fully_connected(net, 8)
net = tflearn.fully_connected(net, len(train_y[0]), activation='softmax')
net = tflearn.regression(net)

# Define model and setup tensorboard
model = tflearn.DNN(net, tensorboard_dir='tflearn_logs')
# Start training (apply gradient descent algorithm)
model.fit(train_x, train_y, n_epoch=1000, batch_size=8, show_metric=True)
model.save('model.tflearn')


def clean_up_sentence(sentence):
    # tokenize the pattern
    sentence_words = nltk.word_tokenize(sentence)
    # stem each word
    sentence_words = [stemmer.stem(word.lower()) for word in sentence_words]
    return sentence_words

# return bag of words array: 0 or 1 for each word in the bag that exists in the sentence
def bow(sentence, words, show_details=False):
    # tokenize the pattern
    if debug==True: print("sentence", sentence)
    sentence_words = clean_up_sentence(sentence)
    if debug==True: print("tokenized sentence", sentence_words)
    # bag of words
    bag = [0]*len(words)  
    for s in sentence_words:
        for i,w in enumerate(words):
            if w == s: 
                bag[i] = 1
                if show_details:
                    print ("found in bag: %s" % w)
    if debug==True: print("bag of words",np.array(bag))
    return(np.array(bag))

context = {}

ERROR_THRESHOLD = 0.25
def classify(sentence):
    # generate probabilities from the model
    results = model.predict([bow(sentence, words)])[0]
    if debug==True: print("model prediction of bag (bag returns probability of each class):", results)
    # filter out predictions below a threshold
    results = [[i,r] for i,r in enumerate(results) if r>ERROR_THRESHOLD]
    # sort by strength of probability
    results.sort(key=lambda x: x[1], reverse=True)
    return_list = []
    for r in results:
        return_list.append((classes[r[0]], r[1]))
    # return tuple of intent and probability
    if debug==True: print("model prediction list:", return_list)
    return return_list

def response(sentence, userID='123', show_details=True):
    results = classify(sentence)
    print("myresult",results[0][0])
    if results[0][0]=="mentors":
        print("database")
    if debug==True: print("results:", results)
    # if we have a classification then find the matching intent tag
    elif results:
        # loop as long as there are matches to process
        while results:
            for i in intents['intents']:
                # find a tag matching the first result
                if i['tag'] =="mentor":
                    print("database")
                #print(i['tag'])
                if i['tag'] == results[0][0]:
                    
                    if debug==True: print("associated data:", i)
                    # set context for this intent if necessary
                    if 'context_set' in i:
                        if show_details: print ('set context:', i['context_set'])
                        context[userID] = i['context_set']

                    # check if this intent is contextual and applies to this user's conversation
                    if debug == True: print("context:", context)
                    
                    if not 'context_filter' in i or \
                        (userID in context and 'context_filter' in i and i['context_filter'] == context[userID]):
                        #print(userID, context)
                        if show_details: print ('tag:', i['tag'])
                        # a random response from the intent
                        #return print(random.choice(i['responses']))
                        return (random.choice(i['responses']))
                        
            results.pop(0)

from flask import Flask,jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/msgIn/<string:msg>",methods=["POST","GET"])
def chat(msg):
    #print("Start talking with the bot and use the word quit to end the session")
    #while True:
    #inp= input("You:")
    if msg.lower() == "quit": #end the session once you type "quit"
        msgs = {"msg1":"Chatbot CLosed"}
        #break

    resp = response(msg, show_details=False)
    msgs = {"msg1":f"{resp}"}
    return jsonify(msgs)

from textblob import TextBlob

@app.route("/msgAnalysis/<string:msges>",methods=["POST","GET"])
def chat_analysis(msges):
    blob = TextBlob(msges)
    msgsAnalysis = blob.polarity
    finalAnalysis = {"msgSenti":f"{msgsAnalysis}"}
    return jsonify(finalAnalysis)




print("***************************************************test2222222222222")
#chat()
if __name__ == "__main__":
    app.run(debug=True)

