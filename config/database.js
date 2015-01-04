/*
** ElasticSearch configuration
*/


var server = {
	host: 'localhost:9200',
	index: 'hunterxuiba'
};

if (_TEST_) {
	server.host = 'localhost:9200';
	server.index = 'hunterxuiba-tests';
}

if (_PRODUCTION_) {
	// server.host
	// server.username = '...';
	// server.password = '...';
}

exports.excluded = ['from', 'to', 'fields'];

exports.settings = {
	"number_of_shards" : 1,
	"number_of_replicas": 0,
    "analysis": {
        "filter": {
            "autocomplete_filter": { 
                "type":     "edge_ngram",
                "min_gram": 1,
                "max_gram": 20
            },
            "nGram_filter": {
               "type": "nGram",
               "min_gram": 2,
               "max_gram": 20,
               "token_chars": [
                  "letter",
                  "digit",
                  "punctuation",
                  "symbol"
               ]
            }
        },
        "analyzer": {
            "autocomplete": {
                "type":      "custom",
                "tokenizer": "standard",
                "filter": [
                    "lowercase",
                    "autocomplete_filter" 
                ]
            },
            "nGram_analyzer": {
               "type": "custom",
               "tokenizer": "whitespace",
               "filter": [
                  "lowercase",
                  "asciifolding",
                  "nGram_filter"
               ]
            },
            "whitespace_analyzer": {
               "type": "custom",
               "tokenizer": "whitespace",
               "filter": [
                  "lowercase",
                  "asciifolding"
               ]
            }
        }
    }
};

exports.types = {
	'Offers': {
		mapping: {
            "_all": {
                "index_analyzer": "nGram_analyzer",
                "search_analyzer": "whitespace_analyzer"
             },
			"properties": {
				"name": { type: "string", "analyzer": "simple" }
    		}
    	}
	},
	"Resumes": {
		mapping: {
            "_all": {
                "index_analyzer": "nGram_analyzer",
                "search_analyzer": "whitespace_analyzer"
             },
			"properties": {
				"name": { type: "string", "analyzer": "simple" }
    		}
    	}
	}
};

exports.server = server;