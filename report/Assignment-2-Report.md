# Report for Assignment 2 - Working on Data Ingestion Features

## Introduction
This assignment is built on top of the skeleton of assignment 1, which provides features for reading local csv files and ingest into the database. The main task of assignment 2 is still "Data Ingestion", while this time we presents two different modes for ingesting data, namely batchMode and streamMode. Unlike assignment 1, I take performance into serious consideration, especially when dealing with huge source files in the batchMode. In other words,  the   **mysimbdp-daas** can handle tasks well even been deployed in a virtual machine with minimum hardware configuration. I will illustrate more later on.

## Part 1
### 1 .The ingestion will be applied to files of data as data sources. Design a set of constraints for files that mysimbdp will support for ingestion. Design a set of constraints for the tenant service profile w.r.t. ingestion (e.g., number of files, data sizes). Explain why you as a platform provider decide such constraints. Implement these constraints into simple configuration files and provide examples (e.g., JSON or YAML).
**Constraints 1:** constraint on file type. 
Although the system will do the data wrangling and convert the input into _core data representation_ (CDR) as the outputstream for **mysimbdp-daas** to do the final ingestion job , I set by default that one of the client should place the source files with same format, either .csv or .json in the **client-stage-directory** folder, under **mysimbdp-batchingestmanager** microService. In this submission, I create a **clientbatchingestapp** for client-1 and placed under **mysimbdp-batchingestmanager** microService. this script is suitable for handling source data with .csv extension. Once new .csv files are being added into the **client-stage-directory** folder, **mysimbdp-batchingestmanager** will detect the changes and generate streams for reading, wrangling and posting into the API from **mysimbdp-daas**. This **mysimbdp-batchingestmanager** also support the data source in JSON format or from Database, which can be easier then handling csvs. No matter the format of the source files, we will transfer it into  _core data representation_  , which provides convenience for **mysimbdp-daas** to ingest into **mysimbdp-dms**.

**Constraints 2:** constraint on file size. 
This project performances especially well when handling large or huge files, with millions of records. The main constraints comes from the **Mongo Atlas Cluster ** rather than the **mysimbdp-daas**. I also provide the implementation of the Mongo-Cluster in another separated docker-compose file, but I don't have time to connecting to that one, so I still use **Mongo Atlas Cluster **  this time. It provides 500MB free space from individual users ,so that I set the constraints on file size and file number: the total file sizes cannot exceed 250MB, so that we could support at least two client.  While in the next assignment, once I do the configuration with my own Cluster in Docker-Compose, this constraints is unnecessary then.

I generated the configuration on file_size and file_number in config_ingestion_constraints.json under the Config folder in **mysimbdp-batchingestmananger** microService:
<code>
`
		"client1":  {

	"file_type":  "csv",

	"max_file_size":  26214400,

	"max_files_number":  10

	},

	"client2":  {

	"file_type":  "json",

	"max_file_size":  26214400,

	"max_files_number":  10

	}
`
</code>

Just a short explain on this constraints file. the _max_file_size_ is 25MB and _max_files_number_ is 10, which is 250MB add up.


### 2. Each customer will put files to be ingested into a directory, client-input-directory. Implement a component mysimbdp-fetchdata that automatically detect which files should be ingested based on customer profiles and only move the files from client-input-directory inside mysimbdp (only staging data in; data has not been stored into mysimbdp-coredms yet).

For handling huge source files here, it cost a lot of time for me. Let me illustrate the whole process of the **clientbatchingestapp**:
1. Use **papaparse** to convert local CSV fileStream into JSON object stream. the chunk of JSON objects will be pushed into the inputStream, which will pipe to the csvOutputStream in flow mode, so that no matter the file size, we will only use a roughly constant range of memory, although it may fluctuate a bit. In addition, although the memory usage is fairly small in my case, it is still possible to turn down to **highWaterMark** , which impose constraints of the maximum number of chunks in the stream. In my case, I set it to 5, so that the readable chunks in the csvInputStream will be fairly small.
2. Use csvOutputStream to post chunks. for each chunk of data, which contains around hundreds rows of data(it depends on the size of each row), we will read the chunk from the pipe and send the POST request via library **Axios**.  Similar to csvInputStream, we also set the **highWaterMark** to 5 and **objectMode** to True, otherwise we cannot parse the object correctly. After the first stage of data wrangling, actually we are post chunks of JSON object to **mysimbdp-daas**, which make our job easiler there.
3. detect the 'finish' event of csvOutputStream, then we post to uploadCompleted API to tell **mysimbdp-daas** that this file is fully posted, and please start the ingestion. Since I don't see requirements from verification or data integrity, I don't do that job in the server side. While it can be improved to use Md5 to verify the file content and so on.  

This is the tenant's side of data wrangling and posting to **mysimbdpe-daas**. 

### 3. As mysimbdp provider, design and implement a component mysimbdp-batchingestmanager that invokes tenant's clientbatchingestapp to perform the ingestion when files are available in client-staging-input-directory. mysimbdp imposes the model that clientbatchingestapp has to follow. Explain how mysimbdp-batchingestmanager schedules the execution of clientbatchingestapp for tenants. 

For detecting new files in corresponding format in **client-input-directory** folder, we make use of **chokidar** library, which could detect files changes in the folder, once the new file fulfils the extension and constraints, the **clientbatchingestapp** will start to do the data wrangling and post the file in stream until finishing.

when we received the POST json chunks request in **mysimbdp-daas** from **clientbatchingestapp**, which I gave a example in last answer, there still remains several jobs from **mysimbdp-daas** to ingest data into **mysimbdp-dms**:
1. Create writeStream to append each chunks of data into temporary JSON file in **mysimbdp-daas**. we generate a new writestream for each chunk received from the API. once the write job is done, the writestream will be closed, so that we don't have to worry that those asynchronous will cost a lot of resourses. 
2. Create JSONParseStream using **JSONStream** library. This part cost me a lot of time. At very beginning, I tried to use **bfj**, namely "big json friendly", to read the JSON objects into stream, while then I found out that it cost more memory when dealing with huge file. Rather than read the JSON into a constant part of memory, it tries to store the whole JSON file into memory, which is so bad for our case. So that I turn to **JSONStream**. Under my case, even if we deal with the largest dataset in Airbnb, namely calendar.csv, which has 1 million+ records, the whole nodejs project only cost around 100MB memory. You can see the memory usage output when ingesting data, since I wrote the script to monitor it.
3. Read JSON objects from JSONParseStream by creating a new mongoOutputStream. In order to reduce the cost of opening mongo, closing mongo, and do millions times of Insert job, I create an array buffer there from buffering JSON object. when it reaches _bufferCount_(which, can also be configured in mongoOutputStream), it will sent a InsertMany request to Mongo Cluster.

### 4. Explain your design for the multi-tenancy model in mysimbdp: which parts of mysimbdp will be shared for all tenants, which parts will be dedicated for individual tenants so that you as a platform provider can add and remove tenants based on the principle of pay-per-use. Develop test programs (clientbatchingestapp), test data, and test profiles for tenants according your choice of provisioning models. Show the performance of ingestion tests, including failures and exceptions, for at least 2 different tenants in your test environment and constraints.
Let's see the architecture here:
![Architecture](figures/architecture.jpg)
As we can see from the architecture, the top part, **mysimbdp-dms**, which will be shared as the common destination for all the source data from the clients. Beside, **mysimbdp-daas** will be shared as the the platform for the users, as we provide APIs for the clients side to call.        **mysimbdp-batchIngestManager** will manage each clientbatchingestapp provided by the clients. As clientbatchingestapp  will wrangle the data into the JSON object as CDR, which is for the convenience to the **mysimbdp-daas**.  So that after careful consideration, I decided to share the whole **mysimbdp-daas** for whole request even if the data source is in different type, like csv or json. Each of **clientbatchingestapp** will parse the source data and post the data via the API from **mysimbdp-daas** in CDR format, namely JSON objects.

I have placed the logs of  ingestion tests in logs/ folder, so far I didn't see any failures in the whole ingestion process.  while as we can see that right now **mysimbdp-daas** is a single node server, once we have thousands of users to ingest the data in the same time, the server may run out of memory at that moment, but it can be handled by configuring proxy server and vertical/horizontal scaling for the **mysimbdp-daas** service. Since the service is configured in docker-compose files, it can be easily to scaling in deployment.

### 5. Implement and provide logging features for capturing successful/failed ingestion as well as metrics about ingestion time, data size, etc., for files which have been ingested into mysimbdp. Logging information must be stored in separate files, databases or a monitoring system for analytics of ingestion. Provide and show simple statistical data extracted from logs for individual tenants and for the whole platform with your tests. (1 point)

I make use of winston to do the logging in the system, so that we can see the performance and the memory usage in the **mysimbdp-daas** and **mysimbdp-batchIngestManager**. 
Let's take a glimpse at the logs:
<code>
`
mysimbdp-batchingestmanager    | json uploading DONE
mysimbdp-batchingestmanager    | OUTPUT: rss 53.4 MB
mysimbdp-batchingestmanager    | OUTPUT: heapTotal 19.35 MB
mysimbdp-batchingestmanager    | OUTPUT: heapUsed 11.23 MB
mysimbdp-batchingestmanager    | OUTPUT: external 2.07 MB
mysimbdp-batchingestmanager    | OUTPUT: arrayBuffers 0.09 MB
mysimbdp-batchingestmanager    | complete upload
mysimbdp-batchingestmanager    | csv reading DONE
mysimbdp-batchingestmanager    | INPUT: rss 53.4 MB
mysimbdp-batchingestmanager    | INPUT: heapTotal 19.35 MB
mysimbdp-batchingestmanager    | INPUT: heapUsed 11.25 MB
mysimbdp-batchingestmanager    | INPUT: external 2.07 MB
mysimbdp-batchingestmanager    | INPUT: arrayBuffers 0.09 MB
 | count: 500 chunk length: undefined writable length:  1
mysimbdp-daas                  | OUTPUT: rss 66.85 MB
mysimbdp-daas                  | OUTPUT: heapTotal 21.91 MB
mysimbdp-daas                  | OUTPUT: heapUsed 18.69 MB
mysimbdp-daas                  | OUTPUT: external 18.99 MB
mysimbdp-daas                  | OUTPUT: arrayBuffers 18.01 MB
mysimbdp-daas                  | count: 1000 chunk length: undefined writable length:  1
mysimbdp-daas                  | OUTPUT: rss 67.19 MB
mysimbdp-daas                  | OUTPUT: heapTotal 22.41 MB
mysimbdp-daas                  | OUTPUT: heapUsed 18.55 MB
mysimbdp-daas                  | OUTPUT: external 18.77 MB
mysimbdp-daas                  | OUTPUT: arrayBuffers 17.79 MB
mysimbdp-daas                  | count: 1500 chunk length: undefined writable length:  1
mysimbdp-daas                  | OUTPUT: rss 66.73 MB
mysimbdp-daas                  | OUTPUT: heapTotal 19.41 MB
mysimbdp-daas                  | OUTPUT: heapUsed 17.76 MB
mysimbdp-daas                  | OUTPUT: external 18.84 MB
mysimbdp-daas                  | OUTPUT: arrayBuffers 17.85 MB
mysimbdp-daas                  | count: 2000 chunk length: undefined writable length:  1
mysimbdp-daas                  | OUTPUT: rss 66.45 MB
mysimbdp-daas                  | OUTPUT: heapTotal 18.91 MB
mysimbdp-daas                  | OUTPUT: heapUsed 17.64 MB
mysimbdp-daas                  | OUTPUT: external 18.91 MB
mysimbdp-daas                  | OUTPUT: arrayBuffers 17.93 MB
mysimbdp-daas                  | count: 2500 chunk length: undefined writable length:  1
mysimbdp-daas                  | OUTPUT: rss 66.54 MB
mysimbdp-daas                  | OUTPUT: heapTotal 20.16 MB
mysimbdp-daas                  | OUTPUT: heapUsed 17.37 MB
mysimbdp-daas                  | OUTPUT: external 18.82 MB
mysimbdp-daas                  | OUTPUT: arrayBuffers 17.84 MB
`
</code>
Basically the log covers the memory usage which is triggered after a constant seconds, the ingest process and consume process. As we can see that this project make good use of the asynchronous feature of Node.js, so that the whole process is under high speed and low, consistent memory usage.

## Part 2 - Near-realtime ingestion 
### 1. Tenants will put their data into messages and send the messages to a messaging system, mysimbdp-messagingsystem (provisioned by mysimbdp) and tenants will develop ingestion programs, clientstreamingestapp, which read data from the messaging system and ingest data into mysimbdp-coredms. For near-realtime ingestion, explain your design for the multitenancy model in mysimbdp: which parts of the mysimbdp will be shared for all tenants, which parts will be dedicated for individual tenants so that mysimbdp can add and remove tenants based on the principle of pay-per-use. Design and explain a set of constraints for the tenant service profile w.r.t. data ingestion. (1 point)

For clients who may have csv or json on hand, I provides two different APIs in the **mysimbdp-daas** for handling it.  the API _/streamMode/singleMessage_ is for handling post request with single JSON object, the  **mysimbdp-daas** will publish the single message into the RabbitMQ, on the other hand, the API _/streamMode/smallFileIngest_ is for handling .csv file, we will do the data-wrangling in **mysimbdp-daas**, to parse the small csv into CDR in our  **mysimbdp-daas**. we don't support the user to post huge file here since it may exceed the limit of size for Restful API and the huge one shall be done in batchMode rather than streamMode.

In order to fulfil the principle of pay-per-use, we require the user to provide the client-id in the POST content. In the future, we will detect whether we allow this client to do the streamIngest, but I don't have time to implement it this time. 

### 2. Design and implement a component mysimbdp-streamingestmanager, which invokes on-demand clientstreamingestapp (e.g., start, stop). mysimbdp imposes the model that clientstreamingestapp has to follow, explain the model. 
clientstreamingestapp is placed in microService **mysimbdp-daas** under _Service_ folder, where we require the client to define how to consume the data. In my case, I provide a function called: _messageStoreIntoMongoDB_ there, so that the default messageHandle function is to ingest the data into mongoDB. But it can be replaced by any other clientstreamingestapp.
Let's take a look at the architecture:
![Architecture](figures/architecture-2.jpg)
As we can see, the client will feed the data simply by call the POST api, while we will place their customized **clientstreamingestapp** into the place where I mentioned above.

### 3. Develop test ingestion programs (clientstreamingestapp), test data, and test profiles for tenants. Show the performance of ingestion tests, including failures and exceptions, for at least 2 different tenants in your test environment.
let's see the logs:
<code>
`
	store success on: [x] {"listing_id":20083,"id":31750,"date":"2010-03-28","reviewer_id":76930,"reviewer_name":"Floor","comments":"We stayed at Lovisa's place during 4 days in March, and had a really good time. It is located in the nicest, most trendy area of Stockholm, close to restaurants and shops, but really nice and quiet next to a park. The appartement is clean and has all you need. I would recommend it without any doubt! ","collectionName":"reviews","transferMode":"file","clientId":"1"} [routingKey] stat.allocation
mysimbdp-daas                  | store success on: [x] {"listing_id":20083,"id":2083556,"date":"2012-08-24","reviewer_id":1528283,"reviewer_name":"Jen","comments":"Lovisa's apartment was perfect! It was our first trip to Stockholm and the Sodermalm location was totally ideal. Her apartment is on a quiet street and overlooks a lovely park but is also within a quick walk to the hippest bars, restaurants and boutique shopping. When my boyfriend and I were heading to downtown Stockholm, we would use the city rental bikes and there is a stand very close to Lovisa's apartment. It's about a 20 minute cycle to the central train station and Stockholm bike lanes are well done. The actual apartment was very clean, great design and absolutely ideal for a couple. Lovisa was a pleasure to communicate with and very helpful. It was a wonderful experience and I would most definitely book her cool place again. Thank you Lovisa! ","collectionName":"reviews","transferMode":"file","clientId":"1"} [routingKey] stat.allocation
mysimbdp-daas                  | store success on: [x] {"listing_id":20083,"id":744050,"date":"2011-11-26","reviewer_id":1107665,"reviewer_name":"David","comments":"Lovisa and her apartment are fantastic! She is a wonderful host always happy to provide helpful tips on the apartment and the city. Easy to get to, close enough to the city to walk, and nightlife is even closer. I would recommend to all. I wish I could take the shower home!! Would love to stay again.","collectionName":"reviews","transferMode":"file","clientId":"1"} [routingKey] stat.allocation
mysimbdp-daas                  | store success on: [x] {"listing_id":20083,"id":2348891,"date":"2012-09-19","reviewer_id":3410443,"reviewer_name":"Gabriella","comments":"My husband and I rented Lovisa's flat for a week. I grew up in Stockholm and the flat has in my opinion the perfect location. Södermalm is a very charming part of the city and the flat is located in an idyllic and quiet block. The flat itself was perfect for our stay. Cute, stylish and incredible well taken care of.\n\nLovisa was a great host! Very friendly and seemed to go our her way to make sure we had a good stay. My first impression of the flat was how clean it was and Lovisa had clearly cleaned every corner to make sure it was spotless.\n\nI can highly recommend the flat to anyone wishing to rent a flat in Stockholm. ","collectionName":"reviews","transferMode":"file","clientId":"1"} [routingKey] stat.allocation
mysimbdp-daas                  | store success on: [x] {"listing_id":20083,"id":1377367,"date":"2012-05-29","reviewer_id":1230131,"reviewer_name":"Alfie And Ken","comments":"Lovisa's apartment is absolutely delightful. It is very clean and stylish. Located on the 3rd floor it is quiet and very sunny. \nIt is only a 5 minute walk to the Skanstull metro station and even closer to a multitude of bars restaurants and supermarkets.  \nLovisa is a wonderful host. She provided me with a great guide to local sights and restaurants. \nIt would be a pleasure to stay at her place again. \n","collectionName":"reviews","transferMode":"file","clientId":"1"} [routingKey] stat.allocation
mysimbdp-daas                  | store success on: [x] {"listing_id":20083,"id":41340,"date":"2010-05-10","reviewer_id":72535,"reviewer_name":"Lauren","comments":"I rented this flat for my parents while they were visiting me in Sweden.  It worked out great!  Lovisa's place was cute, clean, and located in a great area of Södermalm - still close to restaurants but in a quiet area next to a park.  Great place to rent - Enjoy!","collectionName":"reviews","transferMode":"file","clientId":"1"} [routingKey] stat.allocation
mysimbdp-daas                  | store success on: [x] {"listing_id":20083,"id":377986,"date":"2011-07-17","reviewer_id":669200,"reviewer_name":"Emma","comments":"Lovisa's flat is an amazing place to stay in Stockholm - located in a 1920s housing development on a small hill and surrounded by parks, the area feels calm and secluded even though it's minutes from Skanstull's underground station, bars, restaurants and great shopping. The flat itself is beautiful, with lots of light, wooden floors and a fantastic kitchen, and Lovisa is a very helpful and organised host. I would definitely stay there again, and can thoroughly recommend it. ","collectionName":"reviews","transferMode":"file","clientId":"1"} [routingKey] stat.allocation
mysimbdp-daas                  | store success on: [x] {"listing_id":20083,"id":301747,"date":"2011-06-07","reviewer_id":41538,"reviewer_name":"Barbara","comments":"We just loved Lovisas flat!  The perfect place for one or two personnes: freshly renovated, perfectly clean, very quiet and modern. The appartment is located in a very lively and popular area of Stockholm with lots of cafes and stores and just a short distance from the old town. \nLovisa is a very friendly and helpful host. Using her bikes was a great thing  to explore Stockholm. Thanks for that, Lovisa! We highly recommend her place for your stay in Stockholm. ","collectionName":"reviews","transferMode":"file","clientId":"1"} [routingKey] stat.allocation
`
</code>
those are the sample logs when I post small csv files into the system. Once the message is consumed and acked, I will generated a callback message from Promise to the log.

### 5. Implement the feature in mysimbdp-streamingestmonitor to receive the report from clientstreamingestapp. Based on the report from clientstreamingestapp and the tenant profile, when the performance is below a threshold, e.g., average ingestion time is too low, or too many messages have to be processed, mysimbdp-streamingestmonitor decides to inform mysimbdp-streamingestmanager about the situation (e.g., mysimbdp-streamingestmanager may create more instances of clientstreamingestapp for the tenant or remove existing instances). Implementation the integration between mysimbdpstreamingestmonitor and mysimbdp-streamingestmanager. 
While I think based on my system, it is just a further step, but I don't have time... sorry.

## 3. Part 3 - Integration and Extension
### 4. In the case of batch ingestion, we want to (i) detect the quality of data to allow ingestion only for data with a pre-defined quality of data condition and (ii) store metadata, including detected quality, into the platform, how you, as a platform provider, and your tenants can work together?
 In my case case, for example, I could add a data schema validation MongoDB level for each collection via library such as Mongoose. Then, when ingesting data to a collection from the client app, this schema would be checked and if not satisfied by the data request an error information message is sent back to the client. Note that this schema should be discussed and agreed by both parties, client and platform provider.

### 5. If a consumer has multiple clientbatchingestapp and clientstreamingestapp, each is suitable for a type of messages or files, how would you extend your design and implementation in Parts 1 & 2 (only explain the concept/design) to support this requirement.
No problem, this situation has already been handled well in my system. For batch mode, the client side script can send to server in the same format no matter the request file type is. For near-realtime mode, the client side script can also send to message broker through the corresponding _RabbitMQ_ topic and then the manager can simply open a client app and the corresponding _RabbitMQ_ topic.




